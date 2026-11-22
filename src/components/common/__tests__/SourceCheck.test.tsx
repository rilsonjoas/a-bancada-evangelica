import { describe, it, expect } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SourceCheck } from '../SourceCheck';

const render = (ui: ReactElement) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

const link = { label: 'Ver perfil na Câmara dos Deputados', url: 'https://www.camara.leg.br/deputados/204379' };

describe('SourceCheck: "Verifique você mesmo"', () => {
  it('mostra o texto de limite e o link para a fonte oficial', () => {
    render(<SourceCheck description="Os votos vêm dos dados abertos da Câmara." links={[link]} />);

    expect(screen.getByRole('complementary', { name: /verifique você mesmo/i })).toBeInTheDocument();
    expect(screen.getByText(/os votos vêm dos dados abertos da câmara/i)).toBeInTheDocument();
    // O texto deixa claro o que o link confirma e o que não confirma.
    expect(screen.getByText(/a nota é um cálculo nosso/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver perfil na câmara dos deputados/i })).toHaveAttribute(
      'href',
      link.url,
    );
  });

  it('abre em nova aba sem vazar referrer e avisa quem usa leitor de tela', () => {
    render(<SourceCheck description="x" links={[link]} />);
    const a = screen.getByRole('link', { name: /ver perfil na câmara dos deputados/i });
    expect(a).toHaveAttribute('target', '_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
    expect(a.getAttribute('rel')).toContain('noreferrer');
    expect(a).toHaveTextContent(/abre em nova aba/i);
  });

  it('não renderiza nada quando nenhum link tem URL (sem promessa vazia)', () => {
    const { container } = render(
      <SourceCheck description="x" links={[{ label: '', url: null }]} />,
    );
    expect(container.querySelector('aside')).toBeNull();
  });

  it('ignora links sem URL e mantém os válidos', () => {
    render(<SourceCheck description="x" links={[{ label: 'sem url', url: null }, link]} />);
    expect(screen.queryByText('sem url')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('só aceita https (defesa contra URL inesperada vinda de dado)', () => {
    const { container } = render(
      <SourceCheck description="x" links={[{ label: 'ruim', url: 'javascript:alert(1)' }]} />,
    );
    expect(container.querySelector('aside')).toBeNull();
  });

  it('a frase do que é cálculo nosso pode ser trocada (ex.: despesas marcadas)', () => {
    render(<SourceCheck description="x" calculo="A marcação de gastos fora do padrão é um cálculo nosso" links={[link]} />);
    expect(screen.getByText(/a marcação de gastos fora do padrão é um cálculo nosso/i)).toBeInTheDocument();
    expect(screen.queryByText(/a nota é um cálculo nosso/i)).toBeNull();
  });
});
