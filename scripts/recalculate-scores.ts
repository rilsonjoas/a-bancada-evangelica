/**
 * recalculate-scores.ts
 * Recalcula scores usando abordagem híbrida:
 *   - Para critérios COM votos reais: seed do partido + MÉDIA dos votos
 *   - Para critérios SEM votos reais: mantém o seed do partido
 *   - Penalidade de despesas suspeitas em moral_integrity
 *
 * Isso preserva a diferenciação PL/PT em critérios sem votações
 * PLEN acessíveis (vida, família, religião) enquanto usa dados reais
 * para ajustar critérios com votações disponíveis (social, família).
 *
 * DOIS ACHADOS REAIS CORRIGIDOS EM 2026-09-08, distintos entre si:
 *
 * 1) Base móvel em vez de fixa. Até esta versão, a "base" de cada
 *    critério vinha de `existing?.campo` — o valor JÁ GRAVADO pela
 *    execução anterior, que já incluía o delta de voto somado. Como
 *    este script roda todo dia via cron (sync-worker.ts, 05:00) e o
 *    delta somava TODOS os votos desde sempre (não só os novos), isso
 *    somava o histórico completo de novo, todo santo dia, em cima de
 *    um valor que já o continha — drift sem fim, sempre piorando.
 *    Corrigido: a base agora é sempre `partyBase() + individualNoise()`
 *    — um valor FIXO, recalculado do zero a cada execução, nunca lido
 *    de volta do banco. Isso torna o script idempotente (rodar N vezes
 *    dá o mesmo resultado), mas por si só NÃO bastou — ver achado 2.
 *
 * 2) Soma sem limite em vez de média. applied_score de cada voto tem
 *    peso fixo do SCAN_RULES (ex.: ±15 em Família). SOMAR todos os
 *    votos de um critério não tem limite nenhum — um deputado com 16
 *    votos nesse critério acumulava até ±240, muito além da faixa
 *    0–100, saturando na hora mesmo já com a base fixa do achado 1.
 *    Medido em produção (só com o achado 1 corrigido, achado 2 ainda
 *    não): Família ainda 69% saturada, Responsabilidade Social 74%.
 *    Exemplo real: Acácio Favacho (MDB), 16 votos em Família somando
 *    +150 — saturava em 100 garantido, não por ser realmente extremo,
 *    só por ter votado bastante sobre o tema. Corrigido: MÉDIA, não
 *    soma — reflete a TENDÊNCIA real do voto (alinhado/contrário/misto),
 *    não o VOLUME de quantas vezes o tema apareceu em pauta. Decisão
 *    do Rilson (2026-09-08): média, não um cap na soma — muda o
 *    significado da nota de "acúmulo" pra "tendência", deliberadamente.
 *
 * Resultado combinado dos dois: script idempotente E sem saturação
 * garantida por volume de voto.
 */
import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { computeExpensePenalty } from './lib/expense-rules';
import {
  CRITERIA_KEYS,
  SEED_SHRINK,
  SCORE_FORMULA_VERSION,
  VOTE_WEIGHT_MULT,
  WEIGHTS,
  clampSeed,
  clampScore,
  individualNoise,
  overallScore,
  partyBase,
  performanceLabel,
  shrinkSeed,
  type CriteriaKey,
  voteConfidence,
  consistencyBonus,
} from './lib/scoring.js';

const prisma = new PrismaClient();

/** Duas casas: a decomposição é exibida ao usuário, e float longo vira ruído. */
const round2 = (n: number) => Math.round(n * 100) / 100;

const CRITERIA_INDEX: Record<CriteriaKey, number> = {
  LIFE_PROTECTION: 0,
  FAMILY_VALUES: 1,
  MORAL_INTEGRITY: 2,
  SOCIAL_RESPONSIBILITY: 3,
  RELIGIOUS_FREEDOM: 4,
};

