import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMethodology() {
  console.log('🌱 Iniciando seed da metodologia...');

  // Seed dos pilares de avaliação
  const pillars = [
    {
      key: 'life_protection',
      name: '🛡️ Proteção à Vida',
      emoji: '🛡️',
      weight: 0.25,
      order: 1,
      description: 'Analisamos os votos e posicionamentos em projetos de lei sobre aborto, eutanásia, pesquisa com células-tronco embrionárias e outras pautas de bioética. Verificamos também a autoria de proposições que visam proteger a vida em todas as suas fases.',
      why_important: 'A Bíblia ensina que a vida é um dom sagrado de Deus e que fomos criados à Sua imagem e semelhança (Gênesis 1:27). Desde o ventre materno, somos conhecidos e formados por Ele (Salmo 139:13-16). Defender a vida, do mais vulnerável ao mais idoso, é um mandamento fundamental da fé.',
      how_it_helps: 'Você poderá identificar claramente quais políticos são uma barreira contra a cultura da morte e quais se posicionam ativamente para proteger os nascituros e os indefesos, tratando a vida como inegociável.',
      biblical_basis: 'Gênesis 1:27, Salmo 139:13-16',
      indicators: [
        'Votações sobre projetos pró-vida',
        'Projetos de lei protegendo a vida',
        'Posicionamentos públicos sobre aborto',
        'Defesa de políticas de adoção'
      ]
    },
    {
      key: 'family_values',
      name: '👨‍👩‍👧‍👦 Defesa da Família',
      emoji: '👨‍👩‍👧‍👦',
      weight: 0.20,
      order: 2,
      description: 'Monitoramos votos e discursos relacionados ao conceito de família, casamento, adoção, educação domiciliar (homeschooling) e o direito dos pais na formação moral e educacional dos filhos, combatendo a erotização infantil e a ideologia de gênero nas escolas.',
      why_important: 'A família é a primeira e mais fundamental instituição criada por Deus (Gênesis 2:24). É o alicerce da sociedade e o ambiente onde os filhos devem ser instruídos "no caminho em que devem andar" (Provérbios 22:6). Proteger a família é proteger o futuro da nação.',
      how_it_helps: 'A plataforma mostra quais parlamentares defendem ativamente o modelo familiar bíblico e a autoridade dos pais, e quais apoiam pautas que buscam redefinir ou enfraquecer essa instituição sagrada.',
      biblical_basis: 'Gênesis 2:24, Provérbios 22:6',
      indicators: [
        'Votações sobre definição de família',
        'Defesa da educação domiciliar',
        'Projetos de proteção à infância',
        'Oposição à ideologia de gênero'
      ]
    },
    {
      key: 'moral_integrity',
      name: '⚖️ Integridade Moral e Transparência',
      emoji: '⚖️',
      weight: 0.20,
      order: 3,
      description: 'Este é um critério de caráter. Analisamos o histórico do político, incluindo processos judiciais e investigações por corrupção, improbidade administrativa ou outros crimes. A existência de condenações (trânsito em julgado) gera uma penalidade severa na pontuação. Também monitoramos o uso da cota parlamentar para identificar gastos excessivos ou suspeitos.',
      why_important: 'A Palavra de Deus exalta a honestidade e a integridade: "O justo anda na sua integridade; bem-aventurados serão os seus filhos depois dele" (Provérbios 20:7). Um líder cristão deve ser "irrepreensível" (1 Timóteo 3:2) e um bom administrador dos recursos que lhe foram confiados, pois toda autoridade vem de Deus.',
      how_it_helps: 'Esta análise ajuda a ir além do "rouba, mas faz". Você poderá avaliar o caráter do político e sua conduta ética, escolhendo representantes que honrem a confiança pública e administrem com retidão, e não para benefício próprio.',
      biblical_basis: 'Provérbios 20:7, 1 Timóteo 3:2',
      indicators: [
        'Histórico de investigações',
        'Transparência de gastos públicos',
        'Conduta moral pessoal',
        'Cumprimento de promessas eleitorais'
      ]
    },
    {
      key: 'mandate_zeal',
      name: '🏛️ Zelo e Responsabilidade no Mandato',
      emoji: '🏛️',
      weight: 0.10,
      order: 4,
      description: 'Medimos a dedicação do parlamentar ao seu trabalho. Isso inclui a frequência e assiduidade nas sessões de votação, a participação ativa em comissões importantes e a transparência na gestão de seu gabinete e de sua agenda pública.',
      why_important: 'A Bíblia nos instrui a fazer tudo com excelência, "de todo o coração, como para o Senhor, e não para os homens" (Colossenses 3:23). Um mandato é um serviço, uma mordomia. Espera-se que um representante eleito demonstre zelo, diligência e responsabilidade no cumprimento de suas funções.',
      how_it_helps: 'Com estes dados, você pode diferenciar o político que realmente trabalha e honra o seu voto daquele que é ausente e pouco produtivo. É uma medida clara do comprometimento do parlamentar com a função para a qual foi eleito.',
      biblical_basis: 'Colossenses 3:23',
      indicators: [
        'Frequência nas sessões',
        'Participação em comissões',
        'Transparência do gabinete',
        'Gestão da agenda pública'
      ]
    },
    {
      key: 'legislative_production',
      name: '📜 Produção Legislativa Relevante',
      emoji: '📜',
      weight: 0.10,
      order: 5,
      description: 'Não basta votar certo; é preciso ser proativo. Neste pilar, avaliamos a autoria e a relatoria de projetos de lei que são relevantes para os valores defendidos pela plataforma. Analisamos a qualidade e o impacto das propostas, bem como os discursos e a defesa pública dessas pautas em plenário e na mídia.',
      why_important: 'A sabedoria é um atributo essencial para quem governa (Provérbios 8:15-16). Um legislador cristão deve usar seu intelecto e sua influência para propor leis justas, que promovam o bem e restrinjam o mal, refletindo a sabedoria que vem do alto.',
      how_it_helps: 'Você poderá identificar os parlamentares que são verdadeiros líderes e protagonistas na defesa das pautas cristãs, e não apenas seguidores. Este critério revela quem tem iniciativa e capacidade de influenciar positivamente a legislação do país.',
      biblical_basis: 'Provérbios 8:15-16',
      indicators: [
        'Autoria de projetos relevantes',
        'Relatoria em comissões',
        'Discursos em plenário',
        'Defesa pública de pautas'
      ]
    },
    {
      key: 'social_responsibility',
      name: '🤝 Responsabilidade Social',
      emoji: '🤝',
      weight: 0.10,
      order: 6,
      description: 'Analisamos o posicionamento em pautas voltadas para a justiça social, o cuidado com os vulneráveis (pobres, órfãos, viúvas, idosos), a dignidade do trabalhador e políticas de combate à pobreza, sempre sob uma ótica de responsabilidade fiscal e sustentabilidade.',
      why_important: 'A fé sem obras é morta (Tiago 2:26). A Bíblia está repleta de mandamentos sobre cuidar do necessitado e praticar a justiça (Isaías 1:17, Miquéias 6:8). Uma fé genuína se manifesta em compaixão e ação concreta em favor dos mais fracos da sociedade.',
      how_it_helps: 'Permite avaliar se a fé declarada pelo político se traduz em políticas públicas de compaixão e cuidado com o próximo, mostrando se ele possui uma visão integral do Evangelho que inclui a justiça social.',
      biblical_basis: 'Tiago 2:26, Isaías 1:17, Miquéias 6:8',
      indicators: [
        'Apoio a programas sociais',
        'Defesa dos direitos humanos',
        'Políticas para populações vulneráveis',
        'Combate à pobreza e desigualdade'
      ]
    },
    {
      key: 'religious_freedom',
      name: '✝️ Liberdade Religiosa',
      emoji: '✝️',
      weight: 0.05,
      order: 7,
      description: 'Monitoramos a defesa do direito fundamental à liberdade de crença, de culto e de expressão religiosa. Isso inclui votos em leis que possam cercear a pregação do Evangelho, a atuação de igrejas e missionários, o ensino religioso confessional e a objeção de consciência.',
      why_important: 'Jesus nos ordenou a "ir por todo o mundo e pregar o evangelho" (Marcos 16:15). A liberdade religiosa é a garantia fundamental que permite à Igreja cumprir sua missão sem a interferência indevida do Estado. É o direito de "dar a Deus o que é de Deus" (Mateus 22:21).',
      how_it_helps: 'Você saberá quais políticos estão vigilantes e atuam para proteger o direito constitucional da igreja de existir, de se expressar e de influenciar a sociedade, garantindo que as futuras gerações possam viver e proclamar sua fé livremente.',
      biblical_basis: 'Marcos 16:15, Mateus 22:21',
      indicators: [
        'Defesa da liberdade de culto',
        'Proteção de símbolos religiosos',
        'Direito de expressão da fé',
        'Combate à perseguição religiosa'
      ]
    }
  ];

  // Inserir ou atualizar pilares
  for (const pillar of pillars) {
    await prisma.methodologyPillar.upsert({
      where: { key: pillar.key },
      update: pillar,
      create: pillar,
    });
    console.log(`✅ Pilar criado/atualizado: ${pillar.name}`);
  }

  // Seed do conteúdo da metodologia
  const methodologyContent = [
    {
      section_key: 'mission',
      title: 'Nossa Missão',
      order: 1,
      content: `Nossa missão é equipar o eleitor cristão com dados objetivos e análises criteriosas para que ele possa, em oração e com sabedoria, tomar a melhor decisão de acordo com sua consciência e seus princípios de fé.

Nossa metodologia foi construída sobre a crença de que a atuação de um parlamentar vai muito além do discurso. Ela se reflete em votos, na gestão do mandato, na integridade pessoal e na defesa ativa dos valores que professa. Por isso, avaliamos os políticos através de 7 pilares fundamentais, cada um com um peso específico, que juntos formam um panorama completo de sua performance.`
    },
    {
      section_key: 'philosophy',
      title: 'Nossa Filosofia',
      order: 2,
      content: `A plataforma A Bancada Evangélica **não é uma lista de "políticos aprovados"**, mas sim uma **ferramenta de discernimento**.

Nosso objetivo é fornecer informações transparentes e criteriosas que permitam ao eleitor cristão tomar decisões conscientes, baseadas em dados concretos e não apenas em promessas de campanha.`
    }
  ];

  // Inserir ou atualizar conteúdo
  for (const content of methodologyContent) {
    await prisma.methodologyContent.upsert({
      where: { section_key: content.section_key },
      update: content,
      create: content,
    });
    console.log(`✅ Conteúdo criado/atualizado: ${content.title}`);
  }

  console.log('✅ Seed da metodologia concluído!');
}

async function main() {
  try {
    await seedMethodology();
  } catch (error) {
    console.error('❌ Erro durante o seed da metodologia:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if this file is run directly
main().catch((error) => {
  console.error(error);
  process.exit(1);
});

export default seedMethodology;