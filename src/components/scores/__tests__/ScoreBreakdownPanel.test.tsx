import { describe, it, expect } from 'vitest';
import { ScoreBreakdownPanel } from '../ScoreBreakdownPanel';
import { render, screen } from '@testing-library/react';

const ITEM = {
  criteria: 'FAMILY_VALUES',
  seedPoints: 55,
  votePoints: 12.5,
  penaltyPoints: 0,
  weight: 0.25,
  finalScore: 67.5,
  subjectCount: 7,
  formulaVersion: '1.0.0',
};

describe('ScoreBreakdownPanel (M4)', () => {
  it('mostra a origem de cada ponto: partido, voto próprio, peso e nota', () => {
    render(<ScoreBreakdownPanel items={[ITEM]} formulaVersion="1.0.0" />);

    expect(screen.getByText('Como esta nota foi montada')).toBeInTheDocument();
    expect(screen.getByText('Valores Familiares')).toBeInTheDocument();
    expect(screen.getByText('55,0')).toBeInTheDocument(); // seed do partido
    expect(screen.getByText('+12,5')).toBeInTheDocument(); // voto próprio
    expect(screen.getByText('25%')).toBeInTheDocument(); // peso
    expect(screen.getByText('68')).toBeInTheDocument(); // nota final (arredondada)
  });

  it('diz que 0 pontos de voto é falta de voto, não voto neutro', () => {
    const { container } = render(
      <ScoreBreakdownPanel items={[{ ...ITEM, votePoints: 0, subjectCount: 0 }]} />
    );
    // A tabela mostra 0; a legenda é que tem de desfazer a leitura errada.
    // Este texto NÃO pode ser escondido quando o voto é 0 — é exatamente
    // nesse caso que o usuário precisa saber que 0 não é "neutro".
    // (Regressão: a legenda estava dentro de `hasAnyVote &&`.)
    const texto = container.textContent ?? '';
    expect(texto).toContain('não porque o voto dele foi "neutro"');
    expect(texto).toContain('ainda não tem voto registrado em nenhum destes critérios');
  });

  it('explica o voto próprio mesmo quando existe voto (com nº de assuntos)', () => {
    const { container } = render(<ScoreBreakdownPanel items={[ITEM]} />);
    expect(container.textContent ?? '').toContain('com base em 7 assuntos distintos');
  });

  it('esconde a coluna de gasto quando ninguém teve penalidade', () => {
    render(<ScoreBreakdownPanel items={[ITEM]} />);
    expect(screen.queryByText('Gasto')).not.toBeInTheDocument();
  });

  it('mostra a coluna de gasto quando existe penalidade', () => {
    render(<ScoreBreakdownPanel items={[ITEM, { ...ITEM, criteria: 'MORAL_INTEGRITY', penaltyPoints: 11.8 }]} />);
    expect(screen.getAllByText('Gasto').length).toBeGreaterThan(0);
    expect(screen.getByText('−11,8')).toBeInTheDocument();
  });

  it('explica o estado vazio em vez de mostrar tabela vazia', () => {
    render(<ScoreBreakdownPanel items={[]} />);
    expect(screen.getByText(/ainda não foi registrada/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('usa caption e th de escopo para leitor de tela', () => {
    render(<ScoreBreakdownPanel items={[ITEM]} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(3);
  });
});
