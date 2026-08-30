import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ThemePage from '../ThemePage';

const { MOCK_DATA } = vi.hoisted(() => ({
  MOCK_DATA: {
    keyAgendas: [
      {
        id: 'a1',
        title: 'PL 2159/2021 — Licenciamento ambiental',
        description: 'Regras para licenciar obras que afetam o meio ambiente.',
        criteria: 'SOCIAL_RESPONSIBILITY',
        theme: 'meio-ambiente-energia',
        totalVotes: 444,
        favorableVotes: 300,
        contraryVotes: 140,
        abstentions: 4,
        consensusScore: 68,
      },
      {
        id: 'a2',
        title: 'PLP 233/2023 — SPVAT',
        description: 'Seguro obrigatório de trânsito.',
        criteria: 'SOCIAL_RESPONSIBILITY',
        theme: 'transito',
        totalVotes: 100,
        favorableVotes: 60,
        contraryVotes: 40,
        abstentions: 0,
        consensusScore: 60,
      },
    ],
  },
}));

vi.mock('@/hooks/useVotingAnalysisData', () => ({
  useVotingAnalysisData: () => ({ data: MOCK_DATA }),
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/temas/:slug" element={<ThemePage />} />
      </Routes>
    </MemoryRouter>
  );

describe('ThemePage — M2 páginas por tema', () => {
  beforeEach(() => {
    cleanup();
    document.title = 'A Bancada Evangélica — Transparência Parlamentar';
  });

  it('mostra o hero do tema e diz quantas proposições há', () => {
    renderAt('/temas/meio-ambiente-energia');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      'Meio ambiente e energia'
    );
    expect(screen.getByText(/1 pauta-chave/)).toBeInTheDocument();
    expect(screen.getByText(/PL 2159\/2021/)).toBeInTheDocument();
  });

  it('atualiza o <title> para SEO do tema', () => {
    renderAt('/temas/meio-ambiente-energia');
    expect(document.title).toContain('Meio ambiente e energia');
  });

  it('não lista pautas de outros temas', () => {
    renderAt('/temas/transito');
    expect(screen.getByText(/PLP 233\/2023/)).toBeInTheDocument();
    expect(screen.queryByText(/PL 2159\/2021/)).not.toBeInTheDocument();
  });

  it('tema desconhecido mostra estado de não encontrado', () => {
    renderAt('/temas/nao-existe');
    expect(screen.getByText(/Este tema não existe/)).toBeInTheDocument();
  });
});