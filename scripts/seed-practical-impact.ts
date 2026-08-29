import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// M5 — Impacto leigo por key vote: texto "Na prática, isso significa…" para
// o eleitor entender o efeito concreto da matéria, em linguagem leiga e
// neutra. Curado à mão (2026-08-28) para as proposições de maior volume de
// votos no Plenário desta legislatura. Cada proposição pode ter várias
// KeyAgendas (uma por votação) — o script casa pelo prefixo do título.
//
// Regra (alinhada ao GUIA-CURADORIA-DADOS.md): texto descreve o impacto
// concreto da matéria, sem juízo de valor nem tom acusatório. Não afeta o
// score — é contexto público apenas.
interface PracticalImpact {
  prefix: string; // prefixo do título (ex.: "PL 2159/2021")
  text: string;
}

const IMPACTS: PracticalImpact[] = [
  {
    prefix: 'PL 2159/2021',
    text: 'Na prática: o texto federal unifica as regras para licenciar obras e atividades que afetam o meio ambiente — estradas, mineradoras, barragens e usinas. Fica mais claro quando é preciso licença, quem aprova e como o processo anda. Importa porque define o equilíbrio entre crescimento econômico e proteção ambiental no país.',
  },
  {
    prefix: 'PL 327/2021',
    text: 'Na prática: o projeto institui a Política Nacional da Transição Energética e um programa para acelerar a troca de fontes poluentes por energia limpa no Brasil (solar, eólica, hidrogênio). Os votos nessa pauta definem os incentivos para a descarbonização e o rumo do investimento em energia renovável.',
  },
  {
    prefix: 'PL 528/2020',
    text: 'Na prática: o texto cria programas nacionais de combustível sustentável de aviação, diesel verde e captura de carbono, além de incentivos à mobilidade de baixo carbono. Afeta diretamente o custo do transporte, a indústria do petróleo e a meta brasileira de reduzir emissões de gases do efeito estufa.',
  },
  {
    prefix: 'PL 3899/2012',
    text: 'Na prática: o projeto institui a Política Nacional de Estímulo à Produção e ao Consumo Sustentáveis — incentivos para que empresas produzam e vendam bens com menor impacto ambiental. Define quais produtos e processos ganham estímulo fiscal e prioridade de compra pelo poder público.',
  },
  {
    prefix: 'PL 3469/2024',
    text: 'Na prática: o texto usa o Código Brasileiro de Aeronáutica para reforçar a capacidade do poder público de responder a incêndios florestais — mais aeronaves e meios para apagar o fogo em áreas de difícil acesso. Torna mais rápida a reação do Estado a queimadas em florestas e unidades de conservação.',
  },
  {
    prefix: 'PL 5122/2023',
    text: 'Na prática: o projeto permite liquidar, perdoar, renegociar e dar desconto em dívidas de crédito rural de agricultores, pecuaristas, piscicultores, pescadores e carcinicultores. Decisão com efeito direto no caixa do produtor e, por consequência, no preço final dos alimentos.',
  },
  {
    prefix: 'PL 2920/2023',
    text: 'Na prática: o projeto reformula o Programa de Aquisição de Alimentos e cria o Programa Cozinha Solidária — o poder público compra comida de pequenos agricultores para abastecer escolas, creches e quem precisa. Fortalece a segurança alimentar e a renda da agricultura familiar.',
  },
  {
    prefix: 'PL 2088/2023',
    text: 'Na prática: o projeto dá ao Brasil instrumentos para responder a medidas unilaterais de outros países que prejudiquem nossa competitividade — podendo suspender concessões comerciais, investimentos ou proteção de propriedade intelectual contra quem nos atingir comercialmente.',
  },
  {
    prefix: 'PLP 233/2023',
    text: 'Na prática: o projeto (com o voto do Plenário) recria o seguro obrigatório que indeniza vítimas de acidentes de trânsito — o antigo DPVAT, agora chamado SPVAT. Todo dono de veículo contribui, e a indenização cobre morte, invalidez e despesas médicas de quem se acidenta.',
  },
  {
    prefix: 'PEC 383/2017',
    text: 'Na prática: a PEC fixa na Constituição um piso mínimo de recursos federais para o Sistema Único de Assistência Social (SUAS) — os serviços como CRAS, CREAS e benefícios socioassistenciais. Protege o financiamento da assistência social contra cortes orçamentários.',
  },
];

async function main() {
  console.log(`\n🗂️  ${IMPACTS.length} proposições com impacto leigo cadastrado`);

  let updated = 0;
  let matched = 0;

  for (const impact of IMPACTS) {
    const agendas = await prisma.keyAgenda.findMany({
      where: { status: 'ACTIVE', title: { startsWith: impact.prefix } },
      select: { id: true, title: true, practical_impact: true },
    });

    if (agendas.length === 0) {
      console.log(`   ⚠️  NENHUMA agenda com prefixo "${impact.prefix}"`);
      continue;
    }
    matched++;

    for (const a of agendas) {
      if (a.practical_impact === impact.text) continue;
      await prisma.keyAgenda.update({
        where: { id: a.id },
        data: { practical_impact: impact.text },
      });
      updated++;
    }
    console.log(`   ✓ ${impact.prefix}: ${agendas.length} agenda(s) → texto aplicado`);
  }

  console.log(`\n✅ ${matched}/${IMPACTS.length} proposições encontradas · ${updated} agendas atualizadas\n`);

  // Sanidade: nenhuma agenda com texto sem prefixo casado deveria existir
  const withText = await prisma.keyAgenda.count({ where: { practical_impact: { not: null } } });
  console.log(`🔍 ${withText} agendas ativas no total com impacto leigo`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());