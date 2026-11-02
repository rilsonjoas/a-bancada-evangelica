import { describe, it, expect } from 'vitest';
import { render as rtlRender, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { FontesDeDados } from '../FontesDeDados';
import { FONTES_DE_DADOS } from '@/lib/sources';

const render = (ui: ReactElement) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

describe('FontesDeDados: "De onde vem cada dado"', () => {
  it('tem um título de seção e uma lista com todas as fontes do catálogo', () => {
    render(<FontesDeDados />);
    expect(screen.getByRole('heading', { name: /de onde vem cada dado/i })).toBeInTheDocument();
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(FONTES_DE_DADOS.length);
  });

  it('cada fonte tem link para a página oficial e diz o que fornece', () => {
    render(<FontesDeDados />);
    for (const f of FONTES_DE_DADOS) {
      const a = screen.getByRole('link', { name: new RegExp(f.nome.replace(/[()]/g, '\\$&'), 'i') });
      expect(a).toHaveAttribute('href', f.url);
      expect(screen.getByText(f.fornece)).toBeInTheDocument();
    }
  });

  it('abre as fontes em nova aba, sem vazar referrer, e avisa o leitor de tela', () => {
    render(<FontesDeDados />);
    for (const a of screen.getAllByRole('link').filter((l) => l.getAttribute('href')?.startsWith('https://'))) {
      expect(a).toHaveAttribute('target', '_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
      expect(a.getAttribute('rel')).toContain('noreferrer');
      expect(a).toHaveTextContent(/abre em nova aba/i);
    }
  });

  it('avisa que o dado de campanha é declarado pelas próprias campanhas', () => {
    render(<FontesDeDados />);
    expect(screen.getByText(/declarado pelas próprias campanhas/i)).toBeInTheDocument();
  });
});

describe('FontesDeDados: honestidade do texto', () => {
  it('não afirma que tudo é oficial: cita o Google Notícias e a estimativa pelo partido', () => {
    render(<FontesDeDados />);
    expect(screen.queryByText(/tudo o que o site mostra vem de dados abertos oficiais/i)).not.toBeInTheDocument();
    expect(screen.getByText(/busca no google notícias/i)).toBeInTheDocument();
    expect(screen.getByText(/estimativa a partir do histórico do partido/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Metodologia' })).toHaveAttribute('href', '/metodologia');
  });
});
