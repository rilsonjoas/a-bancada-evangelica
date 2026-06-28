import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [totalPoliticians, performanceStats, houseStats] = await Promise.all([
      this.prisma.politician.count({ where: { is_active: true } }),
      this.prisma.politicianScore.groupBy({ by: ['performance_level'], _count: true }),
      this.prisma.politician.groupBy({
        by: ['current_house'],
        where: { is_active: true },
        _count: true,
      }),
    ]);

    return {
      totalPoliticians,
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
