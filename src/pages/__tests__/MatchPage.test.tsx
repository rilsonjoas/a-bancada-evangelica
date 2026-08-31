import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MatchPage from '../Match';

const { MOCK_POLITICIANS } = vi.hoisted(() => ({
  MOCK_POLITICIANS: [
    {
      id: 1,
      name: 'Dep. Alinhada',
      currentParty: 'PCdoB',
      currentState: 'SP',
      currentHouse: 'CAMARA',
      photoUrl: '',
      scores: {
        lifeProtection: 95,
        familyValues: 70,
        moralIntegrity: 70,
        socialResponsibility: 70,
        religiousFreedom: 70,
        overall: 77.5,
      },
    },
    {
      id: 2,
      name: 'Dep. Oposta',
      currentParty: 'PL',
      currentState: 'MG',
      currentHouse: 'CAMARA',
      photoUrl: '',
      scores: {
        lifeProtection: 20,
        familyValues: 80,
        moralIntegrity: 80,
        socialResponsibility: 80,
        religiousFreedom: 80,
        overall: 62,
      },
    },
  ],
}));

vi.mock('@/hooks/usePoliticians', () => ({
  usePoliticians: () => ({ data: { politicians: MOCK_POLITICIANS }, isLoading: false }),
}));

const renderMatch = () =>
  render(
    <MemoryRouter>
      <MatchPage />
    </MemoryRouter>
  );

const answerAllConcordo = () => {
  for (let i = 0; i < 5; i++) {
    fireEvent.click(screen.getByRole('button', { name: /Concordo/ }));
  }
};

describe('MatchPage — M1 Match Eleitor', () => {
  beforeEach(() => {
    cleanup();
    document.title = 'A Bancada Evangélica — Transparência Parlamentar';
  });

  it('começa na primeira pergunta do quiz', () => {
    renderMatch();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Quem vota como você?'
    );
    expect(screen.getByText('Pergunta 1 de 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Concordo/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pular/ })).toBeInTheDocument();
  });

  it('após 5 respostas, mostra o ranking por afinidade com nomes e notas', () => {
    renderMatch();
    answerAllConcordo();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Parlamentares mais próximos'
    );
    expect(screen.getByText('Dep. Alinhada')).toBeInTheDocument();
    expect(screen.getByText('Dep. Oposta')).toBeInTheDocument();
    expect(screen.getByText(/2 parlamentares avaliados/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refazer o teste/ })).toBeInTheDocument();
  });

  it('concordando com tudo, a ordem é a oficial (overall desc)', () => {
    renderMatch();
    answerAllConcordo();
    const cards = screen.getAllByRole('listitem');
    expect(cards[0].textContent).toContain('Dep. Alinhada');
    expect(cards[1].textContent).toContain('Dep. Oposta');
  });

  it('discordando de proteção à vida inverte a preferência', () => {
    renderMatch();
    fireEvent.click(screen.getByRole('button', { name: /Não concordo/ }));
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Concordo/ }));
    }
    const cards = screen.getAllByRole('listitem');
    expect(cards[0].textContent).toContain('Dep. Oposta');
    expect(cards[1].textContent).toContain('Dep. Alinhada');
  });

  it('atualiza o <title> para SEO', () => {
    renderMatch();
    expect(document.title).toContain('Quem vota como você?');
  });

  it('permite responder o quiz usando atalhos numéricos do teclado (1, 2, 3)', () => {
    renderMatch();
    expect(screen.getByText('Pergunta 1 de 5')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '1' });
    expect(screen.getByText('Pergunta 2 de 5')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '2' });
    expect(screen.getByText('Pergunta 3 de 5')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '3' });
    expect(screen.getByText('Pergunta 4 de 5')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Backspace' });
    expect(screen.getByText('Pergunta 3 de 5')).toBeInTheDocument();
  });
});