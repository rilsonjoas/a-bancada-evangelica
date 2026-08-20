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

const prisma = new PrismaClient();
const BASE = 'https://dadosabertos.camara.leg.br/api/v2';

// ── Critérios e keywords evangelicamente relevantes ────────────────────────────
type Criteria = 'LIFE_PROTECTION' | 'FAMILY_VALUES' | 'MORAL_INTEGRITY' | 'SOCIAL_RESPONSIBILITY' | 'RELIGIOUS_FREEDOM';

interface ScanRule {
  criteria: Criteria;
  keywords: string[];
  // Positivo se votar SIM = alinhamento evangélico
  simIsPositive: boolean;
  weight: number;   // pontuação aplicada (pode ser negativa se simIsPositive=false)
  priority: number;
}

const SCAN_RULES: ScanRule[] = [
  // Proteção à vida
  { criteria: 'LIFE_PROTECTION', keywords: ['aborto', 'nascituro', 'eutanasia', 'interrupcao da gravidez'], simIsPositive: false, weight: 20, priority: 5 },
  { criteria: 'LIFE_PROTECTION', keywords: ['protecao da vida', 'direito a vida', 'crime contra a vida', 'homicidio'], simIsPositive: true, weight: 15, priority: 4 },
  // Família
  { criteria: 'FAMILY_VALUES', keywords: ['familia', 'casamento', 'adocao', 'menor de idade', 'crianca', 'estatuto da crianca'], simIsPositive: true, weight: 15, priority: 4 },
  { criteria: 'FAMILY_VALUES', keywords: ['identidade de genero', 'diversidade sexual', 'homoafetiv', 'transexual'], simIsPositive: false, weight: 15, priority: 4 },
  // Integridade moral
  { criteria: 'MORAL_INTEGRITY', keywords: ['corrupcao', 'improbidade', 'ficha limpa', 'transparencia publica', 'lei anticorrupcao'], simIsPositive: true, weight: 15, priority: 4 },
  { criteria: 'MORAL_INTEGRITY', keywords: ['amnistia', 'anistia', 'prescricao', 'indulto'], simIsPositive: false, weight: 12, priority: 3 },
  // Social
  { criteria: 'SOCIAL_RESPONSIBILITY', keywords: ['assistencia social', 'bolsa familia', 'beneficio social', 'populacao em situacao de rua'], simIsPositive: true, weight: 10, priority: 3 },
  { criteria: 'SOCIAL_RESPONSIBILITY', keywords: ['saude publica', 'sus', 'atendimento a vitimas'], simIsPositive: true, weight: 8, priority: 2 },
  // Liberdade Religiosa
  { criteria: 'RELIGIOUS_FREEDOM', keywords: ['liberdade religiosa', 'discriminacao religiosa', 'intolerancia religiosa', 'expressao religiosa'], simIsPositive: true, weight: 20, priority: 5 },
  { criteria: 'RELIGIOUS_FREEDOM', keywords: ['laicidade', 'ensino religioso', 'crenca'], simIsPositive: true, weight: 10, priority: 3 },
];

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

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function matchRule(text: string): ScanRule | null {
  const n = normalize(text);
  for (const rule of SCAN_RULES) {
    if (rule.keywords.some(kw => n.includes(normalize(kw)))) return rule;
  }
  return null;
}

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
interface CamaraVotacaoDetail {
  id: string; data: string; descricao?: string; siglaOrgao?: string;
  ultimaApresentacaoProposicao?: {
    descricao?: string;
    uriProposicaoCitada?: string;
  };
}
interface CamaraProposicao { ementa?: string; keywords?: string; ano?: number; numero?: number; siglaTipo?: string }

