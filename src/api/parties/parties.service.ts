import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { latestActivePoliticianScores } from '../scores/scores.query';

type PartyAcc = {
  count: number;
  withVotes: number;
  scoreSum: number;
  lifeSum: number;
  familySum: number;
  integritySum: number;
  socialSum: number;
  religiousSum: number;
};

/**
 * Média de alinhamento por partido.
 *
 * Corrigido (2026-09-16): a query antiga fazia AVG(overall_score) direto na
 * tabela — sem distinguir quem tem voto próprio. Notas de político sem voto
 * são ESTIMATIVAS do partido (seed), então misturadas na média faziam o
 * número "parecer" mais confiável do que é (na prática, o partido puxava a
 * própria média para perto de si mesmo — circularidade).
 *
 * Agora a média de cada critério só considera partidários com voto próprio
 * registrado (total_votes > 0). `estimated` expõe a quantidade cuja nota é
 * estimativa — e a UI pode avisar "média sobre X, Y estimados".
 */
@Injectable()
export class PartiesService {
  constructor(private readonly prisma: PrismaService) {}

  async alignment() {
    const rows = await latestActivePoliticianScores(this.prisma);

    const acc = new Map<string, PartyAcc>();
    for (const p of rows) {
      const party = p.currentParty;
      if (!party) continue;
      if (!acc.has(party)) {
        acc.set(party, {
          count: 0,
          withVotes: 0,
          scoreSum: 0,
          lifeSum: 0,
          familySum: 0,
          integritySum: 0,
          socialSum: 0,
          religiousSum: 0,
        });
      }
      const a = acc.get(party)!;
      a.count += 1;
      const s = p.score;
      if (s && (s.total_votes ?? 0) > 0) {
        a.withVotes += 1;
        a.scoreSum += s.overall_score ?? 0;
        a.lifeSum += s.life_protection ?? 0;
        a.familySum += s.family_values ?? 0;
        a.integritySum += s.moral_integrity ?? 0;
        a.socialSum += s.social_responsibility ?? 0;
        a.religiousSum += s.religious_freedom ?? 0;
      }
    }

    const level = (v: number | null) => {
      if (v === null) return 'sem_dados';
      if (v >= 70) return 'alta';
      if (v >= 50) return 'moderada';
      return 'baixa';
    };

    const parties = Array.from(acc.entries())
      .map(([party, a]) => {
        const n = a.withVotes;
        const avg = (sum: number) => (n > 0 ? Math.round((sum / n) * 10) / 10 : null);
        return {
          party,
          politician_count: a.count,
          with_votes: a.withVotes,
          estimated: a.count - a.withVotes,
          avg_score: avg(a.scoreSum),
          alignment_level: level(avg(a.scoreSum)),
          criteria: {
            life_protection:       avg(a.lifeSum),
            family_values:         avg(a.familySum),
            moral_integrity:       avg(a.integritySum),
            social_responsibility: avg(a.socialSum),
            religious_freedom:     avg(a.religiousSum),
          },
        };
      })
      .filter(parties => parties.politician_count >= 3)
      .sort((a, b) => (b.avg_score ?? -1) - (a.avg_score ?? -1));

    return { parties, total_parties: parties.length };
  }
}