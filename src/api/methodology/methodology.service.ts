import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MethodologyService {
  constructor(private readonly prisma: PrismaService) {}

  pillars() {
    return this.prisma.methodologyPillar.findMany({
      where: { is_active: true },
      orderBy: { order: 'asc' },
    });
  }

  content() {
    return this.prisma.methodologyContent.findMany({
      where: { is_active: true },
      orderBy: { order: 'asc' },
    });
  }

  async full() {
    const [pillars, content] = await Promise.all([this.pillars(), this.content()]);
    return {
      pillars,
      content,
      totalWeight: pillars.reduce((sum, p) => sum + p.weight, 0),
    };
  }
}