async function recalculate() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(dryRun
    ? '🔢 [dry-run] Recálculo híbrido de scores (partido + votos reais) — NADA será gravado...\n'
    : '🔢 Recálculo híbrido de scores (partido + votos reais)...\n');

  const politicians = await prisma.politician.findMany({
    where: { is_active: true },
    include: {
      scores: { take: 1, orderBy: { created_at: 'desc' } },
      votes: {
        // `title` é o que colapsa as sessões da MESMA proposição: a mesma
        // proposição é gravada como pauta distinta a cada votação, então
        // 83 linhas correspondem a 33 assuntos (o PL 2159/2021 aparece 9x).
        // `source_id` é a rede de segurança para pauta sem título.
        include: { key_agenda: { select: { criteria: true, title: true, source_id: true, status: true } } },
      },
      expenses: {
        select: { suspicion_score: true, is_suspicious: true },
      },
    },
  });

  console.log(`👤 ${politicians.length} políticos para processar`);

  let updated = 0;
  let hybridUpdated = 0;

  // H6 (2026-08-27): diff de auditoria das transformações. Cada recálculo
  // registra no SyncLog O QUE mudou nas notas: critérios e nº de políticos
  // impactados. Sem isso, uma mudança de nota é invisível (parece correção
  // arbitrária); com histórico, é processo auditável.
  let changedCount = 0;
  let unchangedCount = 0;
  const criteriaDeltas: Record<string, { changed: number; totalDelta: number }> = {
    LIFE_PROTECTION: { changed: 0, totalDelta: 0 },
    FAMILY_VALUES: { changed: 0, totalDelta: 0 },
    MORAL_INTEGRITY: { changed: 0, totalDelta: 0 },
    SOCIAL_RESPONSIBILITY: { changed: 0, totalDelta: 0 },
    RELIGIOUS_FREEDOM: { changed: 0, totalDelta: 0 },
  };
  const biggestMovers: Array<{ name: string; from: number; to: number; delta: number }> = [];

  for (const politician of politicians) {
    const existing = politician.scores[0];
    const base = partyBase(politician.current_party);

    // Agrupar votos reais por critério — POR ASSUNTO, não por linha de voto.
    //
    // Achado real 2026-09-25: key_agendas guarda 83 linhas para 33 assuntos
    // distintos, porque a mesma proposição é gravada de novo a cada sessão
    // de votação (o PL 2159/2021 aparece 9x). Média por LINHA de voto
    // portanto pesa um assunto 9x contra outro: a média media "quantas
    // vezes o projeto foi placed em votação", não "em que o parlamentar
    // votou". Medido em produção: a diferença entre os dois métodos tem
    // desvio médio 1,64 ponto e chega a 5,86 em um parlamentar.
    //
    // Aqui cada assunto entra UMA vez, com a média de seus votos. A
    // diferença para a versão anterior é pequena em média (1,64) mas
    //chega a 5,86 no pior caso — e o pior caso é exatamente o parlamentar
    // que mais votou, que é quem mais sofre com o método antigo.
    const deltas: Record<CriteriaKey, number[]> = {
      LIFE_PROTECTION: [], FAMILY_VALUES: [], MORAL_INTEGRITY: [],
      SOCIAL_RESPONSIBILITY: [], RELIGIOUS_FREEDOM: [],
    };
    // assunto -> soma dos applied_score e contagem de votos
    const porAssunto = new Map<string, { soma: number; n: number; criteria: CriteriaKey }>();

    for (const vote of politician.votes) {
      // Pauta ARQUIVADA não conta. Uma pauta que parou de casar com as
      // SCAN_RULES foi para ARCHIVED (o estado que o enum define como "não
      // monitora mais"), mas o VOTO continua gravado — e sem este filtro os
      // votos de uma pauta arquivada continuariam entrando na nota, que é
      // exatamente o que a arquivamento veio resolver.
      if (vote.key_agenda.status !== 'ACTIVE') continue;
      const c = vote.key_agenda.criteria as CriteriaKey;
      if (!deltas[c]) continue;
      // A chave de assunto é o título da pauta: é o que identifica a MESMA
      // proposição entre sessões diferentes. source_vote_id seria por
      // sessão, que é justamente o que queremos colapsar.
      const titulo = vote.key_agenda.title ?? vote.key_agenda.source_id ?? 'SEM_TITULO';
      const chave = `${c}|${titulo}`;
      const atual = porAssunto.get(chave);
      if (atual) {
        atual.soma += vote.applied_score;
        atual.n += 1;
      } else {
        porAssunto.set(chave, { soma: vote.applied_score, n: 1, criteria: c });
      }
    }
    // Cada assunto contribui com a média dos SEUS votos, uma vez só.
    for (const { soma, n, criteria } of porAssunto.values()) {
      deltas[criteria].push(soma / n);
    }

    const hasCriteriaVotes = (c: CriteriaKey) => deltas[c].length > 0;

    // MÉDIA, não soma (achado real 2026-09-08, segundo bug distinto do
    // "base móvel" acima). applied_score de cada voto tem peso fixo do
    // SCAN_RULES (ex.: ±15 em Família) — SOMAR todos os votos desde
    // sempre não tem limite: um deputado com 16 votos nesse critério
    // já acumula até ±240, muito além da faixa 0–100, saturando na
    // hora mesmo com a base fixa corrigida. Medido em produção antes
    // desta correção: Acácio Favacho (MDB), 16 votos em Família somando
    // +150 — saturava em 100 garantido, não por ser realmente extremo,
    // só por ter votado bastante. Média corrige isso: reflete a
    // TENDÊNCIA real do voto (alinhado, contrário, ou misto), não o
    // VOLUME de quantas vezes o tema apareceu em pauta.
    //
    // E a média é por ASSUNTO (a linha acima já colapsou as sessões), o
    // que fecha a terceira camada do mesmo defeito: nem o número de
    // sessões nem o número de votes de um assunto pesam mais que outro.
    const avgDelta = (c: CriteriaKey) => deltas[c].reduce((a, b) => a + b, 0) / deltas[c].length;

    // Seed do partido pra cada critério — fixo, recalculado do zero.
    //
    // `shrinkSeed` encolhe a amplitude do seed em direção à média global
    // (M1c: SEED_SHRINK 1.0 → 0.5). Com 1.0 é a identidade, então hoje o
    // comportamento é exatamente o de antes. Ver PLANO-PESO-INDIVIDUAL.md:
    // o seed tem amplitude ~70 pontos contra 24 do sinal de voto, e é por
    // isso que 91,8% da variância da nota é partido — não porque o voto
    // pese pouco na fórmula, mas porque o outro termo é enorme.
    const seedFor = (c: CriteriaKey) => clampSeed(
      shrinkSeed(base[CRITERIA_INDEX[c]] + individualNoise(politician.id, CRITERIA_INDEX[c])),
    );

    // Penalidade de despesas suspeitas em moral_integrity — sempre
    // recalculada fresca a partir do dado real, nunca cumulativa.
    // A fórmula (e por que ela é proporcional) está em
    // scripts/lib/expense-rules.ts → computeExpensePenalty.
    const totalExpenses = politician.expenses.length;
    const suspiciousCount = politician.expenses.filter(e => e.is_suspicious).length;
    const avgSuspicion = politician.expenses.length > 0
      ? politician.expenses.reduce((s, e) => s + (e.suspicion_score ?? 0), 0) / politician.expenses.length
      : 0;
    const expensePenalty = computeExpensePenalty({ totalExpenses, suspiciousCount, avgSuspicion });

    // Híbrido: parte do seed do partido (fixo), ajusta só onde há voto real.
    //
    // `applyVote` multiplica o delta por VOTE_WEIGHT_MULT (M1c: 1.0 → 3.0).
    // Com 1.0 é a identidade. A função existe para que a multiplicação
    // aconteça num lugar só — os cinco critérios compartilham a mesma
    // alavanca, e um `× 3` esquecido em uma linha seria invisível.
    //
    // M2: o peso cai conforme a base de assuntos. Um voto só não é
    // descartado — a pessoa votou — mas entra com menos força que dezesseis.
    const applyVote = (c: CriteriaKey) =>
      hasCriteriaVotes(c)
        ? avgDelta(c) * VOTE_WEIGHT_MULT * voteConfidence(deltas[c].length)
        : 0;

    const life = clampScore(seedFor('LIFE_PROTECTION') + applyVote('LIFE_PROTECTION'));
    const family = clampScore(seedFor('FAMILY_VALUES') + applyVote('FAMILY_VALUES'));
    const moral = clampScore(seedFor('MORAL_INTEGRITY') + applyVote('MORAL_INTEGRITY') - expensePenalty);
    const social = clampScore(seedFor('SOCIAL_RESPONSIBILITY') + applyVote('SOCIAL_RESPONSIBILITY'));
    const religious = clampScore(seedFor('RELIGIOUS_FREEDOM') + applyVote('RELIGIOUS_FREEDOM'));

    const scores: Record<CriteriaKey, number> = {
      LIFE_PROTECTION: life, FAMILY_VALUES: family, MORAL_INTEGRITY: moral,
      SOCIAL_RESPONSIBILITY: social, RELIGIOUS_FREEDOM: religious,
    };

    // M4: grava a decomposição — de onde veio cada ponto. Sem isto a tela
    // mostra UM número e o usuário não tem como saber que 91,8% da
    // variância é partido (medido na auditoria). É a resposta a "por que ele
    // tem essa nota?".
    //
    // Vai para o banco no mesmo recálculo da nota, e não é recalculado na
    // leitura da API: se a fórmula mudar, um componente recomputado na
    // leitura passaria a discordar da nota gravada.
    const breakdown = CRITERIA_KEYS.map((c) => {
      const seed = seedFor(c);
      const vote = applyVote(c);
      const penalty = c === 'MORAL_INTEGRITY' ? expensePenalty : 0;
      return {
        criteria: c,
        seed_points: round2(seed),
        vote_points: round2(vote),
        penalty_points: round2(penalty),
        weight: WEIGHTS[c],
        final_score: round2(scores[c]),
        subject_count: deltas[c].length,
      };
    });

    // Consistência: recalcula se tem votos; ZERADO se não tem.
    // Achado real (2026-08-22): o fallback antigo preservava
    // `existing?.consistency_score` — lixo congelado da fórmula quebrada do
    // sync-worker antigo (100% pra quem nunca votou) voltava a cada recálculo.
    // Sem votos NÃO existe consistência medida: grava 0; a UI exibe "—".
    // Só voto de pauta ATIVA. Contar a pauta arquivada aqui faria o perfil
    // anunciar "17 votações" quando só 2 entram na nota — e o badge de
    // "estimativa por partido" se apoia neste número.
    const votosAtivos = politician.votes.filter(v => v.key_agenda.status === 'ACTIVE');
    const totalVotes = votosAtivos.length;

    // M3: a consistência agora é POSIÇÃO, não cobertura de dado.
    //
    // Antes (medida errada, ver `consistencyBonus`): contava votos com
    // applied_score != 0 sobre o total. Isso respondia "quantas das minhas
    // votações caíram num tema que pontuamos?" — pergunta sobre o nosso
    // cadastro, não sobre a pessoa. Agora é: das votações pontuadas, em que
    // direção fui? Positivo é o lado alinhado, então a taxa de positivos é a
    // coerência entre assuntos.
    const scoredVotes = votosAtivos.filter(v => v.applied_score !== 0);
    const alignedVotes = scoredVotes.filter(v => v.applied_score > 0).length;
    const consistency = scoredVotes.length > 0
      ? alignedVotes / scoredVotes.length
      : 0;
    // ±3 pontos no máximo, e só depois de 10 votos pontuados. Um voto só
    // não move nota.
    const bonus = consistencyBonus(alignedVotes, scoredVotes.length);

    // M3: a coerência entra somada por fora dos cinco critérios — é um sinal
    // transversal, não um sexto critério com peso próprio.
    const overall = clampScore(overallScore(scores) + bonus);

    const perf = performanceLabel(overall);


    if (totalVotes > 0) hybridUpdated++;

    // H6: capturar diff antes/depois (overall_score) para o histórico.
    const prevOverall = existing?.overall_score ?? null;
    if (prevOverall !== null) {
      const absDelta = Math.abs(overall - prevOverall);
      if (absDelta > 1e-9) {
        changedCount++;
        biggestMovers.push({ name: politician.name, from: prevOverall, to: overall, delta: overall - prevOverall });
      } else {
        unchangedCount++;
      }
    }
    // Deltas por critério (só onde a nota mudou de fato)
    const prevCrits: Array<[CriteriaKey, number | null]> = [
      ['LIFE_PROTECTION', existing?.life_protection ?? null],
      ['FAMILY_VALUES', existing?.family_values ?? null],
      ['MORAL_INTEGRITY', existing?.moral_integrity ?? null],
      ['SOCIAL_RESPONSIBILITY', existing?.social_responsibility ?? null],
      ['RELIGIOUS_FREEDOM', existing?.religious_freedom ?? null],
    ];
    for (const [key, prev] of prevCrits) {
      const next = scores[key];
      if (prev !== null && Math.abs(next - prev) > 1e-9) {
        criteriaDeltas[key].changed++;
        criteriaDeltas[key].totalDelta += next - prev;
      }
    }

    if (dryRun) {
      if (prevOverall !== null && Math.abs(overall - prevOverall) > 1e-9) {
        console.log(`   [dry-run] ${politician.name}: ${prevOverall} → ${overall} (${politician.votes.length} votos)`);
      }
    } else {
      await prisma.politicianScore.upsert({
        where: { politician_id: politician.id },
        create: {
          politician_id: politician.id,
          life_protection: life, family_values: family,
          moral_integrity: moral, social_responsibility: social, religious_freedom: religious,
          overall_score: overall, performance_level: perf.level,
          performance_label: perf.label, performance_description: perf.description,
          consistency_score: consistency,
          total_votes: totalVotes,
        },
        update: {
          life_protection: life, family_values: family,
          moral_integrity: moral, social_responsibility: social, religious_freedom: religious,
          overall_score: overall, performance_level: perf.level,
          performance_label: perf.label, performance_description: perf.description,
          consistency_score: consistency,
          // Achado real (2026-08-22): a coluna nunca era atualizada por este
          // motor — ficava congelada da criação (509 ativos com votos reais
          // exibindo "0 votações"; a UI e qualquer verificação lixo liam 0).
          total_votes: totalVotes,
          last_calculation: new Date(),
          // M0: com que fórmula esta nota foi calculada.
          formula_version: SCORE_FORMULA_VERSION,
        },
      });

      // M4: um registro por critério, com a fórmula que o produziu.
      for (const b of breakdown) {
        await prisma.scoreBreakdown.upsert({
          where: { politician_id_criteria: { politician_id: politician.id, criteria: b.criteria } },
          create: {
            politician_id: politician.id,
            criteria: b.criteria,
            seed_points: b.seed_points,
            vote_points: b.vote_points,
            penalty_points: b.penalty_points,
            weight: b.weight,
            final_score: b.final_score,
            subject_count: b.subject_count,
            formula_version: SCORE_FORMULA_VERSION,
          },
          update: {
            seed_points: b.seed_points,
            vote_points: b.vote_points,
            penalty_points: b.penalty_points,
            weight: b.weight,
            final_score: b.final_score,
            subject_count: b.subject_count,
            formula_version: SCORE_FORMULA_VERSION,
            calculated_at: new Date(),
          },
        });
      }
    }

    updated++;
  }

  console.log(dryRun ? `\n✅ [dry-run] Recálculo simulado (nada gravado):` : `\n✅ Recálculo concluído:`);
  console.log(`   🔄 ${updated} políticos atualizados`);
  console.log(`   🗳️  ${hybridUpdated} ajustados com votos reais (híbrido)`);
  console.log(`   📊 ${updated - hybridUpdated} mantiveram score de partido`);

  // H6 (2026-08-27): registrar diff no SyncLog para auditoria pública.
  const avgDelta = (k: string) =>
    criteriaDeltas[k].changed > 0 ? criteriaDeltas[k].totalDelta / criteriaDeltas[k].changed : 0;

  const details = {
    totalRevised: updated,
    changedCount,
    unchangedCount,
    hybridUpdated,
    criteriaDelta: Object.fromEntries(
      Object.entries(criteriaDeltas).map(([k, v]) => [k, { changed: v.changed, avgDelta: Number(avgDelta(k).toFixed(2)) }])
    ),
    biggestMovers: biggestMovers
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 10)
      .map(m => ({ ...m, delta: Number(m.delta.toFixed(2)) })),
    timestamp: new Date().toISOString(),
  };

  if (!dryRun) {
    await prisma.syncLog.create({
      data: {
        sync_type: 'SCORES',
        source: 'MANUAL',
        status: 'SUCCESS',
        start_time: new Date(),
        end_time: new Date(),
        records_processed: updated,
        records_inserted: changedCount,
        records_updated: updated,
        records_failed: 0,
        details: {
          ...details,
          // M0: sem isto o diff diz quantas notas mudaram mas não qual
          // fórmula as produziu — e M1c–M5 mudam a fórmula.
          formula_version: SCORE_FORMULA_VERSION,
          vote_weight_mult: VOTE_WEIGHT_MULT,
          seed_shrink: SEED_SHRINK,
        },
      },
    });
    console.log(`   📝 Diff registrado no SyncLog (${changedCount} notas alteradas de ${updated}, fórmula ${SCORE_FORMULA_VERSION})`);
  } else {
    console.log(`   📝 [dry-run] ${changedCount} notas TERIAM mudado de ${updated} — nada gravado.`);
  }
}

// Roda só se este arquivo for o entry point de verdade — mesma correção
// aplicada em sync-camara.ts/sync-senado.ts (achado real 2026-08-20):
// sem isso, importar este módulo de outro lugar recalcularia (e
// sobrescreveria) todos os scores como efeito colateral.
// pathToFileURL: o guard antigo (`file://${argv[1]}`) falhava SILENCIOSAMENTE
// em caminhos com espaço/acento (import.meta.url vem percent-encoded) — script
// não rodava e saía 0. Achado real 2026-08-23 rodando da máquina local.
const isEntryPoint = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntryPoint) {
  recalculate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
