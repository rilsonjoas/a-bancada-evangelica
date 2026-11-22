import { describe, it, expect } from 'vitest';
import { casarSenadores, chave, normalizarNome, type CandidatoTse, type SenadorFicha } from '../lib/casar-senadores';

const ficha = (over: Partial<SenadorFicha> = {}): SenadorFicha => ({ id: 1, name: 'Fulano', fullName: 'FULANO DE TAL SILVA', uf: 'PE', birth: '01/02/1960', ...over });
const cand = (over: Partial<CandidatoTse> = {}): CandidatoTse => ({ sq: 's1', nome: 'FULANO DE TAL SILVA', uf: 'PE', nascimento: '01/02/1960', ...over });

describe('chave', () => {
  it('ignora acento, caixa e espaços repetidos', () => {
    expect(chave('  José   da Conceição ', 'pe', '01/02/1960')).toBe('JOSE DA CONCEICAO|PE|01/02/1960');
    expect(normalizarNome('ÁGUIA')).toBe('AGUIA');
  });
  it.each([[null, 'PE', '01/02/1960'], ['A', '', '01/02/1960'], ['A', 'PE', null], ['A', 'PE', '1960-02-01'], ['A', 'PER', '01/02/1960'], ['', 'PE', '01/02/1960']])(
    'falta componente ou formato inválido (%p, %p, %p): sem chave',
    (n, u, d) => expect(chave(n as string, u as string, d as string)).toBeNull(),
  );
});

describe('casarSenadores', () => {
  it('casa por nome completo + UF + nascimento', () => {
    const r = casarSenadores([ficha()], [cand()]);
    expect(r.casados.get('s1')).toBe(1);
    expect(r.semFicha).toHaveLength(0);
  });
  it('também casa pelo nome parlamentar quando o nome completo difere', () => {
    const r = casarSenadores([ficha({ fullName: null, name: 'Fulano de Tal Silva' })], [cand()]);
    expect(r.casados.get('s1')).toBe(1);
  });
  it('mesmo nome e UF, nascimento diferente: NÃO casa (homônimo)', () => {
    const r = casarSenadores([ficha()], [cand({ nascimento: '01/02/1961' })]);
    expect(r.casados.size).toBe(0);
    expect(r.semFicha).toHaveLength(1);
  });
  it('mesmo nome e nascimento, UF diferente: NÃO casa', () => {
    expect(casarSenadores([ficha()], [cand({ uf: 'SP' })]).casados.size).toBe(0);
  });
  it('nome parecido (faltando um sobrenome) NÃO casa: nada de aproximação', () => {
    expect(casarSenadores([ficha()], [cand({ nome: 'FULANO DE TAL' })]).casados.size).toBe(0);
  });
  it('ficha sem data de nascimento ou sem UF nunca casa', () => {
    expect(casarSenadores([ficha({ birth: null })], [cand()]).casados.size).toBe(0);
    expect(casarSenadores([ficha({ uf: null })], [cand()]).casados.size).toBe(0);
  });
  it('duas fichas com a mesma chave: candidato ambíguo, não adivinha', () => {
    const r = casarSenadores([ficha({ id: 1 }), ficha({ id: 2 })], [cand()]);
    expect(r.casados.size).toBe(0);
    expect(r.ambiguos).toHaveLength(1);
  });
  it('duas candidaturas da mesma pessoa casando com a mesma ficha: ambas ambíguas', () => {
    const r = casarSenadores([ficha()], [cand({ sq: 'a' }), cand({ sq: 'b' })]);
    expect(r.casados.size).toBe(0);
    expect(r.ambiguos.map((c) => c.sq).sort()).toEqual(['a', 'b']);
  });
  it('lista vazia não quebra', () => {
    const r = casarSenadores([], []);
    expect(r.casados.size + r.semFicha.length + r.ambiguos.length).toBe(0);
  });
});
