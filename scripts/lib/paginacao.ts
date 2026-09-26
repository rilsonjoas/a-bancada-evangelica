/**
 * Paginação da API de votações.
 *
 * POR QUE ESTE ARQUIVO EXISTE (2026-09-26, `docs/AUDITORIA-VOTACOES.md`):
 *
 * `scanPlenario` pedia `?itens=200` e achava que receberia até 200 por
 * trimestre. **A API ignora `itens` acima de 100** e devolve no máximo 100
 * por requisição. Como o sync nunca passou `pagina`, ele via **só a
 * primeira página de cada trimestre**:
 *
 *   votações substantivas vistas pelo sync ... 244
 *   votações substantivas existentes ........... 830
 *   cobertura ................................. 29%
 *
 * E piorava com o tempo, porque a API ordena por data e o período recente
 * fica no fim da lista — ou seja, o acervo mais novo era o mais podre.
 *
 * Três consequências que já custaram caro:
 *  1. 75% das votações de plenário nunca foram vistas;
 *  2. 29 das 75 pautas que temos (39%) não têm NENHUMA votação de mérito,
 *     só o requerimento de urgência — capturamos a processual e perdemos a
 *     de mérito (medido em 2026-09-26, `docs/DECISOES-PRODUTO-2026-09-26.md`);
 *  3. a base medida do site são 6 assuntos, quando o acervo tem muito mais.
 *
 * A função é isolada aqui, e não escrita inline dentro do sync, por dois
 * motivos: dá para **testar com um fetch falso** (a paginação é
 * exatamente o tipo de coisa que quebra em silêncio), e o relatório de
 * cobertura volta junto, para o `SyncLog` registrar **o que foi visto e o
 * que deixou de ser** — que é o que faltava para este bug sobreviver
 * três anos.
 */

export const PAGE_SIZE = 100;
/** Teto de páginas por trimestre. Rede de segurança: a API não é infinita. */
export const MAX_PAGES_PER_QUARTER = 60;

export interface PageResult<T> {
  itens: T[];
  /** Páginas efetivamente requisitadas. */
  paginas: number;
  /** A última página veio cheia, o que é sinal de truncamento. */
  suspeitaTruncamento: boolean;
}

/**
 * Busca TODAS as páginas de um intervalo.
 *
 * @param fetchPagina recebe `pagina` (1-based) e devolve a página.
 *   Se devolver página cheia e não veio a última, continua.
 */
export async function paginar<T>(
  fetchPagina: (pagina: number) => Promise<T[]>,
  limite = MAX_PAGES_PER_QUARTER,
): Promise<PageResult<T>> {
  const itens: T[] = [];
  let pagina = 1;
  let ultimaCheia = true;
  // `paginas` conta as requisições FEITAS, não o cursor — inclusive a que
  // voltou vazia, que também é informação do relatório de cobertura. Sem isto, ao bater no
  // teto ele reportaria uma página a mais do que realmente buscou — que é
  // justamente o número que alguém vai ler para saber se truncou.
  let paginas = 0;

  while (pagina <= limite) {
    const lote = (await fetchPagina(pagina)) ?? [];
    paginas++;
    if (lote.length === 0) {
      ultimaCheia = false;
      break;
    }
    itens.push(...lote);
    // Página cheia significa que pode haver a seguinte. Página pela metade
    // significa que acabou.
    ultimaCheia = lote.length >= PAGE_SIZE;
    if (!ultimaCheia) break;
    pagina++;
  }

  return {
    itens,
    paginas,
    // Chegou ao teto sem esvaziar: pode haver mais do que `limite` páginas.
    suspeitaTruncamento: ultimaCheia && paginas >= limite,
  };
}

export interface Cobertura {
  /** Votações substantivas que o sync examinou. */
  vistas: number;
  /** Votações substantivas que existem no período segundo a API. */
  existentes: number;
  /** Percentual coberto, 0–100. */
  percentual: number;
}

/**
 * Monta o relatório de cobertura. Vai para o `SyncLog` para que uma queda
 * futura apareça no histórico, e não como surpresa na nota.
 */
export function relatarCobertura(
  porPeriodo: Array<{ Existing: number; Vistas: number }>,
): Cobertura {
  const existentes = porPeriodo.reduce((a, p) => a + p.Existing, 0);
  const vistas = porPeriodo.reduce((a, p) => a + p.Vistas, 0);
  return {
    existentes,
    vistas,
    percentual: existentes > 0 ? Math.round((100 * vistas) / existentes) : 0,
  };
}
