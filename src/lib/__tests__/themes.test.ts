import { describe, it, expect } from 'vitest';
import { THEMES, themeBySlug, countAgendasByTheme } from '../themes';

describe('catálogo de temas (M2)', () => {
  it('tem slugs únicos', () => {
    const slugs = THEMES.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('cada tema tem label, tagline e descrição leiga', () => {
    for (const t of THEMES) {
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.tagline.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(50);
    }
  });

  it('themeBySlug devolve o tema certo e undefined para slug desconhecido', () => {
    expect(themeBySlug('meio-ambiente-energia')?.label).toContain('Meio ambiente');
    expect(themeBySlug('nao-existe')).toBeUndefined();
  });

  it('countAgendasByTheme conta só agendas com tema', () => {
    const agendas = [
      { theme: 'meio-ambiente-energia', totalVotes: 10 },
      { theme: 'meio-ambiente-energia', totalVotes: 5 },
      { theme: 'transito', totalVotes: 3 },
      { theme: null, totalVotes: 9 },
      { theme: undefined, totalVotes: 9 },
    ];
    const counts = countAgendasByTheme(agendas);
    expect(counts['meio-ambiente-energia']).toBe(2);
    expect(counts['transito']).toBe(1);
    expect(counts['nao-existe']).toBeUndefined();
  });
});