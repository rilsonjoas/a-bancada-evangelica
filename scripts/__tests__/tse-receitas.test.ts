import { describe, it, expect } from 'vitest';
import {
  isRelevantOffice,
  parseMoneyBRL,
  maskDoc,
  classifyDonor,
  newAggregate,
  accumulateReceita,
  summarize,
  categorizarReceita,
  lerDoBrasil,
  type ReceitaRow,
} from '../lib/tse-receitas';

function row(overrides: Partial<ReceitaRow> = {}): ReceitaRow {
  return {
    DS_CARGO: 'Deputado Federal',
    NR_CPF_CANDIDATO: '12345678901',
    NR_CPF_CNPJ_DOADOR: '12345678000199',
    NM_DOADOR: 'EMPRESA EXEMPLO LTDA',
    DS_ORIGEM_RECEITA: 'Recursos de pessoas jurídicas',
    VR_RECEITA: '1000,00',
    ...overrides,
  };
}

describe('isRelevantOffice', () => {
  it('aceita os dois cargos do produto em qualquer caixa', () => {
    expect(isRelevantOffice('Deputado Federal')).toBe(true);
    expect(isRelevantOffice('DEPUTADO FEDERAL')).toBe(true);
    expect(isRelevantOffice('Senador')).toBe(true);
    expect(isRelevantOffice(' SENADOR ')).toBe(true);
  });

  it('rejeita cargos fora do escopo', () => {
    expect(isRelevantOffice('Deputado Estadual')).toBe(false);
    expect(isRelevantOffice('Vereador')).toBe(false);
    expect(isRelevantOffice('Presidente')).toBe(false);
    expect(isRelevantOffice('')).toBe(false);
  });
});

describe('parseMoneyBRL', () => {
  it('converte formato TSE com vírgula decimal', () => {
    expect(parseMoneyBRL('9000,00')).toBe(9000);
    expect(parseMoneyBRL('1.234.567,89')).toBe(1234567.89);
    expect(parseMoneyBRL('1500,5')).toBe(1500.5);
  });

  it('não explode com lixo do dataset — vira 0', () => {
    expect(parseMoneyBRL('#NULO#')).toBe(0);
    expect(parseMoneyBRL('')).toBe(0);
    expect(parseMoneyBRL('abc')).toBe(0);
  });
});

describe('maskDoc', () => {
  it('mascara CPF preservando só o miolo', () => {
    expect(maskDoc('12345678901')).toBe('***.456.789-**');
  });

  it('mascara CNPJ preservando só o miolo', () => {
    expect(maskDoc('12345678000199')).toBe('**.345.678/0001-**');
  });

  it('documento ausente não vira máscara enganosa', () => {
    expect(maskDoc('#NULO')).toBe('(não identificado)');
    expect(maskDoc('')).toBe('(não identificado)');
  });
});

describe('classifyDonor', () => {
  it('CPF → pf, CNPJ → pj', () => {
    expect(classifyDonor(row({ NR_CPF_CNPJ_DOADOR: '96672501568' })).type).toBe('pf');
    expect(classifyDonor(row()).type).toBe('pj');
  });

  it('sem documento usa a origem declarada como fallback', () => {
    const estimada = row({
      NR_CPF_CNPJ_DOADOR: '#NULO',
      DS_ORIGEM_RECEITA: 'Recursos de pessoas físicas',
    });
    const result = classifyDonor(estimada);
    expect(result.type).toBe('pf');
    expect(result.key).toBe('__estimado:pf__');
    // pseudo-doador agrupa estimados sem inflar contagem de pessoas
    expect(classifyDonor(row({ NR_CPF_CNPJ_DOADOR: '-1', DS_ORIGEM_RECEITA: 'Recursos de pessoas físicas' })).key)
      .toBe('__estimado:pf__');
  });
});

describe('accumulateReceita + summarize', () => {
  it('agrega totais, contagens e maior doação', () => {
    const agg = newAggregate(42);
    accumulateReceita(agg, row({ VR_RECEITA: '1000,00' }));
    accumulateReceita(agg, row({ VR_RECEITA: '250,50' }));
    accumulateReceita(agg, row({ VR_RECEITA: '5000,00', NM_DOADOR: 'OUTRA LTDA', NR_CPF_CNPJ_DOADOR: '98765432000155' }));

    const summary = summarize(agg);
    expect(summary.totalReceived).toBe(6250.5);
    expect(summary.donationCount).toBe(3);
    expect(summary.largestDonation).toBe(5000);
    expect(summary.donorPjCount).toBe(2);
    expect(summary.topDonors[0].name).toBe('OUTRA LTDA');
    expect(summary.topDonors[0].amount).toBe(5000);
  });

  it('doações repetidas do mesmo doador somam no agregado dele', () => {
    const agg = newAggregate(7);
    accumulateReceita(agg, row({ VR_RECEITA: '300,00' }));
    accumulateReceita(agg, row({ VR_RECEITA: '200,00' }));

    const summary = summarize(agg);
    expect(summary.donorPjCount).toBe(1); // 1 doador distinto
    expect(summary.donationCount).toBe(2); // 2 lançamentos
    expect(summary.topDonors[0].count).toBe(2);
    expect(summary.topDonors[0].doc).toBe('**.345.678/0001-**'); // mascarado
  });

  it('top donors ordena por valor desc e corta em 10', () => {
    const agg = newAggregate(1);
    for (let i = 1; i <= 15; i++) {
      const doc = String(i).padStart(14, '9');
      accumulateReceita(agg, row({ VR_RECEITA: `${i * 100},00`, NR_CPF_CNPJ_DOADOR: doc }));
    }
    const summary = summarize(agg);
    expect(summary.topDonors).toHaveLength(10);
    expect(summary.topDonors[0].amount).toBe(1500);
    expect(summary.topDonors[9].amount).toBe(600);
  });

  it('agregado vazio produz resumo zerado honesto', () => {
    const summary = summarize(newAggregate(9));
    expect(summary.totalReceived).toBe(0);
    expect(summary.donationCount).toBe(0);
    expect(summary.topDonors).toHaveLength(0);
  });
});

