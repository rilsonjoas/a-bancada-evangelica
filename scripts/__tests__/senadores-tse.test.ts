import { describe, it, expect } from 'vitest';
import { casarComCpf, dataBR, paraFicha, resumoSenadores, type CandidatoSenadorTse, type FichaSenadorDb } from '../lib/senadores-tse';

const ficha = (o: Partial<FichaSenadorDb> = {}): FichaSenadorDb => ({ id: 1, name: 'Fulano', full_name: 'FULANO DE TAL', current_state: 'PE', birth_date: new Date('1960-02-01T12:00:00Z'), ...o });
const cand = (o: Partial<CandidatoSenadorTse> = {}): CandidatoSenadorTse => ({ sq: 's1', nome: 'FULANO DE TAL', uf: 'PE', nascimento: '01/02/1960', cpf: '12345678901', ...o });

describe('dataBR', () => {
  it('formata em UTC (meio-dia UTC não muda de dia em nenhum fuso)', () => {
    expect(dataBR(new Date('1960-02-01T12:00:00Z'))).toBe('01/02/1960');
    expect(dataBR(new Date('1960-02-01T00:00:00Z'))).toBe('01/02/1960');
  });
  it.each([[null], [undefined], [new Date('x')]])('inválida (%p): null', (d) => expect(dataBR(d as Date)).toBeNull());
});

describe('casarComCpf', () => {
  it('liga a ficha ao CPF do candidato, só em memória', () => {
    const r = casarComCpf([ficha()], [cand()]);
    expect(r.cpfPorFicha.get(1)).toBe('12345678901');
    expect(r.semFicha).toBe(0);
  });
  it('homônimo (nascimento diferente) não casa', () => {
    const r = casarComCpf([ficha()], [cand({ nascimento: '02/02/1960' })]);
    expect(r.cpfPorFicha.size).toBe(0);
    expect(r.semFicha).toBe(1);
  });
  it('candidato sem CPF utilizável é ignorado, não casa por engano', () => {
    for (const cpf of ['', '#NULO#', '1234', '123456789012']) {
      expect(casarComCpf([ficha()], [cand({ cpf })]).cpfPorFicha.size).toBe(0);
    }
  });
  it('ficha sem nascimento nunca casa', () => {
    expect(casarComCpf([ficha({ birth_date: null })], [cand()]).cpfPorFicha.size).toBe(0);
  });
  it('duas candidaturas da mesma pessoa: ambíguo, não casa nenhuma', () => {
    const r = casarComCpf([ficha()], [cand({ sq: 'a' }), cand({ sq: 'b' })]);
    expect(r.cpfPorFicha.size).toBe(0);
    expect(r.ambiguos).toBe(2);
  });
  it('resumo legível para o log', () => {
    expect(resumoSenadores(casarComCpf([ficha()], [cand()]))).toBe('Senadores: 1 de 1 fichas casadas (nome + UF + nascimento) | candidatos sem ficha: 0 | ambíguos (ignorados): 0');
  });
  it('paraFicha converte as colunas do banco', () => {
    expect(paraFicha(ficha())).toEqual({ id: 1, name: 'Fulano', fullName: 'FULANO DE TAL', uf: 'PE', birth: '01/02/1960' });
  });
});
