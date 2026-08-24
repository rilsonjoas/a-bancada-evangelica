import { describe, it, expect } from 'vitest';
import {
  isRelevantOffice,
  parseMoneyBRL,
  maskDoc,
  classifyDonor,
  newAggregate,
  accumulateReceita,
  summarize,
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
