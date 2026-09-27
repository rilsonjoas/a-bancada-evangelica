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
        familyValues: 60,
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

// 3 perguntas desde 2026-09-27: só critérios com voto medido (Família,
// Moral, Social). Vida e Religião são semente do partido e saíram do quiz.
const answerAllConcordo = () => {
  for (let i = 0; i < 3; i++) {
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
    expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Concordo/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pular/ })).toBeInTheDocument();
  });

  it('após 3 respostas, mostra o ranking por afinidade com nomes e notas', () => {
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

  it('concordando com tudo, Vida (semente do partido) não decide a ordem', () => {
    // A nota geral põe a Alinhada na frente (77,5 × 62) só por Vida 95 × 20.
    // Nos critérios com voto medido a Oposta é mais alta: 80 × 65,8.
    renderMatch();
    answerAllConcordo();
    const cards = screen.getAllByRole('listitem');
    expect(cards[0].textContent).toContain('Dep. Oposta');
    expect(cards[1].textContent).toContain('Dep. Alinhada');
  });

  it('discordando de valores familiares inverte a preferência', () => {
    // Família invertida: Alinhada 57,5 × Oposta 55.
    renderMatch();
    fireEvent.click(screen.getByRole('button', { name: /Não concordo/ }));
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Concordo/ }));
    }
    const cards = screen.getAllByRole('listitem');
    expect(cards[0].textContent).toContain('Dep. Alinhada');
    expect(cards[1].textContent).toContain('Dep. Oposta');
  });

  it('atualiza o <title> para SEO', () => {
    renderMatch();
    expect(document.title).toContain('Quem vota como você?');
  });

  it('permite responder o quiz usando atalhos numéricos do teclado (1, 2, 3)', () => {
    renderMatch();
    expect(screen.getByText('Pergunta 1 de 3')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '1' });
    expect(screen.getByText('Pergunta 2 de 3')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '2' });
    expect(screen.getByText('Pergunta 3 de 3')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Backspace' });
    expect(screen.getByText('Pergunta 2 de 3')).toBeInTheDocument();
  });
});