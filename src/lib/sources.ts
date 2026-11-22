export type VoteSource = 'CAMARA' | 'SENADO' | 'TSE' | 'MANUAL';

export interface VoteProvenance {
  source?: string | null;
  sourceVoteId?: string | null;
  sourcePropositionId?: string | null;
}

interface SourceLink {
  url: string | null;
  label: string;
}

export const buildVoteSourceLink = (vote: VoteProvenance): SourceLink => {
  const source = vote.source as VoteSource | undefined;

  if (source === 'CAMARA' && vote.sourcePropositionId) {
    return {
      url: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${vote.sourcePropositionId}`,
      label: 'Ver na Câmara dos Deputados',
    };
  }

  if (source === 'SENADO' && vote.sourcePropositionId) {
    return {
      url: `https://www25.senado.leg.br/web/atividade/materias/-/materia/${vote.sourcePropositionId}`,
      label: 'Ver no Senado Federal',
    };
  }

  return { url: null, label: '' };
};

export interface PoliticianProfileRef {
  house: 'CAMARA' | 'SENADO';
  /** `Politician.legislature_id`: id do deputado na Câmara ou código do senador. */
  legislatureId?: string | null;
}

/**
 * Página oficial do parlamentar na própria casa legislativa, para o leitor
 * conferir os dados de origem por conta própria (docs/PLANO-CONFIANCA-E-DADOS-2027.md,
 * Fase A). Padrões de URL conferidos em 2026-11-01 (HTTP 200).
 *
 * O identificador só entra na URL se for composto apenas de dígitos.
 */
export const buildPoliticianProfileLink = (ref: PoliticianProfileRef): SourceLink => {
  const id = ref.legislatureId?.trim();
  if (!id || !/^\d+$/.test(id)) return { url: null, label: '' };

  if (ref.house === 'CAMARA') {
    return {
      url: `https://www.camara.leg.br/deputados/${id}`,
      label: 'Ver perfil na Câmara dos Deputados',
    };
  }

  if (ref.house === 'SENADO') {
    return {
      url: `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${id}`,
      label: 'Ver perfil no Senado Federal',
    };
  }

  return { url: null, label: '' };
};

/**
 * Página oficial de gastos do parlamentar (A6 de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * Verificado em 2026-11-02 contra os 85 senadores ativos e uma amostra de 26
 * deputados: todos respondem 200 e a página traz o nome do parlamentar certo
 * (e um id inexistente na Câmara não traz nome nenhum). A URL
 * `/deputados/{id}/cota-parlamentar` da Câmara dá 404 e NÃO é usada.
 * Sem o parâmetro de ano, as duas páginas abrem no período mais recente.
 *
 * O identificador só entra na URL se for composto apenas de dígitos.
 */
export const buildExpenseLink = (ref: PoliticianProfileRef): SourceLink => {
  const id = ref.legislatureId?.trim();
  if (!id || !/^\d+$/.test(id)) return { url: null, label: '' };

  if (ref.house === 'CAMARA') {
    return {
      url: `https://www.camara.leg.br/transparencia/gastos-parlamentares?deputado=${id}`,
      label: 'Ver gastos na Câmara dos Deputados',
    };
  }

  if (ref.house === 'SENADO') {
    return {
      url: `https://www6g.senado.leg.br/transparencia/sen/${id}/`,
      label: 'Ver gastos no Senado Federal',
    };
  }

  return { url: null, label: '' };
};

const REGIAO_POR_UF: Record<string, string> = {
  AC: 'NORTE', AM: 'NORTE', AP: 'NORTE', PA: 'NORTE', RO: 'NORTE', RR: 'NORTE', TO: 'NORTE',
  AL: 'NORDESTE', BA: 'NORDESTE', CE: 'NORDESTE', MA: 'NORDESTE', PB: 'NORDESTE', PE: 'NORDESTE', PI: 'NORDESTE', RN: 'NORDESTE', SE: 'NORDESTE',
  DF: 'CENTROOESTE', GO: 'CENTROOESTE', MT: 'CENTROOESTE', MS: 'CENTROOESTE',
  ES: 'SUDESTE', MG: 'SUDESTE', RJ: 'SUDESTE', SP: 'SUDESTE',
  PR: 'SUL', RS: 'SUL', SC: 'SUL',
  BR: 'BR',
};

