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

const prisma = new PrismaClient();
const SENADO_API = 'https://legis.senado.leg.br/dadosabertos/votacao';

// ── Critérios e keywords (mesmos do sync-votes.ts da Câmara) ──────────────────
type Criteria = 'LIFE_PROTECTION' | 'FAMILY_VALUES' | 'MORAL_INTEGRITY' | 'SOCIAL_RESPONSIBILITY' | 'RELIGIOUS_FREEDOM';

interface ScanRule {
  criteria: Criteria;
  keywords: string[];
  simIsPositive: boolean;
  weight: number;
  priority: number;
}

const SCAN_RULES: ScanRule[] = [
  { criteria: 'LIFE_PROTECTION', keywords: ['aborto', 'nascituro', 'eutanasia', 'interrupcao da gravidez'], simIsPositive: false, weight: 20, priority: 5 },
  { criteria: 'LIFE_PROTECTION', keywords: ['protecao da vida', 'direito a vida', 'crime contra a vida', 'homicidio'], simIsPositive: true, weight: 15, priority: 4 },
  { criteria: 'FAMILY_VALUES', keywords: ['familia', 'casamento', 'adocao', 'menor de idade', 'crianca', 'estatuto da crianca'], simIsPositive: true, weight: 15, priority: 4 },
  { criteria: 'FAMILY_VALUES', keywords: ['identidade de genero', 'diversidade sexual', 'homoafetiv', 'transexual'], simIsPositive: false, weight: 15, priority: 4 },
  { criteria: 'MORAL_INTEGRITY', keywords: ['corrupcao', 'improbidade', 'ficha limpa', 'transparencia publica', 'lei anticorrupcao'], simIsPositive: true, weight: 15, priority: 4 },
  { criteria: 'MORAL_INTEGRITY', keywords: ['amnistia', 'anistia', 'prescricao', 'indulto'], simIsPositive: false, weight: 12, priority: 3 },
  { criteria: 'SOCIAL_RESPONSIBILITY', keywords: ['assistencia social', 'bolsa familia', 'beneficio social', 'populacao em situacao de rua'], simIsPositive: true, weight: 10, priority: 3 },
  { criteria: 'SOCIAL_RESPONSIBILITY', keywords: ['saude publica', 'sus', 'atendimento a vitimas'], simIsPositive: true, weight: 8, priority: 2 },
  { criteria: 'RELIGIOUS_FREEDOM', keywords: ['liberdade religiosa', 'liberdade de culto', 'discriminacao religiosa', 'intolerancia religiosa', 'expressao religiosa', 'simbolo religioso', 'perseguicao religiosa'], simIsPositive: true, weight: 20, priority: 5 },
  { criteria: 'RELIGIOUS_FREEDOM', keywords: ['laicidade', 'ensino religioso', 'crenca', 'assistencia espiritual', 'folga religiosa'], simIsPositive: true, weight: 10, priority: 3 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
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
    const rule = matchRule(matchText);
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
          keywords: [rule.criteria],
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
}

syncVotesSenado()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
