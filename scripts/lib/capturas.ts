/**
 * Registro de captura das fontes (E1 de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 * Lógica pura de scripts/registrar-fontes.ts, sem I/O, para poder testar.
 *
 * O registro diz, para cada arquivo de origem baixado: o que é, de que ano,
 * quando foi capturado, quanto pesa e qual o SHA-256. Com o hash, qualquer
 * pessoa baixa o mesmo arquivo do TSE e confere se é o mesmo conteúdo.
 */

export interface Captura {
  arquivo: string;
  ano: number;
  tipo: string;
  /** Data (AAAA-MM-DD) de modificação do arquivo na máquina de quem baixou. */
  capturadoEm: string;
  bytes: number;
  sha256: string;
  /** Endereço de onde o arquivo foi baixado, quando se sabe. null = não registrado. */
  urlOficial: string | null;
  /** Texto livre curto, ex.: "levantamento, ainda não importado". */
  observacao: string | null;
}

export const CDN_TSE = 'https://cdn.tse.jus.br/estatistica/sead/odsele';

interface Tipo {
  re: RegExp;
  tipo: string;
  /** Pasta do arquivo no CDN do TSE; null quando não se sabe. */
  pasta: string | null;
}

// A ordem importa: "consulta_cand_complementar" antes de "consulta_cand".
const TIPOS: ReadonlyArray<Tipo> = [
  { re: /^consulta_cand_complementar_(\d{4})\.zip$/, tipo: 'Candidaturas (complementar)', pasta: null },
  { re: /^consulta_cand_(\d{4})\.zip$/, tipo: 'Candidaturas e resultado', pasta: 'consulta_cand' },
  { re: /^bem_candidato_(\d{4})\.zip$/, tipo: 'Bens declarados', pasta: 'bem_candidato' },
  { re: /^rede_social_candidato_(\d{4})\.zip$/, tipo: 'Redes sociais declaradas', pasta: 'consulta_cand' },
  { re: /^prestacao_de_contas_eleitorais_candidatos_(\d{4})\.zip$/, tipo: 'Prestação de contas (receitas e despesas)', pasta: 'prestacao_contas' },
  { re: /^motivo_cassacao_(\d{4})\.zip$/, tipo: 'Motivos de cassação', pasta: null },
];

/**
 * Descobre tipo, ano e (se a origem é conhecida) o endereço do arquivo.
 * `relPath` é o caminho relativo a `data/tse/`.
 *
 * O endereço só é preenchido para o que foi baixado do CDN em 2026-11-02
 * (pastas `2026/`, `2018/` e `2022-republicado/`, mais o zip de redes de 2022). Os
 * arquivos de agosto foram baixados antes deste registro, de um lugar que não
 * foi anotado: ficam com `urlOficial: null` em vez de um palpite.
 */
export function inferirArquivo(relPath: string): Pick<Captura, 'arquivo' | 'ano' | 'tipo' | 'urlOficial' | 'observacao'> | null {
  const partes = relPath.split('/');
  const arquivo = partes[partes.length - 1];
  const pasta = partes.length > 1 ? partes[0] : '';

  for (const t of TIPOS) {
    const m = t.re.exec(arquivo);
    if (!m) continue;
    const baixadoDoCdn =
      pasta === '2026' || pasta === '2018' || pasta === '2022-republicado' || arquivo === 'rede_social_candidato_2022.zip';
    return {
      arquivo,
      ano: Number(m[1]),
      tipo: t.tipo,
      urlOficial: baixadoDoCdn && t.pasta ? `${CDN_TSE}/${t.pasta}/${arquivo}` : null,
      observacao:
        pasta === '2026' || pasta === '2018' ? 'Levantamento da Fase E; ainda não importado.'
        : pasta === '2022-republicado' ? 'Versão republicada pelo TSE em nov/2026; ainda não importada.'
        : null,
    };
  }
  return null;
}

/** Une o que já estava registrado com o que foi achado agora. A chave é o SHA-256. */
export function mesclar(existentes: ReadonlyArray<Captura>, novas: ReadonlyArray<Captura>): Captura[] {
  const mapa = new Map<string, Captura>();
  for (const c of existentes) mapa.set(c.sha256, c);
  for (const c of novas) {
    const antes = mapa.get(c.sha256);
    // Mesmo conteúdo achado de novo: preserva a data e o endereço já registrados.
    mapa.set(c.sha256, antes ? { ...c, capturadoEm: antes.capturadoEm, urlOficial: antes.urlOficial ?? c.urlOficial } : c);
  }
  return [...mapa.values()].sort(
    (a, b) => b.ano - a.ano || a.tipo.localeCompare(b.tipo) || a.capturadoEm.localeCompare(b.capturadoEm) || a.arquivo.localeCompare(b.arquivo),
  );
}

export function renderizarCapturas(lista: ReadonlyArray<Captura>): string {
  const linhas = lista
    .map(
      (c) =>
        `  { arquivo: ${JSON.stringify(c.arquivo)}, ano: ${c.ano}, tipo: ${JSON.stringify(c.tipo)}, capturadoEm: ${JSON.stringify(c.capturadoEm)}, bytes: ${c.bytes}, sha256: ${JSON.stringify(c.sha256)}, urlOficial: ${JSON.stringify(c.urlOficial)}, observacao: ${JSON.stringify(c.observacao)} },`,
    )
    .join('\n');
  return `/**
 * Registro de captura das fontes (E1 de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * ARQUIVO GERADO por \`pnpm registrar:fontes --gravar\` (scripts/registrar-fontes.ts).
 * Não edite à mão: rode o script de novo e revise o diff.
 */
export interface Captura {
  arquivo: string;
  ano: number;
  tipo: string;
  /** Data (AAAA-MM-DD) de modificação do arquivo na máquina de quem baixou. */
  capturadoEm: string;
  bytes: number;
  sha256: string;
  urlOficial: string | null;
  observacao: string | null;
}

export const CAPTURAS: ReadonlyArray<Captura> = [${lista.length ? `\n${linhas}\n` : ''}];
`;
}

export const SHA256_RE = /^[0-9a-f]{64}$/;
