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
