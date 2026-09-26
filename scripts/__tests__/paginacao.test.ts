import { describe, it, expect } from 'vitest';
import { paginar, relatarCobertura, PAGE_SIZE } from '../lib/paginacao';

/**
 * O bug que este teste existe para impedir (docs/AUDITORIA-VOTACOES.md):
 * a API ignora `itens` acima de 100, o sync não passava `pagina`, e ele via
 * só a primeira página de cada trimestre — 29% das votações substantivas.
 *
 * A paginação é o tipo de coisa que quebra em silêncio: sem erro, sem aviso,
 * a nota só fica mais fraca e ninguém sabe por quê.
 */
describe('paginar — a API devolve 100 por página e exige `pagina`', () => {
  /** Simula a API real: 100 por página, esvazia depois. */
  function apiFake(total: number) {
    return async (pagina: number) => {
      const inicio = (pagina - 1) * PAGE_SIZE;
      if (inicio >= total) return [];
      return Array.from({ length: Math.min(PAGE_SIZE, total - inicio) }, (_, i) => ({
        id: `v${inicio + i}`,
      }));
    };
  }

  it('busca além da primeira página', async () => {
    const r = await paginar(apiFake(232));
    expect({ n: r.itens.length, esperado: 232 }).toMatchObject({ n: 232 });
  });

  it('para na última página pela metade (não inventa página extra)', async () => {
    const r = await paginar(apiFake(150)); // 100 + 50
    expect({ itens: r.itens.length, paginas: r.paginas })
      .toMatchObject({ itens: 150, paginas: 2 });
  });

  it('caso de uma página só', async () => {
    const r = await paginar(apiFake(40));
    expect({ itens: r.itens.length, paginas: r.paginas })
      .toMatchObject({ itens: 40, paginas: 1 });
  });

  it('acervo vazio não entra em laço infinito', async () => {
    const r = await paginar(apiFake(0));
    expect({ itens: r.itens.length, paginas: r.paginas })
      .toMatchObject({ itens: 0, paginas: 1 });
  });

  it('nunca duplica nem pula item entre páginas', async () => {
    const total = 830;
    const r = await paginar(apiFake(total));
    const ids = new Set(r.itens.map((i) => i.id));
    // Se a paginação pulasse ou repetisse, o conjunto não teria 830.
    expect({ unicos: ids.size, total }).toMatchObject({ unicos: 830 });
  });

  it('avisa quando bate no teto de páginas — truncamento possível', async () => {
    // API que nunca esvazia: sem o teto, o sync ficaria em laço para sempre.
    const infinito = async () => Array.from({ length: PAGE_SIZE }, (_, i) => ({ id: `x${i}` }));
    const r = await paginar(infinito, 5);
    expect({ paginas: r.paginas, suspeita: r.suspeitaTruncamento })
      .toMatchObject({ paginas: 5, suspeita: true });
  });

  it('relata cobertura e o sistema antigo aparece como 29%', async () => {
    // Os números medidos do bug: 244 vistas de 830 existentes.
    const c = relatarCobertura([{ Existing: 830, Vistas: 244 }]);
    expect({ percentual: c.percentual, vistas: c.vistas, existentes: c.existentes })
      .toMatchObject({ percentual: 29, vistas: 244, existentes: 830 });
  });

  it('cobertura de 100% quando tudo é visto', async () => {
    expect({ p: relatarCobertura([{ Existing: 830, Vistas: 830 }]).percentual })
      .toMatchObject({ p: 100 });
  });

  it('período sem dado não quebra o relatório', async () => {
    const c = relatarCobertura([{ Existing: 0, Vistas: 0 }]);
    expect({ p: c.percentual }).toMatchObject({ p: 0 });
  });
});
