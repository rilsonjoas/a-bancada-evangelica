import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    // F11 (2026-08-25): a distribuição antiga contava TODAS as linhas da
    // tabela de scores (histórico + inativos) — a home chegou a exibir
    // "648 com nota" para 514 monitorados. Agora: último score de cada
    // político ATIVO, um voto por político. A média também passa a ser
    // por político (não por linha).
    const [totalPoliticians, houseStats, actives] = await Promise.all([
      this.prisma.politician.count({ where: { is_active: true } }),
      this.prisma.politician.groupBy({
        by: ['current_house'],
        where: { is_active: true },
        _count: true,
      }),
      this.prisma.politician.findMany({
        where: { is_active: true },
        select: {
          scores: {
            take: 1,
            orderBy: { created_at: 'desc' },
            select: { performance_level: true, overall_score: true },
          },
        },
      }),
    ]);

    const withScore = actives.filter(a => a.scores.length > 0);
    const distribution = { excellent: 0, good: 0, average: 0, poor: 0 };
    let scoreSum = 0;
    for (const a of withScore) {
      const s = a.scores[0];
      const key = s.performance_level.toLowerCase() as keyof typeof distribution;
      if (key in distribution) distribution[key] += 1;
      scoreSum += s.overall_score ?? 0;
    }
    const averageScore = withScore.length > 0
      ? Math.round((scoreSum / withScore.length) * 10) / 10
      : 0;

    return {
      totalPoliticians,
      averageScore,
      performanceDistribution: distribution,
      houseDistribution: {
        camara: houseStats.find(s => s.current_house === 'CAMARA')?._count ?? 0,
        senado: houseStats.find(s => s.current_house === 'SENADO')?._count ?? 0,
      },
    };
  }
}
