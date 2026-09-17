import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  latestActivePoliticianScores,
  summarizeLatestScores,
  isEstimatedScore,
} from '../scores/scores.query';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    // F11 (2026-08-25): a distribuição antiga contava TODAS as linhas da
    // tabela de scores (histórico + inativos) — a home chegou a exibir
    // "648 com nota" para 514 monitorados. Agora: último score de cada
    // político ATIVO, um voto por político. A média também passa a ser
    // por político (não por linha).
    //
    // Refatorado (2026-09-16): a query e a soma agora vivem em
    // src/api/scores/scores.query.ts — mesma fonte do votes/analysis e do
    // ranking. Antes cada endpoint tinha sua própria cópia e elas
    // divergiram (63,1 vs 62,3). Se quiser mudar o que é "nota vigente",
    // muda lá, não aqui.
    const [actives, houseStats] = await Promise.all([
      latestActivePoliticianScores(this.prisma),
      this.prisma.politician.groupBy({
        by: ['current_house'],
        where: { is_active: true },
        _count: true,
      }),
    ]);

    const summary = summarizeLatestScores(actives);

    return {
      totalPoliticians: actives.length,
      withOwnVotes: summary.withOwnVotes,
      averageScore: summary.averageScore,
      performanceDistribution: summary.distribution,
      houseDistribution: {
        camara: houseStats.find(s => s.current_house === 'CAMARA')?._count ?? 0,
        senado: houseStats.find(s => s.current_house === 'SENADO')?._count ?? 0,
      },
    };
  }

  /**
   * CEPT2-7 (2026-09-16): quem tem "nota estimada por partido" hoje.
   * Mesma fonte única de notas (latestActivePoliticianScores) — nunca uma
   * query paralela. Permite à Metodologia listar, vivo, quantos e quais
   * políticos ainda não têm voto próprio registrado.
   */
  async estimatedScores() {
    const actives = await latestActivePoliticianScores(this.prisma);
    const summary = summarizeLatestScores(actives);

    const estimated = actives
      .filter(p => isEstimatedScore(p.score))
      .map(p => ({
        id: p.id,
        name: p.name,
        currentParty: p.currentParty,
        currentState: p.currentState,
        currentHouse: p.currentHouse,
        estimatedScore: p.score?.overall_score ?? null,
      }));

    return {
      totalPoliticians: actives.length,
      withOwnVotes: summary.withOwnVotes,
      estimatedCount: estimated.length,
      averageScore: summary.averageScore,
      estimated,
    };
  }

  /**
   * Frescura por tipo de sincronização (2026-09-16).
   * Antes: retornava o último log SUCCESS de QUALQUER tipo. Como NEWS/SCORES
   * rodam diariamente mas VOTES só manualmente, o badge dizia "atualizado
   * hoje" mesmo com a base de votos velha. Agora expõe a frescura de cada
   * tipo — a UI mostra o tipo mais antigo (o dado que realmente importa).
   */
  async lastSync() {
    const distinctTypes = await this.prisma.syncLog.groupBy({
      by: ['sync_type'],
      where: { status: 'SUCCESS' },
      _max: { end_time: true },
    });

    const freshness: Record<string, string | null> = {};
    let oldest: { syncType: string | null; at: string | null } | null = null;

    for (const row of distinctTypes) {
      const at = row._max.end_time?.toISOString() ?? null;
      freshness[row.sync_type] = at;
      if (at && (!oldest || row._max.end_time! < new Date(oldest.at!))) {
        oldest = { syncType: row.sync_type, at };
      }
    }

    return {
      // Mantém o shape antigo (compat): último log no geral.
      lastSync: oldest?.at ?? null,
      syncType: oldest?.syncType ?? null,
      source: null,
      // Novo: frescura granular por tipo de dado.
      freshness,
    };
  }

  /**
   * H6 (2026-08-27): histórico de auditoria das sincronizações.
   * Expões os últimos SyncLogs com o diff das notas (SCORES) incl.
   * Endpoint público — precedente igual ao exportCsv (dados abertos).
   */
  async syncHistory(limit = 50) {
    const logs = await this.prisma.syncLog.findMany({
      orderBy: { end_time: 'desc' },
      take: Math.min(limit, 200),
      select: {
        id: true,
        sync_type: true,
        source: true,
        status: true,
        start_time: true,
        end_time: true,
        records_processed: true,
        records_inserted: true,
        records_updated: true,
        records_failed: true,
        error_message: true,
        details: true,
      },
    });
    return logs;
  }
}