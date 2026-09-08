import { describe, it, expect } from 'vitest';
import { fmt, formatRelativeTime } from '../format';

describe('fmt', () => {
  it('formata número no padrão pt-BR (vírgula decimal)', () => {
    expect(fmt(67.3)).toBe('67,3');
    expect(fmt(100, 0)).toBe('100');
  });
});

describe('formatRelativeTime', () => {
  it('retorna null quando não há data (nunca sincronizado)', () => {
    expect(formatRelativeTime(null)).toBeNull();
    expect(formatRelativeTime(undefined)).toBeNull();
  });

  it('retorna null pra data inválida', () => {
    expect(formatRelativeTime('não é uma data')).toBeNull();
  });

  it('"agora mesmo" pra menos de 1 minuto', () => {
    const now = new Date(Date.now() - 10_000); // 10s atrás
    expect(formatRelativeTime(now)).toBe('agora mesmo');
  });

  it('minutos quando menos de 1 hora', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000);
    expect(formatRelativeTime(fiveMinAgo)).toBe('há 5 min');
  });

  it('horas quando menos de 1 dia', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000);
    expect(formatRelativeTime(threeHoursAgo)).toBe('há 3h');
  });

  it('"há 1 dia" no singular', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000);
    expect(formatRelativeTime(oneDayAgo)).toBe('há 1 dia');
  });

  it('dias no plural pra mais de 1 dia', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60_000);
    expect(formatRelativeTime(fiveDaysAgo)).toBe('há 5 dias');
  });

  it('aceita string ISO além de Date', () => {
    const iso = new Date(Date.now() - 2 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe('há 2h');
  });
});
