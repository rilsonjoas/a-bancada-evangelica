// Arquivo principal de exportação dos serviços de API e workers
export { BaseAPIService } from './api/base';
export { CamaraAPIService } from './api/camara';
export { SenadoAPIService } from './api/senado';

export { SyncWorker } from './workers/syncWorker';

export { CriteriaEngine } from './scoring/criteriaEngine';
export type { 
  CriteriaWeights,
  CriteriaScores,
  ScoringContext,
} from './scoring/criteriaEngine';

export { 
  defaultAPIConfig,
  defaultWorkerConfig,
  developmentWorkerConfig,
  productionWorkerConfig,
  criteriaKeywords,
  expenseAnalysisConfig,
  reportConfig,
  getConfigForEnvironment,
} from './config/apiConfig';

// Instância singleton do worker principal
let syncWorkerInstance: SyncWorker | null = null;

export function getSyncWorker(): SyncWorker {
  if (!syncWorkerInstance) {
    const { apiConfig, workerConfig } = getConfigForEnvironment(
      process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development'
    );
    
    syncWorkerInstance = new SyncWorker(apiConfig, workerConfig);
  }
  
  return syncWorkerInstance;
}

// Instância singleton do engine de critérios
let criteriaEngineInstance: CriteriaEngine | null = null;

export function getCriteriaEngine(): CriteriaEngine {
  if (!criteriaEngineInstance) {
    criteriaEngineInstance = new CriteriaEngine();
  }
  
  return criteriaEngineInstance;
}

// Função de inicialização para ser chamada no app
export async function initializeServices(): Promise<{
  syncWorker: SyncWorker;
  criteriaEngine: CriteriaEngine;
}> {
  console.log('🔧 Inicializando serviços A Bancada Evangélica...');
  
  const syncWorker = getSyncWorker();
  const criteriaEngine = getCriteriaEngine();
  
  // Teste de conectividade das APIs
  try {
    const healthCheck = await syncWorker.healthCheck();
    console.log('📡 Status das APIs:', healthCheck);
    
    if (healthCheck.status === 'unhealthy') {
      console.warn('⚠️ APIs governamentais indisponíveis. Modo offline ativado.');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar status das APIs:', error);
  }
  
  console.log('✅ Serviços inicializados com sucesso!');
  
  return {
    syncWorker,
    criteriaEngine,
  };
}