/**
 * sync-votes.ts
 * Sincroniza votos reais de pautas evangelicamente relevantes da API da Câmara.
 *
 * Descobertas chave sobre a API:
 *  - Somente votações com "Sim:" na descrição têm votos individuais disponíveis
 *  - Votações em comissões (CPASF, CDE...) retornam 0 votos mesmo que existam
 *  - O endpoint /orgaos/180/votacoes (PLEN) funciona; /votacoes com filtros → 400
 *  - Para conteúdo evangelicamente relevante, buscamos ementa via uriProposicaoCitada
 */
import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SCAN_RULES, SCAN_RULES_VERSION, matchScanRule, type ScanRule } from './lib/scan-rules';
import { paginar, relatarCobertura, PAGE_SIZE, type Cobertura } from './lib/paginacao';

const prisma = new PrismaClient();
const BASE = 'https://dadosabertos.camara.leg.br/api/v2';

// ── Trimestres da 57ª legislatura ─────────────────────────────────────────────
function quarters(): Array<[string, string]> {
  const result: Array<[string, string]> = [];
  const start = new Date('2023-02-01');
  const end = new Date();
  let cur = start;
  while (cur < end) {
    const next = new Date(cur);
    next.setMonth(next.getMonth() + 3);
    const s = cur.toISOString().slice(0, 10);
    const e = (next < end ? next : end).toISOString().slice(0, 10);
    result.push([s, e]);
    cur = next;
  }
  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch { return null; }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

type VoteType = 'YES' | 'NO' | 'ABSTENTION' | 'OBSTRUCTION' | 'ABSENT';

function toVoteType(tipo: string): VoteType {
  const u = tipo.toUpperCase();
  if (u === 'SIM') return 'YES';
  if (u.startsWith('N') || u === 'NAO' || u === 'NÃO') return 'NO';
  if (u.includes('ABSTEN')) return 'ABSTENTION';
  if (u.includes('OBSTRU')) return 'OBSTRUCTION';
  return 'ABSENT';
}

function appliedScore(vt: VoteType, rule: ScanRule): number {
  if (vt === 'YES') return rule.simIsPositive ? rule.weight : -rule.weight;
  if (vt === 'NO') return rule.simIsPositive ? -rule.weight : rule.weight;
  return 0;
}

interface CamaraVoto { tipoVoto: string; deputado_: { id: number; nome?: string } }
interface CamaraVotacaoBrief { id: string; data: string; descricao?: string; proposicaoObjeto?: string }
interface CamaraProposicaoAfetada { id: number; uri: string; siglaTipo: string; numero?: number; ano?: number }
interface CamaraVotacaoDetail {
  id: string; data: string; descricao?: string; siglaOrgao?: string;
  ultimaApresentacaoProposicao?: {
    descricao?: string;
    uriProposicaoCitada?: string;
  };
  /** Proposições às quais esta votação se refere — a cadeia que salva os
   * títulos quando a apresentação é um parecer procedural (achado real
   * 2026-08-22: PPP tem uriPropPrincipal=null e ano=0, mas a votação
   * aponta direto pro PL real aqui). */
  proposicoesAfetadas?: CamaraProposicaoAfetada[];
}
interface CamaraProposicao { ementa?: string; keywords?: string; ano?: number; numero?: number; siglaTipo?: string }

// ── Buscar ementa da proposição referenciada ───────────────────────────────────
interface ProposicaoInfo {
  /** Texto completo pra casamento de keywords (descrições + ementa + keywords) */
  fullText: string;
  /** Dados estruturados da proposição citada, se houver */
  prop: CamaraProposicao | null;
}

async function getProposicaoInfo(votacaoDetail: CamaraVotacaoDetail): Promise<ProposicaoInfo> {
  const ap = votacaoDetail.ultimaApresentacaoProposicao;
  const parts: string[] = [
    votacaoDetail.descricao ?? '',
    ap?.descricao ?? '',
  ];

  let prop: CamaraProposicao | null = null;
  const uri = ap?.uriProposicaoCitada;
  if (uri) {
    const fetched = await fetchJson<{ dados: CamaraProposicao }>(uri);
    if (fetched?.dados) {
      prop = fetched.dados;
      parts.push(prop.ementa ?? '');
      parts.push(prop.keywords ?? '');
    }
    await sleep(200);
  }

  // Cadeia de fallback: pareceres procedurais (PPP/RPD etc.) vêm com
  // ano=0 e ementa procedural ("Leitura realizada em Plenário…") — não
  // servem de título. Quando a proposição citada for desse tipo, segue
  // por proposicoesAfetadas até achar matéria substantiva (PL/PLP/PEC/
  // MPV/PDC/SDC), que é o projeto de verdade por trás do parecer.
  const isProcedural = (p: CamaraProposicao | null) =>
    !p?.ementa || !p.ano || /^(PPP|REQ|RPD|RDT|REC)$/i.test(p.siglaTipo ?? '');
  if (isProcedural(prop) && votacaoDetail.proposicoesAfetadas?.length) {
    const alvo =
      votacaoDetail.proposicoesAfetadas.find(p => /^(PL|PLP|PEC|MPV|PDC|SDC)/i.test(p.siglaTipo)) ??
      votacaoDetail.proposicoesAfetadas[0];
    if (alvo?.uri) {
      const fetched = await fetchJson<{ dados: CamaraProposicao }>(alvo.uri);
      if (fetched?.dados?.ementa && !isProcedural(fetched.dados)) {
        prop = fetched.dados;
        parts.push(prop.ementa ?? '', prop.keywords ?? '');
      }
    }
    await sleep(200);
  }

  return { fullText: parts.filter(Boolean).join(' '), prop };
}

/** Título legível a partir da proposição — mata títulos crus do Plenário
 * como "Mantido o texto." que não dizem nada pro eleitor (achado real
 * 2026-08-21: o title antigo vinha de proposicaoObjeto/descrição). */
function buildEnrichedTitle(prop: CamaraProposicao | null): string | null {
  if (!prop?.siglaTipo || !prop.numero || !prop.ano || !prop.ementa) return null;
  const ref = `${prop.siglaTipo} ${prop.numero}/${prop.ano}`;
  return `${ref} — ${prop.ementa.trim()}`.slice(0, 200);
}

// ── Registrar votos individuais de uma votação ────────────────────────────────
async function processVotacao(
  votacaoId: string,
  agendaId: string,
  rule: ScanRule,
  votacaoDate: string,
  description: string,
): Promise<number> {
  const data = await fetchJson<{ dados: CamaraVoto[] }>(`${BASE}/votacoes/${votacaoId}/votos`);
  const votos = data?.dados ?? [];
  if (votos.length === 0) return 0;

  let count = 0;
  for (const voto of votos) {
    const pol = await prisma.politician.findFirst({
      where: { legislature_id: voto.deputado_.id.toString(), is_active: true },
      select: { id: true },
    });
    if (!pol) continue;

    const vt = toVoteType(voto.tipoVoto);
    const score = appliedScore(vt, rule);

    try {
      await prisma.vote.upsert({
        where: { politician_id_key_agenda_id_source_vote_id: {
          politician_id: pol.id, key_agenda_id: agendaId, source_vote_id: votacaoId,
        }},
        create: {
          politician_id: pol.id, key_agenda_id: agendaId,
          vote_type: vt, applied_score: score,
          vote_date: new Date(votacaoDate), source: 'CAMARA',
          source_vote_id: votacaoId,
          voting_description: description.slice(0, 500),
        },
        update: { vote_type: vt, applied_score: score },
      });
      count++;
    } catch { /* upsert conflict — ignore */ }
  }
  return count;
}

// ── Varredura trimestral do plenário ──────────────────────────────────────────
async function scanPlenario(): Promise<{ agendas: number; votes: number; checked: number; cobertura: Cobertura }> {
  let agendas = 0, votes = 0, checked = 0;
  const coberturaPorPeriodo: Array<{ Existing: number; Vistas: number }> = [];
  const qs = quarters();

  for (const [start, end] of qs) {
    process.stdout.write(`\n📅 Varrendo PLEN ${start} → ${end} ... `);

    // PAGINAÇÃO (2026-09-26, docs/AUDITORIA-VOTACOES.md). Antes pedia
    // `?itens=200` e nunca passava `pagina`: a API ignora itens acima de
    // 100, então o sync via só a PRIMEIRA página de cada trimestre. Medido:
    // 244 das 830 votações substantivas — 29% de cobertura, e piorava com
    // o tempo porque a API ordena por data e o período recente fica no fim.
    // Consequência já vista: 39% das nossas pautas só têm o requerimento de
    // urgência, sem a votação de mérito.
    const { itens: votacoes, paginas, suspeitaTruncamento } = await paginar<CamaraVotacaoBrief>(
      async (pagina) => {
        const data = await fetchJson<{ dados: CamaraVotacaoBrief[] }>(
          `${BASE}/orgaos/180/votacoes?dataInicio=${start}&dataFim=${end}&itens=${PAGE_SIZE}&pagina=${pagina}`
        );
        return data?.dados ?? [];
      }
    );
    if (suspeitaTruncamento) {
      process.stdout.write(`\n   ⚠️  ${start}→${end}: bateu no teto de páginas, pode haver mais\n`);
    }
    process.stdout.write(`${votacoes.length} votações em ${paginas} página(s)\n`);

    // Apenas votações substantivas (têm votos individuais)
    const substantivas = votacoes.filter(v => (v.descricao ?? '').includes('Sim:'));
    process.stdout.write(`   ${substantivas.length} substantivas (com contagem Sim/Não)\n`);
    // Guardado para o relatório de cobertura do SyncLog: o que foi visto
    // contra o que existe. Sem isso, uma regressão de paginação aparece só
    // como "a nota ficou estranha", e é assim que este bug sobreviveu 3 anos.
    coberturaPorPeriodo.push({ Existing: votacoes.length, Vistas: substantivas.length });

    for (const v of substantivas) {
      checked++;

      // Detalhe + proposição SEMPRE — além de casar keywords pela ementa
      // (quando a descrição não basta), fornece o título legível pro card.
      await sleep(200);
      const detail = await fetchJson<{ dados: CamaraVotacaoDetail }>(`${BASE}/votacoes/${v.id}`);
      if (!detail?.dados) continue;

      const { fullText, prop } = await getProposicaoInfo(detail.dados);
      const rule = matchScanRule(`${v.descricao ?? ''} ${v.proposicaoObjeto ?? ''} ${fullText}`);
      if (!rule) continue;

      process.stdout.write(`   ✓ ${v.id} (${v.data.slice(0,10)}) → ${rule.criteria}\n`);

      // Título enriquecido: "PL 1904/2024 — <ementa>" em vez de "Mantido o texto."
      const enrichedTitle = buildEnrichedTitle(prop);
      // Descrição: ementa (contexto do que é a matéria) + o que aconteceu no Plenário
      const enrichedDescription = [
        prop?.ementa ?? '',
        detail.dados.ultimaApresentacaoProposicao?.descricao ?? '',
        v.descricao ?? '',
      ].filter(Boolean).join(' · ').slice(0, 500);

      // Criar/buscar KeyAgenda — e ENRIQUECER agendas antigas no re-run
      // (idempotente: só atualiza se mudou; corrige títulos crus já no banco)
      const existingAgenda = await prisma.keyAgenda.findFirst({ where: { source_id: v.id, source: 'CAMARA' } });
      let agenda = existingAgenda;
      if (existingAgenda) {
        const needsTitle = Boolean(enrichedTitle) && existingAgenda.title !== enrichedTitle;
        const needsDescription = Boolean(enrichedDescription) && existingAgenda.description !== enrichedDescription;
        const needsKeywords = existingAgenda.keywords.join(',') !== rule.keywords.join(',');
        const needsRulesVersion = existingAgenda.rules_version !== SCAN_RULES_VERSION;
        if (needsTitle || needsDescription || needsKeywords || needsRulesVersion) {
          await prisma.keyAgenda.update({
            where: { id: existingAgenda.id },
            data: {
              ...(enrichedTitle ? { title: enrichedTitle } : {}),
              ...(enrichedDescription ? { description: enrichedDescription } : {}),
              ...(needsKeywords ? { keywords: rule.keywords } : {}),
              ...(needsRulesVersion ? { rules_version: SCAN_RULES_VERSION } : {}),
            },
          });
          process.stdout.write(`   ↻ agenda enriquecida com ementa\n`);
        }
      } else {
        agenda = await prisma.keyAgenda.create({
          data: {
            title: (enrichedTitle ?? v.proposicaoObjeto ?? v.descricao ?? v.id).slice(0, 200),
            description: (enrichedDescription || v.descricao || '').slice(0, 500),
            criteria: rule.criteria,
            positive_weight: rule.weight,
            negative_weight: -rule.weight,
            source: 'CAMARA', source_id: v.id,
            source_url: `${BASE}/votacoes/${v.id}`,
            keywords: rule.keywords, status: 'ACTIVE', priority: rule.priority,
            rules_version: SCAN_RULES_VERSION,
          },
        });
        agendas++;
      }

      // Registrar votos individuais
      await sleep(300);
      const n = await processVotacao(v.id, agenda.id, rule, v.data, v.descricao ?? '');
      process.stdout.write(`   → ${n} votos individuais registrados\n`);
      votes += n;
      await sleep(400);
    }

    await sleep(600); // pausa entre trimestres
  }

  // COBERTURA no retorno e no SyncLog: o que foi visto contra o que existe.
  // A regressão que importa é essa, e ela precisa ficar no histórico.
  return { agendas, votes, checked, cobertura: relatarCobertura(coberturaPorPeriodo) };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🗳️  Sincronização de votos reais — Plenário da Câmara (57ª legislatura)\n');
  console.log('   Critério: somente votações PLEN com contagem Sim/Não (votos individuais disponíveis)');
  console.log('   Período: Fevereiro/2023 → Hoje\n');

  const result = await scanPlenario();

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✅ Sincronização concluída:`);
  console.log(`   Votações PLEN verificadas: ${result.checked}`);
  console.log(`   Key agendas criadas:       ${result.agendas}`);
  console.log(`   Votos individuais salvos:  ${result.votes}`);
  console.log(`   Cobertura: ${result.cobertura.vistas} de ${result.cobertura.existentes} votações com voto (${result.cobertura.percentual}%)`);
  console.log(`${'─'.repeat(60)}`);

  // Trilha de auditoria (2026-09-16): syncs de votos NUNCA gravavam SyncLog
  // — ficavam invisíveis no histórico público e no /last-sync. Agora entram
  // como VOTES, permitindo verificar frescor de votações de verdade.
  await prisma.syncLog.create({
    data: {
      sync_type: 'VOTES',
      source: 'CAMARA',
      status: 'SUCCESS',
      start_time: new Date(),
      end_time: new Date(),
      records_processed: result.checked,
      records_inserted: result.agendas + result.votes,
      records_updated: 0,
      records_failed: 0,
      details: {
        action: 'sync_votes_camara',
        checked: result.checked,
        // Regressão de paginação aparece AQUI, e não como "a nota ficou
        // estranha" três dias depois.
        cobertura: { ...result.cobertura },
        agendasCreated: result.agendas,
        votesSaved: result.votes,
      },
    },
  });

  if (result.votes > 0) {
    console.log('\n💡 Próximo passo: pnpm scores:recalculate');
  } else {
    console.log('\n⚠️  Nenhum voto registrado. Verifique as keywords ou conexão com a API.');
  }
}

// Roda só se este arquivo for o entry point (achado real 2026-08-20,
// mesma correção dos outros scripts de sync).
// pathToFileURL: o guard antigo (`file://${argv[1]}`) falhava SILENCIOSAMENTE
// em caminhos com espaço/acento (import.meta.url vem percent-encoded) — script
// não rodava e saía 0. Achado real 2026-08-23 rodando da máquina local.
const isEntryPoint = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntryPoint) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
