/**
 * Origem dos recursos de campanha: rótulos e contas da ficha
 * (Fase C de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 */

export interface BySource {
  fundoEleitoral: number;
  fundoPartidario: number;
  partido: number;
  pessoasFisicas: number;
  proprios: number;
  outrosCandidatos: number;
  outras: number;
}

export interface CategoriaOrigem {
  key: keyof BySource;
  label: string;
  /** Uma frase que diz o que a categoria é, sem juízo. */
  explicacao: string;
  /** Cor do segmento da barra. A leitura nunca depende só dela: há rótulo e valor. */
  cor: string;
}

export const CATEGORIAS_ORIGEM: ReadonlyArray<CategoriaOrigem> = [
  { key: 'fundoEleitoral', label: 'Fundo Eleitoral', explicacao: 'Dinheiro público do Fundo Especial de Financiamento de Campanha (FEFC), distribuído pelo partido.', cor: '#1e3a8a' },
  { key: 'fundoPartidario', label: 'Fundo Partidário', explicacao: 'Dinheiro público do Fundo Partidário, repassado pelo partido.', cor: '#3b82f6' },
  { key: 'partido', label: 'Outros recursos do partido', explicacao: 'Dinheiro do próprio partido que não vem dos fundos públicos.', cor: '#7c3aed' },
  { key: 'pessoasFisicas', label: 'Doações de pessoas físicas', explicacao: 'Doações de cidadãos. Em 2022 empresas não podiam doar.', cor: '#047857' },
  { key: 'proprios', label: 'Recursos do próprio candidato', explicacao: 'Dinheiro que o candidato colocou na campanha.', cor: '#b45309' },
  { key: 'outrosCandidatos', label: 'Repasses de outros candidatos', explicacao: 'Dinheiro transferido por outros candidatos.', cor: '#0e7490' },
  { key: 'outras', label: 'Outras origens', explicacao: 'Financiamento coletivo, doações pela internet, rendimentos de aplicações e origens não identificadas na prestação de contas.', cor: '#6b7280' },
];

/**
 * Percentuais inteiros que somam exatamente 100 (maior resto), para a lista
 * não mostrar 99% nem 101% por arredondamento. Soma zero devolve zeros.
 */
export function percentuaisInteiros(valores: ReadonlyArray<number>): number[] {
  const total = valores.reduce((a, b) => a + b, 0);
  if (!(total > 0)) return valores.map(() => 0);
  const brutos = valores.map((v) => (v / total) * 100);
  const base = brutos.map(Math.floor);
  let faltam = 100 - base.reduce((a, b) => a + b, 0);
  const ordem = brutos
    .map((b, i) => ({ i, resto: b - Math.floor(b) }))
    .sort((a, b) => b.resto - a.resto || a.i - b.i);
  for (const { i } of ordem) {
    if (faltam <= 0) break;
    base[i] += 1;
    faltam -= 1;
  }
  return base;
}

/** Quanto do total veio dos dois fundos públicos (inteiro, 0 a 100), ou null sem total. */
export function percentualFundosPublicos(s: BySource): number | null {
  const total = CATEGORIAS_ORIGEM.reduce((acc, c) => acc + s[c.key], 0);
  if (!(total > 0)) return null;
  return Math.round(((s.fundoEleitoral + s.fundoPartidario) / total) * 100);
}
