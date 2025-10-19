// Worker principal para sincronização de dados das APIs governamentais
import { CamaraAPIService } from '@/services/api/camara';
import { SenadoAPIService } from '@/services/api/senado';
import { 
  PautaChave, 
  VotacaoProcessada, 
  DespesaProcessada,
  APIConfig,
  WorkerConfig
} from '@/types/api';

export class SyncWorker {
  private camaraAPI: CamaraAPIService;
  private senadoAPI: SenadoAPIService;
  private config: WorkerConfig;
  private isRunning: boolean = false;

  constructor(apiConfig: APIConfig, workerConfig: WorkerConfig) {
    this.camaraAPI = new CamaraAPIService(apiConfig.camara);
    this.senadoAPI = new SenadoAPIService(apiConfig.senado);
    this.config = workerConfig;
  }

  // ========================================
  // CONTROLE DO WORKER
  // ========================================

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Worker já está rodando');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Iniciando SyncWorker...');

    // Configurar cron jobs baseado na configuração
    this.setupCronJobs();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('🛑 Parando SyncWorker...');
  }

  private setupCronJobs(): void {
    if (this.config.politicos.enabled) {
      this.scheduleCronJob(
        this.config.politicos.cron_schedule,
        () => this.syncPoliticos(),
        'Sync Políticos'
      );
    }

    if (this.config.votacoes.enabled) {
      this.scheduleCronJob(
        this.config.votacoes.cron_schedule,
        () => this.syncVotacoes(),
        'Sync Votações'
      );
    }

    if (this.config.despesas.enabled) {
      this.scheduleCronJob(
        this.config.despesas.cron_schedule,
        () => this.syncDespesas(),
        'Sync Despesas'
      );
    }
  }

  private scheduleCronJob(schedule: string, task: () => Promise<void>, name: string): void {
    // Implementação simplificada - em produção usaria uma lib como node-cron
    console.log(`📅 Agendando ${name} com schedule: ${schedule}`);
    
    // Para demonstração, executa a tarefa imediatamente
    setTimeout(async () => {
      if (this.isRunning) {
        console.log(`🔄 Executando ${name}...`);
        try {
          await task();
          console.log(`✅ ${name} concluído com sucesso`);
        } catch (error) {
          console.error(`❌ Erro em ${name}:`, error);
        }
      }
    }, 5000); // 5 segundos após o start
  }

  // ========================================
  // SINCRONIZAÇÃO DE POLÍTICOS
  // ========================================

  async syncPoliticos(): Promise<void> {
    console.log('🏛️ Sincronizando dados de políticos...');

    try {
      // Buscar deputados da Câmara
      const deputados = await this.camaraAPI.getDeputadosAtivos();
      console.log(`📊 Encontrados ${deputados.length} deputados ativos`);

      // Buscar senadores
      const senadores = await this.senadoAPI.getSenadoresAtivos();
      console.log(`📊 Encontrados ${senadores.length} senadores ativos`);

      // Aqui você salvaria no banco de dados
      // await this.savePoliticosToDatabase(deputados, senadores);

      console.log('✅ Sincronização de políticos concluída');
    } catch (error) {
      console.error('❌ Erro na sincronização de políticos:', error);
      throw error;
    }
  }

  // ========================================
  // SINCRONIZAÇÃO DE VOTAÇÕES
  // ========================================

  async syncVotacoes(): Promise<void> {
    console.log('🗳️ Sincronizando votações...');

    try {
      // Buscar pautas-chave do banco de dados
      const pautasChave = await this.getPautasChave();
      console.log(`📋 Processando ${pautasChave.length} pautas-chave`);

      const votacoesProcessadas: VotacaoProcessada[] = [];

      // Processar pautas da Câmara
      const pautasCamara = pautasChave.filter(p => p.fonte === 'camara');
      for (const pauta of pautasCamara) {
        const votacoesPauta = await this.processVotacoesCamara(pauta);
        votacoesProcessadas.push(...votacoesPauta);
      }

      // Processar pautas do Senado
      const pautasSenado = pautasChave.filter(p => p.fonte === 'senado');
      for (const pauta of pautasSenado) {
        const votacoesPauta = await this.processVotacoesSenado(pauta);
        votacoesProcessadas.push(...votacoesPauta);
      }

      console.log(`📊 Total de ${votacoesProcessadas.length} votações processadas`);

      // Salvar votações processadas no banco
      // await this.saveVotacoesToDatabase(votacoesProcessadas);

      console.log('✅ Sincronização de votações concluída');
    } catch (error) {
      console.error('❌ Erro na sincronização de votações:', error);
      throw error;
    }
  }

  private async processVotacoesCamara(pauta: PautaChave): Promise<VotacaoProcessada[]> {
    const votacoesProcessadas: VotacaoProcessada[] = [];

    try {
      // Buscar votações da proposição
      const votacoes = await this.camaraAPI.getVotacoesProposicao(Number(pauta.fonte_id));

      for (const votacao of votacoes) {
        // Buscar votos individuais
        const votos = await this.camaraAPI.getVotosVotacao(votacao.id);

        for (const voto of votos) {
          const pontuacao = this.calcularPontuacaoVoto(
            voto.tipoVoto,
            pauta.peso_positivo,
            pauta.peso_negativo,
            pauta.criterio
          );

          votacoesProcessadas.push({
            pauta_id: pauta.id,
            politico_id: voto.deputado_.id,
            voto: this.normalizarVoto(voto.tipoVoto),
            pontuacao_aplicada: pontuacao,
            data_votacao: votacao.data,
            fonte: 'camara',
            fonte_votacao_id: votacao.id,
          });
        }
      }

      console.log(`📊 Pauta "${pauta.titulo}": ${votacoesProcessadas.length} votos processados`);
    } catch (error) {
      console.error(`❌ Erro ao processar pauta ${pauta.titulo}:`, error);
    }

    return votacoesProcessadas;
  }

  private async processVotacoesSenado(pauta: PautaChave): Promise<VotacaoProcessada[]> {
    const votacoesProcessadas: VotacaoProcessada[] = [];

    try {
      // Buscar votações da matéria
      const votacoes = await this.senadoAPI.getVotacoesMateria(String(pauta.fonte_id));

      for (const votacao of votacoes) {
        if (votacao.VotoParlamentar && Array.isArray(votacao.VotoParlamentar)) {
          for (const voto of votacao.VotoParlamentar) {
            const votoNormalizado = this.senadoAPI.normalizarTipoVoto(voto.DescricaoVoto);
            const pontuacao = this.calcularPontuacaoVoto(
              votoNormalizado,
              pauta.peso_positivo,
              pauta.peso_negativo,
              pauta.criterio
            );

            votacoesProcessadas.push({
              pauta_id: pauta.id,
              politico_id: parseInt(voto.CodigoParlamentar), // Converter para número
              voto: votoNormalizado,
              pontuacao_aplicada: pontuacao,
              data_votacao: votacao.DataSessao,
              fonte: 'senado',
              fonte_votacao_id: votacao.CodigoSessao,
            });
          }
        }
      }

      console.log(`📊 Pauta "${pauta.titulo}": ${votacoesProcessadas.length} votos processados`);
    } catch (error) {
      console.error(`❌ Erro ao processar pauta ${pauta.titulo}:`, error);
    }

    return votacoesProcessadas;
  }

  // ========================================
  // SINCRONIZAÇÃO DE DESPESAS
  // ========================================

  async syncDespesas(): Promise<void> {
    console.log('💰 Sincronizando despesas...');

    try {
      const despesasProcessadas: DespesaProcessada[] = [];
      const anoAtual = new Date().getFullYear();
      const mesesAnalise = this.config.despesas.meses_analise;

      // Processar despesas da Câmara
      const deputados = await this.camaraAPI.getDeputadosAtivos();
      
      for (const deputado of deputados) {
        for (let i = 0; i < mesesAnalise; i++) {
          const data = new Date();
          data.setMonth(data.getMonth() - i);
          const ano = data.getFullYear();
          const mes = data.getMonth() + 1;

          try {
            const despesas = await this.camaraAPI.getDespesasDeputado(deputado.id, ano, mes);
            const analise = this.camaraAPI.analisarDespesasSuspeitas(despesas);

            despesasProcessadas.push({
              politico_id: deputado.id,
              ano,
              mes,
              valor_total: analise.valorTotal,
              valor_suspeito: analise.valorSuspeito,
              qtd_despesas_suspeitas: analise.despesasSuspeitas.length,
              fonte: 'camara',
              data_processamento: new Date().toISOString(),
            });

          } catch (error) {
            console.error(`❌ Erro ao processar despesas ${deputado.nome} ${mes}/${ano}:`, error);
          }
        }
      }

      console.log(`📊 Total de ${despesasProcessadas.length} análises de despesas processadas`);

      // Salvar análises no banco
      // await this.saveDespesasToDatabase(despesasProcessadas);

      console.log('✅ Sincronização de despesas concluída');
    } catch (error) {
      console.error('❌ Erro na sincronização de despesas:', error);
      throw error;
    }
  }

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  private calcularPontuacaoVoto(
    voto: string,
    pesoPositivo: number,
    pesoNegativo: number,
    criterio: string
  ): number {
    // Lógica simplificada - em produção seria mais complexa
    const votoNorm = voto.toUpperCase();
    
    // Para critérios conservadores, SIM é positivo
    if (votoNorm === 'SIM') {
      return pesoPositivo;
    } else if (votoNorm === 'NAO') {
      return pesoNegativo;
    } else {
      return 0; // Abstenção, obstrução ou ausência
    }
  }

  private normalizarVoto(votoOriginal: string): 'SIM' | 'NAO' | 'ABSTENCAO' | 'OBSTRUCAO' | 'AUSENTE' {
    const voto = votoOriginal.toUpperCase();
    
    if (voto.includes('SIM')) return 'SIM';
    if (voto.includes('NÃO') || voto.includes('NAO')) return 'NAO';
    if (voto.includes('ABSTENÇÃO') || voto.includes('ABSTENCAO')) return 'ABSTENCAO';
    if (voto.includes('OBSTRUÇÃO') || voto.includes('OBSTRUCAO')) return 'OBSTRUCAO';
    
    return 'AUSENTE';
  }

  // ========================================
  // MOCK DE FUNÇÕES DE BANCO DE DADOS
  // ========================================

  private async getPautasChave(): Promise<PautaChave[]> {
    // Mock - em produção viria do banco de dados
    return [
      {
        id: '1',
        titulo: 'PL do Aborto - PL 1904/2024',
        descricao: 'Projeto que equipara aborto após 22 semanas a homicídio',
        criterio: 'lifeProtection',
        peso_positivo: 10,
        peso_negativo: -10,
        fonte: 'camara',
        fonte_id: '1904', // ID da proposição
        keywords: ['aborto', 'homicídio', 'vida'],
        status: 'ativa',
        data_criacao: '2024-01-01',
        data_atualizacao: '2024-01-01',
      },
      {
        id: '2',
        titulo: 'Marco Legal da Primeira Infância',
        descricao: 'Estabelece políticas públicas para crianças de 0 a 6 anos',
        criterio: 'familyValues',
        peso_positivo: 8,
        peso_negativo: -5,
        fonte: 'senado',
        fonte_id: 'SF123456', // Código da matéria
        keywords: ['criança', 'família', 'infância'],
        status: 'ativa',
        data_criacao: '2024-01-01',
        data_atualizacao: '2024-01-01',
      },
    ];
  }

  // ========================================
  // FUNÇÃO PARA EXECUÇÃO MANUAL
  // ========================================

  async runFullSync(): Promise<void> {
    console.log('🔄 Executando sincronização completa...');
    
    try {
      await this.syncPoliticos();
      await this.syncVotacoes();
      await this.syncDespesas();
      
      console.log('✅ Sincronização completa finalizada com sucesso!');
    } catch (error) {
      console.error('❌ Erro na sincronização completa:', error);
      throw error;
    }
  }

  // ========================================
  // MÉTODOS DE STATUS E MONITORAMENTO
  // ========================================

  getStatus(): {
    isRunning: boolean;
    config: WorkerConfig;
    lastSync?: string;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      lastSync: new Date().toISOString(),
    };
  }

  async healthCheck(): Promise<{
    camara: boolean;
    senado: boolean;
    status: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    try {
      // Teste simples das APIs
      const camaraHealth = await this.testCamaraConnection();
      const senadoHealth = await this.testSenadoConnection();

      const allHealthy = camaraHealth && senadoHealth;
      const someHealthy = camaraHealth || senadoHealth;

      return {
        camara: camaraHealth,
        senado: senadoHealth,
        status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
      };
    } catch (error) {
      return {
        camara: false,
        senado: false,
        status: 'unhealthy',
      };
    }
  }

  private async testCamaraConnection(): Promise<boolean> {
    try {
      await this.camaraAPI.getDeputadosAtivos();
      return true;
    } catch {
      return false;
    }
  }

  private async testSenadoConnection(): Promise<boolean> {
    try {
      await this.senadoAPI.getSenadoresAtivos();
      return true;
    } catch {
      return false;
    }
  }
}