/**
 * sync-votes-senado.ts
 * Sincroniza votos reais de pautas evangelicamente relevantes do Senado Federal.
 *
 * Endpoint substituto (o antigo /senador/{id}/votacoes foi descontinuado em fev/2026):
 *   GET /dadosabertos/votacao — retorna todas as votações nominais com votos individuais.
 *
 * O código do parlamentar (codigoParlamentar) equivale ao legislature_id no nosso DB.
 */
import { PrismaClient } from '@prisma/client';
import { SCAN_RULES_VERSION, matchScanRule, type ScanRule } from './lib/scan-rules';

const prisma = new PrismaClient();
const SENADO_API = 'https://legis.senado.leg.br/dadosabertos/votacao';

// ── Helpers ───────────────────────────────────────────────────────────────────
type VoteType = 'YES' | 'NO' | 'ABSTENTION' | 'OBSTRUCTION' | 'ABSENT';

function toVoteType(voto: string): VoteType {
  const u = voto.toUpperCase().trim();
  if (u === 'SIM') return 'YES';
  if (u === 'NÃO' || u === 'NAO' || u === 'NÃO REGISTRA VOTO' || u.startsWith('N')) return 'NO';
  if (u.includes('ABSTEN')) return 'ABSTENTION';
  if (u.includes('OBSTRU')) return 'OBSTRUCTION';
  return 'ABSENT';
}

function appliedScore(vt: VoteType, rule: ScanRule): number {
  if (vt === 'YES') return rule.simIsPositive ? rule.weight : -rule.weight;
  if (vt === 'NO') return rule.simIsPositive ? -rule.weight : rule.weight;
  return 0;
}

// ── Tipos da API ──────────────────────────────────────────────────────────────
interface SenadoVoto {
  codigoParlamentar: number;
  nomeParlamentar: string;
  siglaVotoParlamentar: string;
  siglaPartidoParlamentar: string;
  siglaUFParlamentar: string;
}

interface SenadoVotacao {
  ano: number;
  codigoMateria: number;
  codigoSessao: number;
  dataSessao: string;
  descricaoVotacao: string;
  ementa: string;
  identificacao: string;
  sigla: string;
  numero: number;
  votos: SenadoVoto[];
  totalVotosSim: number;
  totalVotosNao: number;
  totalVotosAbstencao: number;
}

// ── Mapear codigoParlamentar → politician.id ──────────────────────────────────
async function buildSenatorMap(): Promise<Map<number, number>> {
  const senators = await prisma.politician.findMany({
    where: { current_house: 'SENADO', is_active: true },
    select: { id: true, legislature_id: true },
  });
  const map = new Map<number, number>();
  for (const s of senators) {
    if (s.legislature_id) map.set(parseInt(s.legislature_id), s.id);
  }
  console.log(`📋 Mapeados ${map.size} senadores ativos`);
  return map;
}

// ── Buscar todas as votações do Senado ────────────────────────────────────────
async function fetchAllVotacoes(): Promise<SenadoVotacao[]> {
  const res = await fetch(SENADO_API, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    console.error(`❌ Erro ao buscar votações: ${res.status}`);
    return [];
  }
  const data = await res.json() as SenadoVotacao[];
  console.log(`📥 ${data.length} votações nominais obtidas do Senado`);
  return data;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function syncVotesSenado() {
  console.log('🏛️  Iniciando sincronização de votos do Senado...\n');

  const senatorMap = await buildSenatorMap();
  const votacoes = await fetchAllVotacoes();

  let matched = 0;
  let votesInserted = 0;
  let keyAgendasCreated = 0;

  for (const votacao of votacoes) {
    // Texto pra matching: descrição + ementa + identificação
    const matchText = `${votacao.descricaoVotacao} ${votacao.ementa} ${votacao.identificacao}`;
    const rule = matchScanRule(matchText);
    if (!rule) continue;

    matched++;

    // Criar ou encontrar KeyAgenda SENADO
    const sourceId = `SENADO-${votacao.ano}-${votacao.sigla}-${votacao.numero}`;
    let keyAgenda = await prisma.keyAgenda.findFirst({
      where: { source: 'SENADO', source_id: sourceId },
    });

    if (!keyAgenda) {
      keyAgenda = await prisma.keyAgenda.create({
        data: {
          title: `${votacao.identificacao} (${votacao.ano})`,
          description: votacao.descricaoVotacao.slice(0, 500),
          criteria: rule.criteria,
          positive_weight: rule.weight,
          negative_weight: -rule.weight,
          source: 'SENADO',
          source_id: sourceId,
          // Bug real (2026-09-16): gravava `[rule.criteria]` (o enum), não
          // as keywords de verdade — impossível reclassificar no futuro e
          // inconsistente com a Câmara. Agora: keywords reais + versão.
          keywords: rule.keywords,
          rules_version: SCAN_RULES_VERSION,
          status: 'ACTIVE',
          priority: rule.priority,
        },
      });
      keyAgendasCreated++;
    }

    // Inserir votos individuais
    for (const voto of votacao.votos) {
      const politicianId = senatorMap.get(voto.codigoParlamentar);
      if (!politicianId) continue;

      const vt = toVoteType(voto.siglaVotoParlamentar);
      const score = appliedScore(vt, rule);

      // Upsert: evitar duplicatas
      const existing = await prisma.vote.findFirst({
        where: {
          politician_id: politicianId,
          key_agenda_id: keyAgenda.id,
          source_vote_id: String(votacao.codigoSessao),
        },
      });

      if (!existing) {
        await prisma.vote.create({
          data: {
            politician_id: politicianId,
            key_agenda_id: keyAgenda.id,
            vote_type: vt,
            applied_score: score,
            vote_date: new Date(votacao.dataSessao),
            source: 'SENADO',
            source_vote_id: String(votacao.codigoSessao),
            source_proposition_id: String(votacao.codigoMateria),
            session_description: votacao.identificacao,
            voting_description: votacao.descricaoVotacao?.slice(0, 500),
          },
        });
        votesInserted++;
      }
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   Votações analisadas: ${votacoes.length}`);
  console.log(`   Com pauta evangélica: ${matched}`);
  console.log(`   KeyAgendas criadas: ${keyAgendasCreated}`);
  console.log(`   Votos inseridos: ${votesInserted}`);
  console.log(`\n✅ Sincronização de votos do Senado concluída.`);

  // Trilha de auditoria (2026-09-16): mesmo padrão do sync de votos da
  // Câmara — sem SyncLog, votos do Senado ficavam fora do histórico e o
  // /last-sync não percebia envelhecimento.
  await prisma.syncLog.create({
    data: {
      sync_type: 'VOTES',
      source: 'SENADO',
      status: 'SUCCESS',
      start_time: new Date(),
      end_time: new Date(),
      records_processed: votacoes.length,
      records_inserted: keyAgendasCreated + votesInserted,
      records_updated: 0,
      records_failed: 0,
      details: {
        action: 'sync_votes_senado',
        checked: votacoes.length,
        matched: matched,
        agendasCreated: keyAgendasCreated,
        votesSaved: votesInserted,
      },
    },
  });
}

syncVotesSenado()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
