import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { EvolucaoBens } from '../EvolucaoBens';
import type { BensDeclaradosDto } from '@/hooks/usePoliticianDetail';

const por = (o: Partial<NonNullable<BensDeclaradosDto['byType']>> = {}) => ({ imoveis: 0, moveis: 0, participacoes: 0, aplicacoes: 0, creditos: 0, dinheiro: 0, outros: 0, ...o });
const a22: BensDeclaradosDto = { electionYear: 2022, total: 1_000_000, itemCount: 8, unverified: false, byType: por({ imoveis: 900_000, dinheiro: 100_000 }) };
const a26: BensDeclaradosDto = { electionYear: 2026, total: 1_800_000, itemCount: 11, unverified: false, byType: por({ imoveis: 1_500_000, dinheiro: 50_000, participacoes: 250_000 }) };

describe('EvolucaoBens', () => {
  it('não renderiza com zero ou um ponto (evolução precisa de duas eleições)', () => {
    for (const h of [undefined, [], [a22]]) {
      const { container, unmount } = render(<EvolucaoBens history={h} />);
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });

  it('mostra as duas eleições lado a lado, com valores brutos', () => {
    render(<EvolucaoBens history={[a22, a26]} />);
    const t = screen.getByRole('table');
    expect(within(t).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Grupo', '2022', '2026']);
    expect(within(t).getByText(/R\$ 1\.000\.000/)).toBeInTheDocument();
    expect(within(t).getByText(/R\$ 1\.800\.000/)).toBeInTheDocument();
  });

  it('só lista os grupos que têm valor em alguma das eleições', () => {
    render(<EvolucaoBens history={[a22, a26]} />);
    expect(screen.getByText('Participações em empresas')).toBeInTheDocument(); // só em 2026
    expect(screen.queryByText('Créditos a receber')).toBeNull();
  });

  it('NÃO calcula diferença, percentual nem usa linguagem de crescimento ou de acusação', () => {
    const { container } = render(<EvolucaoBens history={[a22, a26]} />);
    expect(container.textContent).not.toMatch(/enriquec|cresc|aument|%|variaç|diferença de|a mais|mais rico|suspeit|ilícit/i);
    expect(container.textContent).not.toMatch(/[▲▼↑↓]/);
    // o texto avisa que NÃO calcula (a palavra "diferença" aparece só nessa frase)
    expect(screen.getByText(/sem calcular diferença/)).toBeInTheDocument();
  });

  it('uma eleição sem verificação aparece como "não exibido" e não vaza o valor', () => {
    const ruim: BensDeclaradosDto = { electionYear: 2026, total: null, itemCount: 2, unverified: true, byType: null };
    const { container } = render(<EvolucaoBens history={[a22, ruim]} />);
    expect(container.textContent).toContain('não exibido');
    expect(container.textContent).not.toMatch(/9\.999/);
  });

  it('três eleições: três colunas em ordem', () => {
    const a18: BensDeclaradosDto = { ...a22, electionYear: 2018 };
    render(<EvolucaoBens history={[a18, a22, a26]} />);
    expect(within(screen.getByRole('table')).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Grupo', '2018', '2022', '2026']);
  });
});
