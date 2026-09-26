import { describe, it, expect } from 'vitest';
import { classificarVotacao, pesoVotacao, VOTE_KIND_WEIGHTS } from '../lib/vote-kind';

/**
 * D-02: o tipo da votação pesa, e o peso é visível ao usuário.
 *
 * Motivo: 48% das votações substantivas são procedimentais. Um requerimento
 * de urgência pergunta "entra na pauta hoje?", não "você apoia isto?".
 *
 * Estes casos são todos REAIS — as descrições vêm de `votes.voting_description`
 * no banco de produção.
 */
describe('classificarVotacao — tipos e pesos (D-02)', () => {
  it('requerimento de urgência tem peso próprio, e não o do requerimento genérico', () => {
    // Os dois casam "requerimento". A ordem dos testes é o que os separa —
    // inverter faz o de urgência cair em 0,3 silenciosamente.
    const d = 'Aprovado o Requerimento de Urgência (Art. 155 do RICD). Sim: 276; Não: 41; Total: 317.';
    expect({ tipo: classificarVotacao(d), peso: pesoVotacao(d) })
      .toMatchObject({ tipo: 'URGENCY', peso: 0.2 });
  });

  it('requerimento genérico é 0,3', () => {
    const d = 'Rejeitado o Requerimento. Sim: 104; Não: 350; Abstenção: 2; Total: 456.';
    expect({ tipo: classificarVotacao(d), peso: pesoVotacao(d) })
      .toMatchObject({ tipo: 'REQUEST', peso: 0.3 });
  });

  it('emenda dentro de proposição é 0,7', () => {
    for (const d of [
      'Aprovada a Emenda do Senado nº 28. Sim: 229; Não: 82; Total: 312.',
      'Aprovada a Emenda do Senado Federal nº 4. Sim: 234; Não: 101; Total: 335.',
    ]) {
      expect({ d: d.slice(0, 34), tipo: classificarVotacao(d) })
        .toMatchObject({ tipo: 'AMENDMENT' });
    }
  });

  it('requerimento ganha de "emenda" quando os dois aparecem', () => {
    // "Requerimento de alteração da emenda do relator" é formalmente um
    // requerimento na Câmara, e procedural é o que ele é. A precedência é
    // deliberada: onde a Casa classifica, a gente acompanha.
    const d = 'Aprovado o Requerimento de alteração da emenda do relator. Sim: 12; Não: 3.';
    expect({ tipo: classificarVotacao(d) }).toMatchObject({ tipo: 'REQUEST' });
  });

  it('PEC indo a voto é MÉRITO, não emenda', () => {
    // "Proposta de Emenda à Constituição" contém a palavra "emenda" e não é
    // emenda nenhuma: é a proposição indo a julgamento.
    const d = 'Aprovada, em segundo turno, a Proposta de Emenda à Constituição n° 383 de 2017. Sim: 444; Não: 100.';
    expect({ tipo: classificarVotacao(d), peso: pesoVotacao(d) })
      .toMatchObject({ tipo: 'MERIT', peso: 1.0 });
  });

  it('redação final é mérito pleno, mesmo contendo a palavra "emenda"', () => {
    const d = 'Aprovada a redação final da emenda do Senado nº 3. Sim: 232; Não: 104; Total: 336.';
    expect({ tipo: classificarVotacao(d), peso: pesoVotacao(d) })
      .toMatchObject({ tipo: 'FINAL_TEXT', peso: 1.0 });
  });

  it('mantido o texto e projeto de lei são mérito', () => {
    for (const d of [
      'Mantido o texto. Sim: 251; não: 206; total: 457.',
      'Aprovado o Substitutivo Reformulado ao Projeto de Lei nº 5.122, de 2023. Sim: 403; Não: 98.',
      'Aprovada a Proposta de Emenda à Constituição nº 383.',
    ]) {
      expect({ d: d.slice(0, 30), tipo: classificarVotacao(d) })
        .toMatchObject({ tipo: 'MERIT' });
    }
  });

  it('descrição vazia não vira mérito — sem texto, não se sabe o que foi', () => {
    // Escolha conservadora: sem descrição, tratar como requerimento (peso
    // baixo) em vez de mérito. Erro para menos, não para mais.
    expect({ tipo: classificarVotacao(''), tipo2: classificarVotacao(null) })
      .toMatchObject({ tipo: 'REQUEST', tipo2: 'REQUEST' });
  });

  it('os pesos são os aprovados e estão em ordem decrescente de força', () => {
    expect({ pesos: VOTE_KIND_WEIGHTS }).toMatchObject({
      pesos: { MERIT: 1.0, FINAL_TEXT: 1.0, AMENDMENT: 0.7, REQUEST: 0.3, URGENCY: 0.2 },
    });
    expect(VOTE_KIND_WEIGHTS.MERIT).toBeGreaterThan(VOTE_KIND_WEIGHTS.AMENDMENT);
    expect(VOTE_KIND_WEIGHTS.AMENDMENT).toBeGreaterThan(VOTE_KIND_WEIGHTS.REQUEST);
    expect(VOTE_KIND_WEIGHTS.REQUEST).toBeGreaterThan(VOTE_KIND_WEIGHTS.URGENCY);
  });

  it('nenhum peso é zero — todo voto conta um pouco', () => {
    // Se algum fosse 0, a pessoa teria cognitivamente "não votado" naquele
    // item, e o perfil mostraria total de votos sem base. Melhor ponderar.
    for (const peso of Object.values(VOTE_KIND_WEIGHTS)) {
      expect({ peso, ok: peso > 0 && peso <= 1 }).toMatchObject({ ok: true });
    }
  });
});
