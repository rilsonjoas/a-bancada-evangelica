import type { LucideIcon } from 'lucide-react';
import { Leaf, HeartHandshake, Sprout, Car } from 'lucide-react';

// M2 — catálogo de temas legislativos para as páginas "como votaram sobre X".
// O slug de cada tema bate com o campo `KeyAgenda.theme` (preenchido pelo
// seed `scripts/seed-practical-impact.ts`). A descrição é o "1 parágrafo
// leigo" de contexto pedido no M2 — neutra, sem juízo de valor (ver
// GUIA-CURADORIA-DADOS.md) — e está marcada para revisão semestral.
export interface ThemeMeta {
  slug: string;
  label: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
}

export const THEMES: ThemeMeta[] = [
  {
    slug: 'meio-ambiente-energia',
    label: 'Meio ambiente e energia',
    tagline: 'Licenciamento ambiental, energia limpa e queimadas',
    description:
      'Nesta página estão as proposições sobre energia e meio ambiente mais votadas no Plenário nesta legislatura — licenciamento ambiental, transição energética, combustíveis sustentáveis e resposta a incêndios florestais — e como cada parlamentar da bancada votou nelas. Conteúdo revisto semestralmente.',
    icon: Leaf,
  },
  {
    slug: 'assistencia-social',
    label: 'Assistência social e segurança alimentar',
    tagline: 'Piso do SUAS, cozinha solidária e segurança alimentar',
    description:
      'Financiamento da assistência social e segurança alimentar: aqui ficam as proposições que tratam do piso do SUAS (CRAS, CREAS e benefícios socioassistenciais), do Programa de Aquisição de Alimentos e da Cozinha Solidária, com o voto de cada parlamentar da bancada. Conteúdo revisto semestralmente.',
    icon: HeartHandshake,
  },
  {
    slug: 'economia-agro',
    label: 'Economia e agro',
    tagline: 'Crédito rural e comércio internacional',
    description:
      'As proposições desta página tocam o setor produtivo e o bolso do cidadão: o crédito rural (dívidas de agricultores, pecuaristas e pescadores) e a resposta do Brasil a barreiras comerciais de outros países. Conteúdo revisto semestralmente.',
    icon: Sprout,
  },
  {
    slug: 'transito',
    label: 'Trânsito e motoristas',
    tagline: 'SPVAT e indenização de acidentes de trânsito',
    description:
      'Trânsito e o bolso do motorista: esta página reúne o voto da bancada sobre o SPVAT, o seguro obrigatório que indeniza vítimas de acidentes de trânsito (o sucessor do DPVAT). Conteúdo revisto semestralmente.',
    icon: Car,
  },
];

export function themeBySlug(slug: string): ThemeMeta | undefined {
  return THEMES.find((t) => t.slug === slug);
}

/**
 * Casa um termo de busca contra o catálogo de temas.
 *
 * POR QUE ISTO EXISTE (achado real 2026-09-25): o campo de busca da navbar
 * consultava SÓ `usePoliticians({ search })` — nomes de parlamentar. Digitar
 * "meio ambiente" ou "transito" não retornava nada, mesmo existindo as
 * páginas /temas/meio-ambiente-energia e /temas/transito. Combinado com o
 * fato de /temas não estar na navegação principal (só no rodapé), os temas
 * eram praticamente invisíveis para quem não chega pelo Google.
 *
 * O catálogo é estático, então o filtro roda no cliente — sem chamada de API.
 */
export function matchThemes(query: string): ThemeMeta[] {
  // Hífen vira espaço: o slug é "meio-ambiente-energia" e é o que o usuário
  // digita depois de copiar a URL — sem isso a busca devolvia zero.
  const norm = (s: string) =>
    s.toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[-_/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const q = norm(query);
  if (q.length < 2) return [];

  return THEMES.filter((t) => {
    const alvo = norm(`${t.label} ${t.tagline} ${t.description} ${t.slug}`);
    return alvo.includes(q);
  });
}

// Conta quantas pautas-chave (com voto registrado) existem por tema.
// Só temas que existem no catálogo entram — evita tema órfão no hub.
export function countAgendasByTheme(
  agendas: Array<{ theme?: string | null; totalVotes?: number }>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of agendas) {
    if (!a.theme) continue;
    counts[a.theme] = (counts[a.theme] ?? 0) + 1;
  }
  return counts;
}