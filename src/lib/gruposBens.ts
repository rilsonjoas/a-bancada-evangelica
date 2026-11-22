import type { BensDeclaradosDto } from '@/hooks/usePoliticianDetail';

/** Grupos de bens exibidos na ficha, com um exemplo do que cada um contém. */
export const GRUPOS_BENS: ReadonlyArray<{ key: keyof NonNullable<BensDeclaradosDto['byType']>; label: string; exemplo: string }> = [
  { key: 'imoveis', label: 'Imóveis', exemplo: 'casas, apartamentos, terrenos, salas' },
  { key: 'moveis', label: 'Veículos e outros bens móveis', exemplo: 'carros, motos, aeronaves, obras de arte' },
  { key: 'participacoes', label: 'Participações em empresas', exemplo: 'quotas, ações' },
  { key: 'aplicacoes', label: 'Aplicações e fundos de investimento', exemplo: 'renda fixa, fundos, previdência' },
  { key: 'creditos', label: 'Créditos a receber', exemplo: 'empréstimos concedidos' },
  { key: 'dinheiro', label: 'Dinheiro e depósitos', exemplo: 'conta corrente, dinheiro em espécie' },
  { key: 'outros', label: 'Outros bens e direitos', exemplo: '' },
];
