import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrigemDosRecursos } from '../OrigemDosRecursos';
import type { BySource } from '@/lib/origemRecursos';

const base: BySource = { fundoEleitoral: 0, fundoPartidario: 0, partido: 0, pessoasFisicas: 0, proprios: 0, outrosCandidatos: 0, outras: 0 };

describe('OrigemDosRecursos', () => {
  it('não renderiza nada quando tudo é zero', () => {
    const { container } = render(<OrigemDosRecursos bySource={base} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('diz o percentual vindo de fundos públicos e lista cada origem com valor e %', () => {
    render(<OrigemDosRecursos bySource={{ ...base, fundoEleitoral: 800_000, fundoPartidario: 100_000, pessoasFisicas: 100_000 }} />);
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('Fundo Eleitoral')).toBeInTheDocument();
    expect(screen.getByText('Doações de pessoas físicas')).toBeInTheDocument();
    expect(screen.getByText(/R\$ 800\.000/)).toBeInTheDocument();
    expect(screen.queryByText('Recursos do próprio candidato')).toBeNull();
  });

  it('a barra tem descrição textual para leitor de tela, com todos os percentuais', () => {
    render(<OrigemDosRecursos bySource={{ ...base, fundoEleitoral: 750, pessoasFisicas: 250 }} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('aria-label')).toContain('Fundo Eleitoral: 75%');
    expect(img.getAttribute('aria-label')).toContain('Doações de pessoas físicas: 25%');
  });

  it('avisa que fundo público é a regra e não indício de irregularidade', () => {
    render(<OrigemDosRecursos bySource={{ ...base, fundoEleitoral: 1 }} />);
    expect(screen.getByText(/não indício de irregularidade/)).toBeInTheDocument();
  });

  it('sem fundos públicos, não afirma percentual de fundos', () => {
    render(<OrigemDosRecursos bySource={{ ...base, proprios: 500 }} />);
    expect(screen.queryByText(/fundos públicos \(Fundo/)).toBeNull();
  });

  it('origem minúscula aparece como "menos de 1"', () => {
    render(<OrigemDosRecursos bySource={{ ...base, fundoEleitoral: 1_000_000, outras: 10 }} />);
    expect(screen.getByText(/menos de 1%/)).toBeInTheDocument();
  });
});