// ── Buscar ementa da proposição referenciada ───────────────────────────────────
async function getProposicaoEmenta(votacaoDetail: CamaraVotacaoDetail): Promise<string> {
  const ap = votacaoDetail.ultimaApresentacaoProposicao;
  const parts: string[] = [
    votacaoDetail.descricao ?? '',
    ap?.descricao ?? '',
  ];

  const uri = ap?.uriProposicaoCitada;
  if (uri) {
    const prop = await fetchJson<{ dados: CamaraProposicao }>(uri);
    if (prop?.dados) {
      parts.push(prop.dados.ementa ?? '');
      parts.push(prop.dados.keywords ?? '');
    }
    await sleep(200);
  }

  return parts.filter(Boolean).join(' ');
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
async function scanPlenario(): Promise<{ agendas: number; votes: number; checked: number }> {
  let agendas = 0, votes = 0, checked = 0;
  const qs = quarters();

  for (const [start, end] of qs) {
    process.stdout.write(`\n📅 Varrendo PLEN ${start} → ${end} ... `);

    const data = await fetchJson<{ dados: CamaraVotacaoBrief[] }>(
      `${BASE}/orgaos/180/votacoes?dataInicio=${start}&dataFim=${end}&itens=200`
    );
    const votacoes = data?.dados ?? [];
    process.stdout.write(`${votacoes.length} votações\n`);

    // Apenas votações substantivas (têm votos individuais)
    const substantivas = votacoes.filter(v => (v.descricao ?? '').includes('Sim:'));
    process.stdout.write(`   ${substantivas.length} substantivas (com contagem Sim/Não)\n`);

    for (const v of substantivas) {
      checked++;

      // 1. Verificar por keywords diretas na descrição
      let rule = matchRule(`${v.descricao ?? ''} ${v.proposicaoObjeto ?? ''}`);

      // 2. Se não encontrou, buscar detalhe com ementa da proposição
      if (!rule) {
        await sleep(200);
        const detail = await fetchJson<{ dados: CamaraVotacaoDetail }>(`${BASE}/votacoes/${v.id}`);
        if (detail?.dados) {
          const fullText = await getProposicaoEmenta(detail.dados);
          rule = matchRule(fullText);
          if (rule) {
            process.stdout.write(`   ✓ ${v.id} (${v.data.slice(0,10)}) → ${rule.criteria} via ementa\n`);
          }
        }
        await sleep(200);
      } else {
        process.stdout.write(`   ✓ ${v.id} (${v.data.slice(0,10)}) → ${rule.criteria} via descrição\n`);
      }

      if (!rule) continue;

      // 3. Criar/buscar KeyAgenda
      const existingAgenda = await prisma.keyAgenda.findFirst({ where: { source_id: v.id, source: 'CAMARA' } });
      const agenda = existingAgenda ?? await prisma.keyAgenda.create({
        data: {
          title: (v.proposicaoObjeto ?? v.descricao ?? v.id).slice(0, 200),
          description: (v.descricao ?? '').slice(0, 500),
          criteria: rule.criteria,
          positive_weight: rule.weight,
          negative_weight: -rule.weight,
          source: 'CAMARA', source_id: v.id,
          source_url: `${BASE}/votacoes/${v.id}`,
          keywords: rule.keywords, status: 'ACTIVE', priority: rule.priority,
        },
      });
      if (!existingAgenda) agendas++;

      // 4. Registrar votos individuais
      await sleep(300);
      const n = await processVotacao(v.id, agenda.id, rule, v.data, v.descricao ?? '');
      process.stdout.write(`   → ${n} votos individuais registrados\n`);
      votes += n;
      await sleep(400);
    }

    await sleep(600); // pausa entre trimestres
  }

  return { agendas, votes, checked };
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
  console.log(`${'─'.repeat(60)}`);

  if (result.votes > 0) {
    console.log('\n💡 Próximo passo: pnpm scores:recalculate');
  } else {
    console.log('\n⚠️  Nenhum voto registrado. Verifique as keywords ou conexão com a API.');
  }
}

// Roda só se este arquivo for o entry point (achado real 2026-08-20,
// mesma correção dos outros scripts de sync).
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
