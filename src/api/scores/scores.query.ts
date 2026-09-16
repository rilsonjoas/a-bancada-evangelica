import { PoliticianScore } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Fonte ÚNICA da "última nota por político ativo".
 *
 * Achado real (2026-09-16): a mesma métrica vivia em 3 lugares diferentes
 * (stats/overview, votes/analysis, politicians/ranking) e cada um evoluiu
 * de um jeito — o ranking foi corrigido pro padrão "última nota de cada
 * político ATIVO" (F11), mas votes/analysis ficou com a agregação antiga
 * sobre a tabela inteira de politician_scores, produzindo médias publicadas
 * divergentes (63,1 no site vs 62,3 em /votes/analysis).
 *
 * Toda agregação pública de nota deve passar por aqui. Sempre usa:
 *   - um político ATIVO só (is_active = true)
 *   - a ÚLTIMA linha de score dele (take:1, orderBy created_at desc)
 */

/** Campos mínimos do score vigente que todos os consumidores precisam. */
export type LatestScore = Pick<
  PoliticianScore,
  | 'life_protection'
  | 'family_values'
  | 'moral_integrity'
  | 'social_responsibility'
  | 'religious_freedom'
  | 'overall_score'
  | 'performance_level'
  | 'performance_label'
  | 'performance_description'
  | 'total_votes'
  | 'consistency_score'
  | 'last_calculation'
>;

/** Um político ativo + a nota vigente (null se nunca teve score). */
export interface ActivePoliticianScore {
  id: number;
  name: string;
  currentParty: string;
  currentState: string;
  currentHouse: string;
  isFpeMember: boolean;
  score: LatestScore | null;
}

/**
 * Única query pública de notas: políticos ATIVOS com a última nota de cada
 * um. `score` é null para político que nunca teve nota calculada.
 */
export async function latestActivePoliticianScores(
  prisma: PrismaService,
): Promise<ActivePoliticianScore[]> {
  const rows = await prisma.politician.findMany({
    where: { is_active: true },
    select: {
      id: true,
      name: true,
      current_party: true,
      current_state: true,
      current_house: true,
      is_fpe_member: true,
      scores: {
        take: 1,
        orderBy: { created_at: 'desc' },
        select: {
          life_protection: true,
          family_values: true,
          moral_integrity: true,
          social_responsibility: true,
          religious_freedom: true,
          overall_score: true,
          performance_level: true,
          performance_label: true,
          performance_description: true,
          total_votes: true,
          consistency_score: true,
          last_calculation: true,
        },
      },
    },
  });

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    currentParty: r.current_party,
    currentState: r.current_state,
    currentHouse: r.current_house,
    isFpeMember: r.is_fpe_member ?? false,
    score: r.scores[0] ?? null,
  }));
}

/** Distribuição da nota vigente por nível de desempenho. */
export interface ScoreDistribution {
  excellent: number;
  good: number;
  average: number;
  poor: number;
}

export interface LatestScoresSummary {
  withScore: ActivePoliticianScore[];
  averageScore: number;
  withOwnVotes: number;
  distribution: ScoreDistribution;
}

/**
 * Resume a lista de notas vigentes (gerada por `latestActivePoliticianScores`):
 *  - média geral POR POLÍTICO (não por linha de score)
 *  - quantos têm votos próprios (total_votes > 0)
 *  - distribuição por nível de desempenho
 */
export function summarizeLatestScores(
  politicians: ActivePoliticianScore[],
): LatestScoresSummary {
  const withScore = politicians.filter(p => p.score != null);
  const distribution: ScoreDistribution = { excellent: 0, good: 0, average: 0, poor: 0 };
  let scoreSum = 0;
  let withOwnVotes = 0;

  for (const p of withScore) {
    const s = p.score!;
    const key = s.performance_level.toLowerCase() as keyof ScoreDistribution;
    if (key in distribution) distribution[key] += 1;
    scoreSum += s.overall_score ?? 0;
    if ((s.total_votes ?? 0) > 0) withOwnVotes += 1;
  }

  const averageScore = withScore.length > 0
    ? Math.round((scoreSum / withScore.length) * 10) / 10
    : 0;

  return { withScore, averageScore, withOwnVotes, distribution };
}

/**
 * A nota é estimativa quando o político NÃO tem voto próprio registrado.
 * Notas sem votos vêm de seed do partido (média da bancada) — válida como
 * referência inicial, mas NUNCA deve ser apresentada como se fosse
 * resultado de votação individual.
 */
export function isEstimatedScore(score: { total_votes?: number | null } | null | undefined): boolean {
  return !!score && (score.total_votes ?? 0) === 0;
}