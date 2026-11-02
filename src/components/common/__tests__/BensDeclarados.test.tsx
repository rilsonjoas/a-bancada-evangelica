import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BensDeclarados } from '../BensDeclarados';

const por = { imoveis: 700_000, moveis: 100_000, participacoes: 0, aplicacoes: 150_000, creditos: 0, dinheiro: 49_999, outros: 1 };
const ok = { electionYear: 2022, total: 1_000_000, itemCount: 12, unverified: false, byType: por };

describe('BensDeclarados', () => {
  it('mostra total, número de bens e só os grupos com valor', () => {
    render(<BensDeclarados assets={ok} />);
    expect(screen.getByText(/R\$ 1\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Imóveis')).toBeInTheDocument();
    expect(screen.queryByText('Participações em empresas')).toBeNull();
    expect(screen.queryByText('Créditos a receber')).toBeNull();
  });
  it('diz de quem é o valor e o que ele não é', () => {
    render(<BensDeclarados assets={ok} />);
    expect(screen.getByText(/declarados pelo próprio candidato ao TSE em 2022/)).toBeInTheDocument();
    expect(screen.getByText(/Não são valor de mercado/)).toBeInTheDocument();
  });
  it('sem verificação: não mostra total, só a explicação', () => {
    render(<BensDeclarados assets={{ electionYear: 2022, total: null, itemCount: 3, unverified: true, byType: null }} />);
    expect(screen.queryByText(/R\$/)).toBeNull();
    expect(screen.getByText(/acima do limite que o site usa para exibir sem checagem/)).toBeInTheDocument();
  });
  it('sem divisão por grupo (byType null): mostra o total e não quebra', () => {
    render(<BensDeclarados assets={{ ...ok, byType: null }} />);
    expect(screen.getByText(/R\$ 1\.000\.000/)).toBeInTheDocument();
  });
  it('nunca usa linguagem de comparação ou de acusação', () => {
    const { container } = render(<BensDeclarados assets={ok} />);
    expect(container.textContent).not.toMatch(/enriquec|patrim[oô]nio cresc|mais rico|suspeit|ilícit/i);
  });
});
