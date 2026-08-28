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