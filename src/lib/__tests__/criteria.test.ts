import { describe, it, expect } from 'vitest';
import { CRITERIA, CRITERIA_BY_KEY, CRITERIA_BY_FIELD } from '../criteria';

/**
 * A proveniência do dado por critério (2026-09-25).
 *
 * A auditoria mediu que **40% do peso da nota não tem um único voto
 * registrado**: Proteção à Vida (30%) tem 3 pautas e 0 votos; Liberdade
 * Religiosa (10%) tem 0 pautas. Mesmo assim a UI mostrava um número para
 * esses critérios sem dizer ao usuário que aquilo não vinha de voto
 * próprio, e sim da média histórica do partido.
 *
 * Estes testes ancoram a verdade do dado para a página não divergir do que
 * ela promete. Se alguém mudar peso aqui, a documentação em
 * docs/AUDITORIA-CALCULOS.md §3 e o texto de proveniência na UI precisam
 * acompanhar — e este teste falha até isso acontecer.
 */
describe('critérios da nota', () => {
  const pesoNumerico = (weight: string) => Number(weight.replace('%', ''));

  it('são cinco, todos com peso positivo', () => {
    expect(CRITERIA).toHaveLength(5);
    for (const c of CRITERIA) {
      expect(pesoNumerico(c.weight)).toBeGreaterThan(0);
    }
  });

  it('os pesos somam 100%', () => {
    const soma = CRITERIA.reduce((acc, c) => acc + pesoNumerico(c.weight), 0);
    expect(soma).toBe(100);
  });

  it('a ordem do array é a ordem de peso decrescente (é o eixo do gráfico)', () => {
    const pesos = CRITERIA.map((c) => pesoNumerico(c.weight));
    expect(pesos).toEqual([...pesos].sort((a, b) => b - a));
  });

  it('cada critério tem rótulo, campo e justificativa legível', () => {
    for (const c of CRITERIA) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.field.length).toBeGreaterThan(0);
      expect(c.rationale.length).toBeGreaterThan(20);
    }
  });

  it('os mapas por chave e por campo cobrem todos os critérios', () => {
    for (const c of CRITERIA) {
      expect(CRITERIA_BY_KEY[c.key]).toBe(c);
      expect(CRITERIA_BY_FIELD[c.field]).toBe(c);
    }
  });

  it('não há chave nem campo duplicados', () => {
    const keys = CRITERIA.map((c) => c.key);
    const fields = CRITERIA.map((c) => c.field);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(fields).size).toBe(fields.length);
  });

  // Ancora a afirmação "40% do peso é seed" do AUDITORIA-CALCULOS.md §3.
  // Se a soma mudar, aquele número e o texto da UI estão errados.
  it('Proteção à Vida + Liberdade Religiosa = 40% do peso (os dois sem voto medido)', () => {
    const seed = CRITERIA
      .filter((c) => c.key === 'LIFE_PROTECTION' || c.key === 'RELIGIOUS_FREEDOM')
      .reduce((acc, c) => acc + pesoNumerico(c.weight), 0);
    expect(seed).toBe(40);
  });

  // O `field` é a chave com que a API indexa votesPerCriteria. Se alguém
  // renomear um field sem atualizar a API, a proveniência some da tela SEM
  // erro de tipo, porque o payload é indexado por string — este teste é a
  // rede contra isso.
  it('todo field existe no votesPerCriteria que a API devolve', () => {
    const camposDaApi = [
      'lifeProtection',
      'familyValues',
      'moralIntegrity',
      'socialResponsibility',
      'religiousFreedom',
    ];
    expect(CRITERIA.map((c) => c.field).sort()).toEqual(camposDaApi.sort());
  });
});
