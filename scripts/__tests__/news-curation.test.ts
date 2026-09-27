import { describe, it, expect } from 'vitest';
import {
  junkReason,
  normalizeTitle,
  isWithinCurationWindow,
  selectQueueExpirations,
  CURATION_MAX_AGE_DAYS,
  CURATION_MAX_PENDING_PER_POLITICIAN,
  type PendingForTrim,
} from '../lib/news-curation';

// Títulos abaixo são reais, tirados da fila de produção em 2026-09-27
// (docs/DECISOES.md, entrada "Fila de curadoria humanamente possível").

describe('normalizeTitle', () => {
  it('ignora caixa, acento e espaço extra', () => {
    expect(normalizeTitle('  ROBINSON   Faria ')).toBe(normalizeTitle('Robinson Fária'));
  });
});

describe('junkReason', () => {
  it('título que é só o nome do parlamentar', () => {
    expect(junkReason({ title: 'ROBINSON FARIA', sourceName: 'X' }, 'Robinson Faria')).toBe('titulo_so_nome');
    expect(junkReason({ title: 'Pedro Lucas Fernandes', sourceName: 'X' }, 'Pedro Lucas Fernandes')).toBe('titulo_so_nome');
  });

  it('página de candidatura com número de urna', () => {
    const name = 'Felipe Becari';
    expect(
      junkReason({ title: 'Felipe Becari 2007 - Candidato a deputado federal de SP pelo PODE | Eleições 2026', sourceName: 'ND Mais' }, name),
    ).toBe('pagina_candidatura');
    expect(
      junkReason({ title: 'Júlio César o Julim do Lula (PSD) 555: Candidato a Senador no Piauí | Eleições 2026', sourceName: 'Tribuna do Paraná' }, 'Júlio Cesar'),
    ).toBe('pagina_candidatura');
    expect(
      junkReason({ title: 'Denise Pessôa, PT, veja o número do candidato a Deputada Federal no Rio Grande do Sul', sourceName: 'Rádio Itatiaia' }, 'Denise Pessôa'),
    ).toBe('pagina_candidatura');
    expect(
      junkReason({ title: 'Alice Portugal | Candidata a Deputada Federal na Bahia nas eleições 2026', sourceName: 'G1' }, 'Alice Portugal'),
    ).toBe('pagina_candidatura');
    expect(
      junkReason({ title: 'Kim Kataguiri Candidato a Deputado Federal em São Paulo nas eleições 2026', sourceName: 'G1' }, 'Kim Kataguiri'),
    ).toBe('pagina_candidatura');
    expect(
      junkReason({ title: 'Weverton Rocha Candidato a Senador no Maranhão nas eleições 2026', sourceName: 'G1' }, 'Weverton'),
    ).toBe('pagina_candidatura');
    expect(
      junkReason({ title: 'CARLOS JORDY: candidatura a senador por Rio de Janeiro | Eleições 2026', sourceName: 'X' }, 'Carlos Jordy'),
    ).toBe('pagina_candidatura');
    expect(
      junkReason({ title: 'Delegado Marcelo Freitas 4444 (UNIÃO): candidato a Deputado Federal por MG', sourceName: 'X' }, 'Delegado Marcelo Freitas'),
    ).toBe('pagina_candidatura');
  });

  it('fonte que é o próprio partido (não é imprensa)', () => {
    const name = 'Fulano de Tal';
    const title = 'Fulano de Tal visita obras no interior';
    expect(junkReason({ title, sourceName: 'Republicanos 10' }, name)).toBe('fonte_partidaria');
    expect(junkReason({ title, sourceName: 'PSB 40' }, name)).toBe('fonte_partidaria');
    expect(junkReason({ title, sourceName: 'Partido dos Trabalhadores' }, name)).toBe('fonte_partidaria');
    expect(junkReason({ title, sourceName: 'Partido Social Democrático' }, name)).toBe('fonte_partidaria');
    expect(junkReason({ title, sourceName: 'republicanos10.org.br' }, name)).toBe('fonte_partidaria');
  });

  it('notícia de verdade passa — inclusive as que falam de candidatura', () => {
    const cases: Array<[string, string, string]> = [
      ['Eleições 2026: Alfredo Gaspar é o candidato a vice-presidente na chapa de Flávio Bolsonaro', 'G1', 'Alfredo Gaspar'],
      ['MDB lança Acácio Favacho como candidato ao Senado pelo Amapá', 'G1', 'Acácio Favacho'],
      ['Quaest para o Senado no Pará: Helder, 23%; Delegado Éder Mauro, 14%; Zequinha Marinho, 11%', 'CNN Brasil', 'Delegado Éder Mauro'],
      ['Poliana Radar desiste de candidatura a deputada federal e anuncia apoio a Ricardo Ayres', 'X', 'Ricardo Ayres'],
      ['Deputada Ana Paula Lima (PT)', 'X', 'Ana Paula Lima'],
      ['Assista à entrevista com Esperidião Amin (PP), candidato ao Senado por Santa Catarina', 'X', 'Esperidião Amin'],
      ['Eleições 2026: quem é Fernando Monteiro, candidato a deputado federal (Pernambuco)', 'X', 'Fernando Monteiro'],
      ['TRE-CE defere registro de candidatura de Idilvan Alencar a deputado federal', 'X', 'Idilvan Alencar'],
    ];
    for (const [title, sourceName, name] of cases) {
      expect(junkReason({ title, sourceName }, name), title).toBeNull();
    }
  });

  it('veículos com número no nome não são confundidos com partido', () => {
    const title = 'Fulano de Tal visita obras no interior';
    for (const sourceName of ['Fonte 83', 'Canal 38', 'Sul 21', 'Brasil 61', 'Rede 98']) {
      expect(junkReason({ title, sourceName }, 'Fulano de Tal'), sourceName).toBeNull();
    }
  });
});