describe('categorizarReceita (origem do dinheiro, Fase C)', () => {
  const c = (fonte: string | undefined, origem: string) => categorizarReceita({ DS_FONTE_RECEITA: fonte, DS_ORIGEM_RECEITA: origem });

  it.each([
    ['FUNDO ESPECIAL', 'Recursos de partido político', 'fundo_eleitoral'],
    ['FUNDO PARTIDARIO', 'Recursos de partido político', 'fundo_partidario'],
    ['OUTROS RECURSOS', 'Recursos de partido político', 'partido'],
    ['OUTROS RECURSOS', 'Recursos de pessoas físicas', 'pessoas_fisicas'],
    ['OUTROS RECURSOS', 'Recursos próprios', 'proprios'],
    ['OUTROS RECURSOS', 'Recursos de outros candidatos', 'outros_candidatos'],
    ['OUTROS RECURSOS', 'Recursos de Financiamento Coletivo', 'outras'],
    ['OUTROS RECURSOS', 'Doações pela Internet', 'outras'],
    ['OUTROS RECURSOS', 'Rendimentos de aplicações financeiras', 'outras'],
    ['OUTROS RECURSOS', 'Recursos de origens não identificadas', 'outras'],
    ['#NULO', '#NULO', 'outras'],
  ])('%s + %s -> %s', (fonte, origem, esperado) => {
    expect(c(fonte, origem)).toBe(esperado);
  });

  it('o fundo vence a origem: FEFC repassado por outro candidato continua sendo fundo eleitoral', () => {
    expect(c('FUNDO ESPECIAL', 'Recursos de outros candidatos')).toBe('fundo_eleitoral');
    expect(c('FUNDO PARTIDARIO', 'Recursos de outros candidatos')).toBe('fundo_partidario');
  });

  it('ignora acento e caixa; sem fonte, decide pela origem', () => {
    expect(c('fundo partidário', 'x')).toBe('fundo_partidario');
    expect(c(undefined, 'RECURSOS DE PESSOAS FÍSICAS')).toBe('pessoas_fisicas');
  });

  it('origem desconhecida nunca some: vai para "outras"', () => {
    expect(c('OUTROS RECURSOS', 'Origem inventada em 2030')).toBe('outras');
  });
});

describe('accumulateReceita: por origem', () => {
  const linha = (fonte: string, origem: string, valor: string, sq = '111'): ReceitaRow => ({
    DS_CARGO: 'Deputado Federal', NR_CPF_CANDIDATO: '1', NR_CPF_CNPJ_DOADOR: '12345678000199', NM_DOADOR: 'X',
    DS_ORIGEM_RECEITA: origem, VR_RECEITA: valor, DS_FONTE_RECEITA: fonte, SQ_CANDIDATO: sq,
  });

  it('a soma das categorias é exatamente o total arrecadado', () => {
    const agg = newAggregate(1);
    accumulateReceita(agg, linha('FUNDO ESPECIAL', 'Recursos de partido político', '1.000.000,50'));
    accumulateReceita(agg, linha('OUTROS RECURSOS', 'Recursos de pessoas físicas', '250,25'));
    accumulateReceita(agg, linha('OUTROS RECURSOS', 'Origem nova', '10,00'));
    const s = summarize(agg);
    expect(s.bySource.fundo_eleitoral).toBe(1000000.5);
    expect(s.bySource.pessoas_fisicas).toBe(250.25);
    expect(s.bySource.outras).toBe(10);
    expect(Object.values(s.bySource).reduce((a, b) => a + b, 0)).toBeCloseTo(s.totalReceived, 2);
  });

  it('guarda o SQ_CANDIDATO da primeira linha', () => {
    const agg = newAggregate(1);
    accumulateReceita(agg, linha('OUTROS RECURSOS', 'Recursos próprios', '1,00', ' 160001 '));
    accumulateReceita(agg, linha('OUTROS RECURSOS', 'Recursos próprios', '1,00', '999'));
    expect(summarize(agg).sqCandidato).toBe('160001');
  });

  it('candidato sem linhas: tudo zero e sem SQ', () => {
    const s = summarize(newAggregate(9));
    expect(Object.values(s.bySource).every((v) => v === 0)).toBe(true);
    expect(s.sqCandidato).toBeNull();
  });
});

describe('lerDoBrasil: só estados sem arquivo próprio (achado: zip 2022 sem DF)', () => {
  const proprios = new Set(['SP', 'RJ']);
  it('lê o DF e ignora estados já lidos (sem contar duas vezes)', () => {
    expect(lerDoBrasil({ SG_UF: 'DF' }, proprios)).toBe(true);
    expect(lerDoBrasil({ SG_UF: 'SP' }, proprios)).toBe(false);
    expect(lerDoBrasil({ SG_UF: ' rj ' }, proprios)).toBe(false);
  });
  it('UF vazia, ausente ou inválida não é lida', () => {
    expect(lerDoBrasil({ SG_UF: '' }, proprios)).toBe(false);
    expect(lerDoBrasil({}, proprios)).toBe(false);
    expect(lerDoBrasil({ SG_UF: 'BRASIL' }, proprios)).toBe(false);
  });
});