const ELEICAO_POR_ANO: Record<number, string> = {
  2018: '2022802018',
  2022: '2040602022',
  2026: '20322002026',
};

export interface DivulgaCandRef {
  state?: string | null;
  sqCandidato?: string | null;
  electionYear?: number | null;
}

/**
 * Link direto para o espelho do candidato no DivulgaCandContas do TSE
 * (A5 de docs/PLANO-CONFIANCA-E-DADOS-2027.md). Padrão verificado em 2026-11-21.
 * Estrutura: /divulga/#/candidato/{REGIAO}/{UF}/{ID_ELEICAO}/{SQ_CANDIDATO}/{ANO}/{UF}
 */
export const buildDivulgaCandLink = (ref: DivulgaCandRef): SourceLink => {
  const uf = ref.state?.trim().toUpperCase();
  const sq = ref.sqCandidato?.trim();
  const ano = ref.electionYear ?? 2022;

  if (!uf || !sq || !/^\d+$/.test(sq)) return { url: null, label: '' };

  const regiao = REGIAO_POR_UF[uf];
  const idEleicao = ELEICAO_POR_ANO[ano];
  if (!regiao || !idEleicao) return { url: null, label: '' };

  return {
    url: `https://divulgacandcontas.tse.jus.br/divulga/#/candidato/${regiao}/${uf}/${idEleicao}/${sq}/${ano}/${uf}`,
    label: 'Ver no DivulgaCandContas (TSE)',
  };
};

export interface FonteDeDado {
  id: string;
  nome: string;
  /** Página oficial de dados abertos da fonte (conferida em 2026-11-01, HTTP 200). */
  url: string;
  /** O que o site obtém dessa fonte. Só o que os scripts de sync realmente consomem. */
  fornece: string;
}

/**
 * Catálogo das fontes de onde vem cada dado, exibido em /dados
 * (Fase A de docs/PLANO-CONFIANCA-E-DADOS-2027.md).
 *
 * Regra: só entra aqui o que um script de `scripts/sync-*` consome de fato.
 * Ao criar ou aposentar um sync, atualizar esta lista junto.
 */
export const FONTES_DE_DADOS: readonly FonteDeDado[] = [
  {
    id: 'camara-dados-abertos',
    nome: 'Câmara dos Deputados — Dados Abertos',
    url: 'https://dadosabertos.camara.leg.br/',
    fornece:
      'Cadastro dos deputados, votações nominais, despesas da cota parlamentar e a lista oficial da Frente Parlamentar Evangélica.',
  },
  {
    id: 'senado-dados-abertos',
    nome: 'Senado Federal — Dados Abertos',
    url: 'https://www12.senado.leg.br/dados-abertos',
    fornece: 'Cadastro dos senadores e votações nominais.',
  },
  {
    id: 'senado-ceaps',
    nome: 'Senado Federal — despesas da cota parlamentar (CEAPS)',
    url: 'https://adm.senado.gov.br/adm-dadosabertos/swagger-ui/index.html',
    fornece: 'Despesas declaradas pelos senadores.',
  },
  {
    id: 'tse-candidatos-2022',
    nome: 'TSE — Candidatos 2022',
    url: 'https://dadosabertos.tse.jus.br/dataset/candidatos-2022',
    fornece: 'Cadastro das candidaturas, usado para ligar cada parlamentar ao seu registro eleitoral.',
  },
  {
    id: 'tse-prestacao-contas-2022',
    nome: 'TSE — Prestação de Contas Eleitorais 2022',
    url: 'https://dadosabertos.tse.jus.br/dataset/dadosabertos-tse-jus-br-dataset-prestacao-de-contas-eleitorais-2022',
    fornece: 'Receitas de campanha de 2022, base do bloco de financiamento. Dado declarado pelas próprias campanhas.',
  },
  {
    id: 'google-noticias',
    nome: 'Google Notícias',
    url: 'https://news.google.com/',
    fornece:
      'Títulos e links de reportagens sobre os parlamentares, listados após curadoria. O site não reproduz o texto das matérias.',
  },
];