describe('isWithinCurationWindow', () => {
  const now = new Date('2026-09-27T12:00:00Z');

  it(`aceita até ${CURATION_MAX_AGE_DAYS} dias, rejeita depois`, () => {
    expect(isWithinCurationWindow(new Date('2026-09-01T12:00:00Z'), now)).toBe(true);
    expect(isWithinCurationWindow(new Date('2026-08-27T12:00:00Z'), now)).toBe(false);
  });

  it('data inválida fica fora da janela', () => {
    expect(isWithinCurationWindow(new Date('lixo'), now)).toBe(false);
  });
});

describe('selectQueueExpirations', () => {
  const now = new Date('2026-09-27T12:00:00Z');
  const day = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  it('expira o que passou da janela, mesmo abaixo do teto', () => {
    const pending: PendingForTrim[] = [
      { id: 1, politicianId: 1, publishedAt: day(1) },
      { id: 2, politicianId: 1, publishedAt: day(40) },
    ];
    expect(selectQueueExpirations(pending, now)).toEqual({ tooOld: [2], overflow: [] });
  });

  it(`mantém só as ${CURATION_MAX_PENDING_PER_POLITICIAN} mais recentes por parlamentar`, () => {
    const pending: PendingForTrim[] = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      politicianId: 7,
      publishedAt: day(i), // id 1 = mais recente
    }));
    pending.push({ id: 100, politicianId: 8, publishedAt: day(3) });

    const { tooOld, overflow } = selectQueueExpirations(pending, now);
    expect(tooOld).toEqual([]);
    expect(overflow.sort((a, b) => a - b)).toEqual([6, 7, 8]);
  });

  it('item velho não ocupa vaga no teto', () => {
    const pending: PendingForTrim[] = [
      ...Array.from({ length: 5 }, (_, i) => ({ id: i + 1, politicianId: 1, publishedAt: day(i) })),
      { id: 99, politicianId: 1, publishedAt: day(60) },
    ];
    expect(selectQueueExpirations(pending, now)).toEqual({ tooOld: [99], overflow: [] });
  });
});
