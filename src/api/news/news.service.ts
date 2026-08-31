import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NewsStatus } from '@prisma/client';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Menções aprovadas de um político, da mais recente para a mais antiga. */
  async findByPolitician(politicianId: number) {
    const exists = await this.prisma.politician.findUnique({ where: { id: politicianId }, select: { id: true } });
    if (!exists) return [];

    const rows = await this.prisma.newsMention.findMany({
      where: { politician_id: politicianId, status: 'APPROVED' },
      orderBy: { published_at: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        url: true,
        source_name: true,
        published_at: true,
        status: true,
      },
    });

    return rows.map((n) => ({
      id: n.id,
      title: n.title,
      url: n.url,
      sourceName: n.source_name,
      publishedAt: n.published_at.toISOString(),
    }));
  }

  /** Fila de curadoria: pendentes com contexto do parlamentar para decidir. */
  async pending() {
    const rows = await this.prisma.newsMention.findMany({
      where: { status: 'PENDING' },
      orderBy: { published_at: 'desc' },
      take: 100,
      include: {
        politician: {
          select: { id: true, name: true, current_party: true, current_state: true, photo_url: true },
        },
      },
    });

    return rows.map((n) => ({
      id: n.id,
      title: n.title,
      url: n.url,
      sourceName: n.source_name,
      publishedAt: n.published_at.toISOString(),
      politician: {
        id: n.politician.id,
        name: n.politician.name,
        party: n.politician.current_party,
        state: n.politician.current_state,
        photoUrl: n.politician.photo_url,
      },
    }));
  }

  /** Decisão de curadoria. Carimba reviewed_at e retorna o item revisado. */
  async review(id: number, status: NewsStatus) {
    return this.prisma.newsMention.update({
      where: { id },
      data: { status, reviewed_at: new Date() },
      select: {
        id: true,
        status: true,
        title: true,
        reviewed_at: true,
      },
    });
  }

  /** Decisão em lote (batch review) de várias menções pendentes. */
  async batchReview(ids: number[], status: NewsStatus) {
    if (!ids || ids.length === 0) return { updatedCount: 0 };
    const res = await this.prisma.newsMention.updateMany({
      where: { id: { in: ids } },
      data: { status, reviewed_at: new Date() },
    });
    return { updatedCount: res.count };
  }
}