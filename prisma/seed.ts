// Seed do banco de dados com dados iniciais
import { PrismaClient } from '@prisma/client';
import { 
  HouseType, 
  CriteriaType, 
  SourceType, 
  AgendaStatus,
  PerformanceLevel,
  VoteType,
  MandateStatus 
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Limpando dados existentes...');
    
    await prisma.vote.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.historicalScore.deleteMany();
    await prisma.politicianScore.deleteMany();
    await prisma.mandate.deleteMany();
    await prisma.politician.deleteMany();
    await prisma.keyAgenda.deleteMany();
    await prisma.syncLog.deleteMany();
    await prisma.systemConfig.deleteMany();
  }

  // ========================================
  // CONFIGURAÇÕES DO SISTEMA
  // ========================================

  console.log('⚙️ Criando configurações do sistema...');

  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'criteria_weights',
        value: {
          lifeProtection: 0.30,
          familyValues: 0.25,
          moralIntegrity: 0.20,
          socialResponsibility: 0.15,
          religiousFreedom: 0.10,
        },
        description: 'Pesos dos critérios para cálculo da pontuação geral',
      },
      {
        key: 'sync_config',
        value: {
          enabled: true,
          votacoes_interval: '0 */6 * * *',
          despesas_interval: '0 2 * * *',
          politicos_interval: '0 4 * * 0',
        },
        description: 'Configurações de sincronização automática',
      },
      {
        key: 'expense_analysis',
        value: {
          monthly_limit: 35000,
          suspicious_threshold: 0.20,
          high_risk_threshold: 0.30,
        },
        description: 'Configurações para análise de despesas suspeitas',
      },
    ],
  });

  // ========================================
  // PAUTAS-CHAVE INICIAIS
  // ========================================

  console.log('📋 Criando pautas-chave iniciais...');

  const keyAgendas = await prisma.keyAgenda.createMany({
    data: [
      // PROTEÇÃO À VIDA
      {
        title: 'PL 1904/2024 - Aborto após 22 semanas',
        description: 'Projeto que equipara aborto após 22 semanas de gestação ao crime de homicídio simples',
        criteria: CriteriaType.LIFE_PROTECTION,
        positive_weight: 15,
        negative_weight: -15,
        source: SourceType.CAMARA,
        source_id: '2024-PL-1904',
        keywords: ['aborto', 'homicídio', 'gestação', '22 semanas'],
        priority: 5,
        status: AgendaStatus.ACTIVE,
      },
      {
        title: 'PEC da Vida - Proteção desde a concepção',
        description: 'Proposta de Emenda Constitucional que estabelece a proteção à vida desde a concepção',
        criteria: CriteriaType.LIFE_PROTECTION,
        positive_weight: 12,
        negative_weight: -12,
        source: SourceType.SENADO,
        source_id: 'PEC-VIDA-2024',
        keywords: ['vida', 'concepção', 'emenda constitucional'],
        priority: 5,
        status: AgendaStatus.ACTIVE,
      },

      // VALORES FAMILIARES
      {
        title: 'Estatuto da Família',
        description: 'Define família como união entre homem e mulher através de casamento ou união estável',
        criteria: CriteriaType.FAMILY_VALUES,
        positive_weight: 10,
        negative_weight: -10,
        source: SourceType.CAMARA,
        source_id: 'ESTATUTO-FAMILIA',
        keywords: ['família', 'casamento', 'união estável'],
        priority: 4,
        status: AgendaStatus.ACTIVE,
      },
      {
        title: 'Escola sem Partido',
        description: 'Projeto que estabelece diretrizes para educação nacional sem doutrinação ideológica',
        criteria: CriteriaType.FAMILY_VALUES,
        positive_weight: 8,
        negative_weight: -8,
        source: SourceType.CAMARA,
        source_id: 'ESCOLA-SEM-PARTIDO',
        keywords: ['educação', 'escola', 'doutrinação', 'ideologia'],
        priority: 4,
        status: AgendaStatus.ACTIVE,
      },

      // INTEGRIDADE MORAL
      {
        title: 'Lei Anticorrupção - Agravamento de penas',
        description: 'Projeto que agrava penas para crimes de corrupção e improbidade administrativa',
        criteria: CriteriaType.MORAL_INTEGRITY,
        positive_weight: 8,
        negative_weight: -8,
        source: SourceType.SENADO,
        source_id: 'ANTICORRUPCAO-2024',
        keywords: ['corrupção', 'improbidade', 'transparência'],
        priority: 3,
        status: AgendaStatus.ACTIVE,
      },

      // RESPONSABILIDADE SOCIAL
      {
        title: 'Marco Legal da Primeira Infância',
        description: 'Estabelece políticas públicas para desenvolvimento integral da primeira infância',
        criteria: CriteriaType.SOCIAL_RESPONSIBILITY,
        positive_weight: 6,
        negative_weight: -3,
        source: SourceType.CAMARA,
        source_id: 'PRIMEIRA-INFANCIA',
        keywords: ['criança', 'primeira infância', 'políticas sociais'],
        priority: 3,
        status: AgendaStatus.ACTIVE,
      },

      // LIBERDADE RELIGIOSA
      {
        title: 'Lei da Liberdade Religiosa',
        description: 'Garante o livre exercício de cultos e manifestações religiosas',
        criteria: CriteriaType.RELIGIOUS_FREEDOM,
        positive_weight: 8,
        negative_weight: -8,
        source: SourceType.SENADO,
        source_id: 'LIBERDADE-RELIGIOSA',
        keywords: ['religião', 'culto', 'liberdade religiosa'],
        priority: 3,
        status: AgendaStatus.ACTIVE,
      },
    ],
  });

  // ========================================
  // POLÍTICOS DE EXEMPLO
  // ========================================

  console.log('👥 Criando políticos de exemplo...');

  // Deputados Federais
  const deputados = await prisma.politician.createMany({
    data: [
      {
        name: 'Marco Feliciano',
        full_name: 'Marco Antônio Feliciano',
        current_party: 'PL',
        current_state: 'SP',
        current_house: HouseType.CAMARA,
        legislature_id: 'DEP001',
        photo_url: null, // Será preenchido pela sincronização com a API da Câmara
        email: 'marco.feliciano@camara.leg.br',
        is_active: true,
      },
      {
        name: 'Sóstenes Cavalcante',
        full_name: 'Sóstenes Cavalcante',
        current_party: 'PL',
        current_state: 'RJ',
        current_house: HouseType.CAMARA,
        legislature_id: 'DEP002',
        photo_url: null, // Será preenchido pela sincronização com a API da Câmara
        email: 'sostenes.cavalcante@camara.leg.br',
        is_active: true,
      },
      {
        name: 'Bia Kicis',
        full_name: 'Beatriz Kicis',
        current_party: 'PL',
        current_state: 'DF',
        current_house: HouseType.CAMARA,
        legislature_id: 'DEP003',
        photo_url: null, // Será preenchido pela sincronização com a API da Câmara
        email: 'bia.kicis@camara.leg.br',
        is_active: true,
      },
    ],
  });

  // Senadores
  const senadores = await prisma.politician.createMany({
    data: [
      {
        name: 'Magno Malta',
        full_name: 'Magno Pereira Malta',
        current_party: 'PL',
        current_state: 'ES',
        current_house: HouseType.SENADO,
        legislature_id: 'SEN001',
        photo_url: null, // Será preenchido pela sincronização com a API do Senado
        email: 'magno.malta@senado.leg.br',
        is_active: true,
      },
      {
        name: 'Eduardo Girão',
        full_name: 'Eduardo Girão',
        current_party: 'NOVO',
        current_state: 'CE',
        current_house: HouseType.SENADO,
        legislature_id: 'SEN002',
        photo_url: null, // Será preenchido pela sincronização com a API do Senado
        email: 'eduardo.girao@senado.leg.br',
        is_active: true,
      },
    ],
  });

  // ========================================
  // MANDATOS
  // ========================================

  console.log('🏛️ Criando mandatos...');

  const politicos = await prisma.politician.findMany();

  for (const politico of politicos) {
    await prisma.mandate.create({
      data: {
        politician_id: politico.id,
        house: politico.current_house,
        party: politico.current_party,
        state: politico.current_state,
        legislature: '57ª Legislatura',
        start_date: new Date('2023-02-01'),
        end_date: new Date('2027-01-31'),
        is_current: true,
        status: MandateStatus.ACTIVE,
      },
    });
  }

  // ========================================
  // PONTUAÇÕES INICIAIS
  // ========================================

  console.log('📊 Criando pontuações iniciais...');

  for (const politico of politicos) {
    // Gerar pontuações realistas baseadas no perfil evangélico
    const isConservative = Math.random() > 0.3; // 70% são mais conservadores
    
    const baseScore = isConservative ? 70 + Math.random() * 25 : 40 + Math.random() * 30;
    
    const lifeProtection = Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 20));
    const familyValues = Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 15));
    const moralIntegrity = Math.max(0, Math.min(100, 75 + (Math.random() - 0.5) * 30));
    const socialResponsibility = Math.max(0, Math.min(100, baseScore * 0.8 + (Math.random() - 0.5) * 20));
    const religiousFreedom = Math.max(0, Math.min(100, baseScore + (Math.random() - 0.5) * 10));

    const overallScore = Math.round(
      lifeProtection * 0.30 +
      familyValues * 0.25 +
      moralIntegrity * 0.20 +
      socialResponsibility * 0.15 +
      religiousFreedom * 0.10
    );

    let performanceLevel: PerformanceLevel;
    let performanceLabel: string;
    let performanceDescription: string;

    if (overallScore >= 80) {
      performanceLevel = PerformanceLevel.EXCELLENT;
      performanceLabel = 'Aderência muito alta';
      performanceDescription = 'Votações consistentemente alinhadas com os critérios cristãos declarados';
    } else if (overallScore >= 60) {
      performanceLevel = PerformanceLevel.GOOD;
      performanceLabel = 'Aderência alta';
      performanceDescription = 'Bom alinhamento com os critérios evangélicos declarados';
    } else if (overallScore >= 40) {
      performanceLevel = PerformanceLevel.AVERAGE;
      performanceLabel = 'Aderência moderada';
      performanceDescription = 'Alinhamento parcial — há votações mistas';
    } else {
      performanceLevel = PerformanceLevel.POOR;
      performanceLabel = 'Aderência baixa';
      performanceDescription = 'Votações frequentemente divergem dos critérios cristãos declarados';
    }

    await prisma.politicianScore.create({
      data: {
        politician_id: politico.id,
        life_protection: Math.round(lifeProtection),
        family_values: Math.round(familyValues),
        moral_integrity: Math.round(moralIntegrity),
        social_responsibility: Math.round(socialResponsibility),
        religious_freedom: Math.round(religiousFreedom),
        overall_score: overallScore,
        performance_level: performanceLevel,
        performance_label: performanceLabel,
        performance_description: performanceDescription,
        total_votes: Math.floor(Math.random() * 50) + 10,
        consistency_score: Math.random() * 0.6 + 0.4, // 0.4 a 1.0
      },
    });
  }

  // ========================================
  // VOTAÇÕES DE EXEMPLO
  // ========================================

  console.log('🗳️ Criando votações de exemplo...');

  const agendas = await prisma.keyAgenda.findMany();
  
  for (const agenda of agendas.slice(0, 3)) { // Apenas as 3 primeiras pautas
    for (const politico of politicos) {
      // Simular votações baseadas no perfil
      const score = await prisma.politicianScore.findUnique({
        where: { politician_id: politico.id }
      });

      if (score) {
        // Probabilidade de voto conservador baseada na pontuação
        const conservativeProbability = score.overall_score / 100;
        const isConservativeVote = Math.random() < conservativeProbability;
        
        let voteType: VoteType;
        let appliedScore: number;

        if (Math.random() < 0.05) { // 5% de ausência
          voteType = VoteType.ABSENT;
          appliedScore = 0;
        } else if (Math.random() < 0.03) { // 3% de abstenção
          voteType = VoteType.ABSTENTION;
          appliedScore = 0;
        } else if (isConservativeVote) {
          voteType = VoteType.YES;
          appliedScore = agenda.positive_weight;
        } else {
          voteType = VoteType.NO;
          appliedScore = agenda.negative_weight;
        }

        await prisma.vote.create({
          data: {
            politician_id: politico.id,
            key_agenda_id: agenda.id,
            vote_type: voteType,
            applied_score: appliedScore,
            vote_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            source: agenda.source,
            source_vote_id: `VOTE-${agenda.id}-${politico.id}`,
            source_proposition_id: agenda.source_id,
            voting_description: `Votação sobre: ${agenda.title}`,
          },
        });
      }
    }
  }

  // ========================================
  // LOG DE SINCRONIZAÇÃO INICIAL
  // ========================================

  console.log('📝 Criando log de sincronização inicial...');

  await prisma.syncLog.create({
    data: {
      sync_type: 'POLITICIANS',
      source: SourceType.MANUAL,
      status: 'SUCCESS',
      start_time: new Date(),
      end_time: new Date(),
      records_processed: politicos.length,
      records_inserted: politicos.length,
      records_updated: 0,
      records_failed: 0,
      details: {
        message: 'Seed inicial do banco de dados',
        politicians_created: politicos.length,
        agendas_created: keyAgendas.count,
      },
    },
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log(`📊 Criados: ${politicos.length} políticos, ${keyAgendas.count} pautas-chave`);
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });