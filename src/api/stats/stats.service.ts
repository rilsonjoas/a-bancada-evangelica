import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [totalPoliticians, performanceStats, houseStats, scoreAvg] = await Promise.all([
      this.prisma.politician.count({ where: { is_active: true } }),
      this.prisma.politicianScore.groupBy({ by: ['performance_level'], _count: true }),
      this.prisma.politician.groupBy({
        by: ['current_house'],
        where: { is_active: true },
        _count: true,
      }),
      // Média global real — única fonte de verdade pra "nota média".
      // Antes a home calculava a média só do top-100 no cliente (~86),
      // divergindo da média global (~66) exibida em Votações.
      this.prisma.politicianScore.aggregate({
        _avg: { overall_score: true },
        where: { politician: { is_active: true } },
      }),
    ]);

    return {
      totalPoliticians,
      averageScore: Math.round((scoreAvg._avg.overall_score ?? 0) * 10) / 10,
      performanceDistribution: {
        excellent: performanceStats.find(s => s.performance_level === 'EXCELLENT')?._count ?? 0,
        good:      performanceStats.find(s => s.performance_level === 'GOOD')?._count ?? 0,
        average:   performanceStats.find(s => s.performance_level === 'AVERAGE')?._count ?? 0,
        poor:      performanceStats.find(s => s.performance_level === 'POOR')?._count ?? 0,
      },
      houseDistribution: {
        camara: houseStats.find(s => s.current_house === 'CAMARA')?._count ?? 0,
        senado: houseStats.find(s => s.current_house === 'SENADO')?._count ?? 0,
      },
    };
  }
}
