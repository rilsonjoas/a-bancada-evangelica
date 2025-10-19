// Configurações centralizadas para as APIs e Workers
import { APIConfig, WorkerConfig } from '@/types/api';

export const defaultAPIConfig: APIConfig = {
  camara: {
    base_url: 'https://dadosabertos.camara.leg.br/api/v2',
    rate_limit: 120, // 120 requests por minuto
    timeout: 30000, // 30 segundos
    retry_attempts: 3,
  },
  senado: {
    base_url: 'https://legis.senado.leg.br/dadosabertos',
    rate_limit: 60, // 60 requests por minuto (mais conservador)
    timeout: 45000, // 45 segundos (API do Senado pode ser mais lenta)
    retry_attempts: 3,
  },
  tse: {
    base_url: 'https://dadosabertos.tse.jus.br',
    data_path: './data/tse', // Caminho local para downloads
    update_frequency: 'weekly',
  },
};

export const defaultWorkerConfig: WorkerConfig = {
  votacoes: {
    enabled: true,
    cron_schedule: '0 */6 * * *', // A cada 6 horas
    batch_size: 50, // Processar 50 proposições por vez
  },
  despesas: {
    enabled: true,
    cron_schedule: '0 2 * * *', // Todos os dias às 2h da manhã
    meses_analise: 6, // Analisar últimos 6 meses
  },
  politicos: {
    enabled: true,
    cron_schedule: '0 4 * * 0', // Domingos às 4h da manhã
  },
  tse_sync: {
    enabled: true,
    cron_schedule: '0 3 * * 1', // Segundas às 3h da manhã
    eleicoes_monitoradas: [2022, 2024, 2026], // Anos das eleições para monitorar
  },
};

// Configurações de desenvolvimento (mais frequente, menos rigoroso)
export const developmentWorkerConfig: WorkerConfig = {
  votacoes: {
    enabled: true,
    cron_schedule: '0 */1 * * *', // A cada hora (para testes)
    batch_size: 10,
  },
  despesas: {
    enabled: true,
    cron_schedule: '0 */2 * * *', // A cada 2 horas
    meses_analise: 3,
  },
  politicos: {
    enabled: true,
    cron_schedule: '0 */3 * * *', // A cada 3 horas
  },
  tse_sync: {
    enabled: false, // Desabilitado em desenvolvimento
    cron_schedule: '0 0 * * *',
    eleicoes_monitoradas: [2024],
  },
};

// Configurações de produção (mais conservador, otimizado)
export const productionWorkerConfig: WorkerConfig = {
  votacoes: {
    enabled: true,
    cron_schedule: '0 */4 * * *', // A cada 4 horas
    batch_size: 100,
  },
  despesas: {
    enabled: true,
    cron_schedule: '0 1 * * *', // Todo dia à 1h da manhã
    meses_analise: 12, // Analisar último ano completo
  },
  politicos: {
    enabled: true,
    cron_schedule: '0 2 * * 0', // Domingos às 2h da manhã
  },
  tse_sync: {
    enabled: true,
    cron_schedule: '0 0 * * 1', // Segundas à meia-noite
    eleicoes_monitoradas: [2022, 2024, 2026, 2028],
  },
};

