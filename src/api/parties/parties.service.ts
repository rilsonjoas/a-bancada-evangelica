import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type PartyRow = {
  party: string;
  politician_count: bigint;
  avg_score: string | null;
  avg_life: string | null;
  avg_family: string | null;
  avg_integrity: string | null;
  avg_social: string | null;
  avg_religious: string | null;
};

@Injectable()
export class PartiesService {
  constructor(private readonly prisma: PrismaService) {}

  async alignment() {
    const rows = await this.prisma.$queryRaw<PartyRow[]>`
      SELECT
        p.current_party                                    AS party,
        COUNT(*)                                           AS politician_count,
        ROUND(AVG(ps.overall_score)::numeric, 1)          AS avg_score,
        ROUND(AVG(ps.life_protection)::numeric, 1)        AS avg_life,
        ROUND(AVG(ps.family_values)::numeric, 1)          AS avg_family,
        ROUND(AVG(ps.moral_integrity)::numeric, 1)        AS avg_integrity,
        ROUND(AVG(ps.social_responsibility)::numeric, 1)  AS avg_social,
        ROUND(AVG(ps.religious_freedom)::numeric, 1)      AS avg_religious
      FROM politicians p
      INNER JOIN politician_scores ps ON ps.politician_id = p.id
      WHERE p.is_active = true
        AND p.current_party IS NOT NULL
        AND p.current_party != ''
      GROUP BY p.current_party
      HAVING COUNT(*) >= 3
      ORDER BY AVG(ps.overall_score) DESC NULLS LAST
    `;

    const level = (s: string | null) => {
      const v = s ? parseFloat(s) : null;
      if (v === null) return 'sem_dados';
      if (v >= 70) return 'alta';
      if (v >= 50) return 'moderada';
      return 'baixa';
    };

    const parties = rows.map(r => ({
      party: r.party,
      politician_count: Number(r.politician_count),
      avg_score: r.avg_score ? parseFloat(r.avg_score) : null,
      alignment_level: level(r.avg_score),
      criteria: {
        life_protection:       r.avg_life      ? parseFloat(r.avg_life)      : null,
        family_values:         r.avg_family    ? parseFloat(r.avg_family)    : null,
        moral_integrity:       r.avg_integrity ? parseFloat(r.avg_integrity) : null,
        social_responsibility: r.avg_social    ? parseFloat(r.avg_social)    : null,
        religious_freedom:     r.avg_religious ? parseFloat(r.avg_religious) : null,
      },
    }));

    return { parties, total_parties: parties.length };
  }
}