// Palavras-chave para busca de proposições relevantes
export const criteriaKeywords = {
  lifeProtection: [
    // Vida e aborto
    'aborto', 'vida', 'embrião', 'feto', 'gestação', 'gravidez',
    'eutanásia', 'morte assistida', 'suicídio assistido',
    'pena de morte', 'pena capital', 'execução',
    'homicídio', 'infanticídio', 'feminicídio',
    'células-tronco', 'pesquisa embrionária',
    // Termos específicos de PLs importantes
    'interrupção gestação', 'direitos reprodutivos',
  ],
  
  familyValues: [
    // Família e casamento
    'família', 'casamento', 'união estável', 'matrimônio',
    'adoção', 'guarda', 'tutela', 'pátrio poder', 'poder familiar',
    'menor', 'criança', 'adolescente', 'infância',
    'educação sexual', 'orientação sexual', 'identidade gênero',
    'escola sem partido', 'educação domiciliar', 'homeschooling',
    'estatuto família', 'código civil família',
    // Proteção à infância
    'exploração sexual', 'pornografia infantil', 'pedofilia',
    'trabalho infantil', 'menor aprendiz',
  ],
  
  moralIntegrity: [
    // Corrupção e transparência
    'corrupção', 'lavagem dinheiro', 'improbidade',
    'transparência', 'acesso informação', 'dados abertos',
    'prestação contas', 'accountability', 'controle social',
    'ética', 'conduta', 'decoro parlamentar',
    'conflito interesse', 'nepotismo', 'favorecimento',
    'licitação', 'concorrência', 'contrato público',
    // Leis específicas
    'lei acesso informação', 'marco civil internet',
    'cadastro positivo', 'sigilo bancário',
    // Crimes financeiros
    'sonegação', 'elisão fiscal', 'paraíso fiscal',
  ],
  
  socialResponsibility: [
    // Justiça social
    'pobreza', 'desigualdade', 'renda mínima', 'bolsa família',
    'assistência social', 'vulnerabilidade social',
    'população rua', 'moradia', 'habitação popular',
    'segurança alimentar', 'fome', 'nutrição',
    'saúde pública', 'SUS', 'medicamento', 'vacina',
    'educação pública', 'ensino fundamental', 'analfabetismo',
    // Grupos vulneráveis
    'idoso', 'deficiente', 'pessoa deficiência',
    'refugiado', 'imigrante', 'indígena', 'quilombola',
    'trabalho escravo', 'tráfico pessoas',
    // Políticas sociais
    'previdência social', 'auxílio emergencial',
    'programa social', 'transferência renda',
  ],
  
  religiousFreedom: [
    // Liberdade religiosa
    'liberdade religiosa', 'liberdade culto', 'liberdade consciência',
    'religião', 'culto', 'igreja', 'templo', 'denominação',
    'ensino religioso', 'capelania', 'assistência religiosa',
    'símbolos religiosos', 'crucifixo', 'presépio',
    'feriado religioso', 'domingo', 'guarda sabática',
    'objeção consciência', 'escusa consciência',
    // Questões específicas
    'laicidade', 'estado laico', 'separação igreja estado',
    'intolerância religiosa', 'discriminação religiosa',
    'blasfêmia', 'ofensa religiosa', 'vilipêndio',
    // Denominações
    'evangélico', 'católico', 'protestante', 'pentecostal',
    'assembleia deus', 'batista', 'metodista', 'presbiteriano',
  ],
};

// Configurações específicas para análise de despesas suspeitas
export const expenseAnalysisConfig = {
  // Limites por tipo de despesa (em reais)
  suspiciousLimits: {
    'COMBUSTÍVEIS E LUBRIFICANTES': 8000,
    'ALIMENTAÇÃO': 4000,
    'HOSPEDAGEM': 15000,
    'PASSAGENS AÉREAS': 20000,
    'TELEFONIA': 3000,
    'POSTAIS': 1000,
    'MANUTENÇÃO DE ESCRITÓRIO': 5000,
    'CONSULTORIAS': 25000,
  },
  
  // Padrões suspeitos
  suspiciousPatterns: {
    exactValues: true, // Valores exatos (múltiplos de 100)
    personalSuppliers: true, // Fornecedores pessoa física
    sameDay: 3, // Mais de 3 despesas no mesmo dia/fornecedor
    highFrequency: 10, // Mais de 10 despesas com mesmo fornecedor/mês
  },
  
  // Percentuais para penalização
  penaltyThresholds: {
    high: { threshold: 30, penalty: 40 }, // >30% = -40 pontos
    medium: { threshold: 20, penalty: 25 }, // >20% = -25 pontos  
    low: { threshold: 10, penalty: 10 }, // >10% = -10 pontos
  },
  
  // Limite mensal "normal" de gastos
  monthlyLimit: 35000, // R$ 35.000/mês
};

// Configurações para geração de relatórios
export const reportConfig = {
  // Frequência de geração de relatórios
  schedules: {
    daily: '0 6 * * *', // 6h da manhã
    weekly: '0 7 * * 1', // Segundas 7h
    monthly: '0 8 1 * *', // Dia 1 de cada mês 8h
  },
  
  // Tipos de relatório disponíveis
  types: {
    ranking: true,
    individual: true,
    comparative: true,
    trends: true,
    alerts: true,
  },
  
  // Configurações de alertas
  alerts: {
    scoreDropThreshold: 10, // Queda de 10+ pontos
    suspiciousExpenseThreshold: 20000, // Despesa única > R$ 20k
    consistencyThreshold: 0.3, // Consistência < 30%
  },
};

// Função para obter configuração baseada no ambiente
export function getConfigForEnvironment(env: 'development' | 'production' | 'test') {
  const apiConfig = defaultAPIConfig;
  
  let workerConfig: WorkerConfig;
  
  switch (env) {
    case 'development':
      workerConfig = developmentWorkerConfig;
      break;
    case 'production':
      workerConfig = productionWorkerConfig;
      break;
    case 'test':
      workerConfig = {
        ...developmentWorkerConfig,
        votacoes: { ...developmentWorkerConfig.votacoes, enabled: false },
        despesas: { ...developmentWorkerConfig.despesas, enabled: false },
        politicos: { ...developmentWorkerConfig.politicos, enabled: false },
        tse_sync: { ...developmentWorkerConfig.tse_sync, enabled: false },
      };
      break;
    default:
      workerConfig = defaultWorkerConfig;
  }
  
  return { apiConfig, workerConfig };
}