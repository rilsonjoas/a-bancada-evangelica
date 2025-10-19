// Serviço para integração com a API da Câmara dos Deputados
import { BaseAPIService } from './base';
import { 
  CamaraDeputado, 
  CamaraProposicao, 
  CamaraVotacao, 
  CamaraVoto, 
  CamaraDespesa,
  APIConfig 
} from '@/types/api';

export class CamaraAPIService extends BaseAPIService {
  constructor(config: APIConfig['camara']) {
    super(config);
  }

  // ========================================
  // DEPUTADOS
  // ========================================

  /**
   * Busca todos os deputados em exercício
   */
  async getDeputadosAtivos(): Promise<CamaraDeputado[]> {
    const cacheKey = 'deputados_ativos';
    const cached = this.getCached<CamaraDeputado[]>(cacheKey);
    if (cached) return cached;

    try {
      const logInicio = Date.now();
      
      const deputados = await this.requestWithPagination<CamaraDeputado>(
        '/deputados?ordem=ASC&ordenarPor=nome'
      );

      // Cache por 6 horas (deputados não mudam com frequência)
      this.setCached(cacheKey, deputados, 360);

      await this.logSincronizacao({
        tipo: 'deputados',
        fonte: 'camara',
        status: 'sucesso',
        data_inicio: new Date(logInicio).toISOString(),
        data_fim: new Date().toISOString(),
        registros_processados: deputados.length,
        registros_inseridos: deputados.length,
        registros_atualizados: 0,
        registros_erro: 0,
      });

      return deputados;
    } catch (error) {
      await this.logSincronizacao({
        tipo: 'deputados',
        fonte: 'camara',
        status: 'erro',
        data_inicio: new Date().toISOString(),
        registros_processados: 0,
        registros_inseridos: 0,
        registros_atualizados: 0,
        registros_erro: 1,
        mensagem_erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      throw error;
    }
  }

  /**
   * Busca detalhes de um deputado específico
   */
  async getDeputadoDetalhes(deputadoId: number): Promise<CamaraDeputado> {
    const cacheKey = `deputado_${deputadoId}`;
    const cached = this.getCached<CamaraDeputado>(cacheKey);
    if (cached) return cached;

    const response = await this.request<{ dados: CamaraDeputado }>(`/deputados/${deputadoId}`);
    const deputado = response.dados;

    // Cache por 24 horas
    this.setCached(cacheKey, deputado, 1440);
    
    return deputado;
  }

  // ========================================
  // PROPOSIÇÕES
  // ========================================

  /**
   * Busca proposições por palavra-chave (para identificar pautas importantes)
   */
  async buscarProposicoesPorPalavraChave(
    keywords: string[],
    ano?: number,
    siglaTipo?: string[]
  ): Promise<CamaraProposicao[]> {
    const proposicoes: CamaraProposicao[] = [];

    for (const keyword of keywords) {
      try {
        let endpoint = `/proposicoes?keywords=${encodeURIComponent(keyword)}&ordem=DESC&ordenarPor=id`;
        
        if (ano) {
          endpoint += `&ano=${ano}`;
        }
        
        if (siglaTipo && siglaTipo.length > 0) {
          endpoint += `&siglaTipo=${siglaTipo.join(',')}`;
        }

        const keywordProposicoes = await this.requestWithPagination<CamaraProposicao>(endpoint);
        proposicoes.push(...keywordProposicoes);

        console.log(`Encontradas ${keywordProposicoes.length} proposições para "${keyword}"`);
      } catch (error) {
        console.error(`Erro ao buscar proposições para "${keyword}":`, error);
      }
    }

    // Remove duplicatas baseado no ID
    const uniqueProposicoes = proposicoes.filter((prop, index, self) => 
      index === self.findIndex(p => p.id === prop.id)
    );

    return uniqueProposicoes;
  }

  /**
   * Busca detalhes de uma proposição específica
   */
  async getProposicaoDetalhes(proposicaoId: number): Promise<CamaraProposicao> {
    const cacheKey = `proposicao_${proposicaoId}`;
    const cached = this.getCached<CamaraProposicao>(cacheKey);
    if (cached) return cached;

    const response = await this.request<{ dados: CamaraProposicao }>(`/proposicoes/${proposicaoId}`);
    const proposicao = response.dados;

    // Cache por 12 horas (proposições podem ser atualizadas)
    this.setCached(cacheKey, proposicao, 720);
    
    return proposicao;
  }

  // ========================================
  // VOTAÇÕES
  // ========================================

  /**
   * Busca todas as votações de uma proposição
   */
  async getVotacoesProposicao(proposicaoId: number): Promise<CamaraVotacao[]> {
    const cacheKey = `votacoes_prop_${proposicaoId}`;
    const cached = this.getCached<CamaraVotacao[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.request<{ dados: CamaraVotacao[] }>(`/proposicoes/${proposicaoId}/votacoes`);
      const votacoes = response.dados || [];

      // Cache por 2 horas (votações podem ser atualizadas rapidamente)
      this.setCached(cacheKey, votacoes, 120);
      
      return votacoes;
    } catch (error) {
      console.error(`Erro ao buscar votações da proposição ${proposicaoId}:`, error);
      return [];
    }
  }

  /**
   * Busca os votos individuais de uma votação específica
   */
  async getVotosVotacao(votacaoId: string): Promise<CamaraVoto[]> {
    const cacheKey = `votos_${votacaoId}`;
    const cached = this.getCached<CamaraVoto[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.request<{ dados: CamaraVoto[] }>(`/votacoes/${votacaoId}/votos`);
      const votos = response.dados || [];

      // Cache por 24 horas (votos não mudam)
      this.setCached(cacheKey, votos, 1440);
      
      return votos;
    } catch (error) {
      console.error(`Erro ao buscar votos da votação ${votacaoId}:`, error);
      return [];
    }
  }

  /**
   * Busca votações recentes (últimos X dias)
   */
  async getVotacoesRecentes(diasAtras: number = 30): Promise<CamaraVotacao[]> {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - diasAtras);
    
    const dataInicioStr = dataInicio.toISOString().split('T')[0];
    const dataFimStr = new Date().toISOString().split('T')[0];

    try {
      const votacoes = await this.requestWithPagination<CamaraVotacao>(
        `/votacoes?dataInicio=${dataInicioStr}&dataFim=${dataFimStr}&ordem=DESC&ordenarPor=dataHoraRegistro`
      );

      return votacoes;
    } catch (error) {
      console.error('Erro ao buscar votações recentes:', error);
      return [];
    }
  }

  // ========================================
  // DESPESAS
  // ========================================

  /**
   * Busca despesas de um deputado em um período específico
   */
  async getDespesasDeputado(
    deputadoId: number, 
    ano: number, 
    mes?: number
  ): Promise<CamaraDespesa[]> {
    const cacheKey = `despesas_${deputadoId}_${ano}_${mes || 'all'}`;
    const cached = this.getCached<CamaraDespesa[]>(cacheKey);
    if (cached) return cached;

    try {
      let endpoint = `/deputados/${deputadoId}/despesas?ano=${ano}&ordem=DESC&ordenarPor=dataDocumento`;
      
      if (mes) {
        endpoint += `&mes=${mes}`;
      }

      const despesas = await this.requestWithPagination<CamaraDespesa>(endpoint);

      // Cache por 6 horas
      this.setCached(cacheKey, despesas, 360);
      
      return despesas;
    } catch (error) {
      console.error(`Erro ao buscar despesas do deputado ${deputadoId}:`, error);
      return [];
    }
  }

  /**
   * Busca despesas de todos os deputados ativos no mês/ano especificado
   */
  async getDespesasTodasDeputados(ano: number, mes: number): Promise<Map<number, CamaraDespesa[]>> {
    const deputados = await this.getDeputadosAtivos();
    const despesasPorDeputado = new Map<number, CamaraDespesa[]>();

    console.log(`Buscando despesas de ${deputados.length} deputados para ${mes}/${ano}`);

    for (const deputado of deputados) {
      try {
        const despesas = await this.getDespesasDeputado(deputado.id, ano, mes);
        despesasPorDeputado.set(deputado.id, despesas);
        
        console.log(`Deputado ${deputado.nome}: ${despesas.length} despesas`);
      } catch (error) {
        console.error(`Erro ao buscar despesas do deputado ${deputado.nome}:`, error);
        despesasPorDeputado.set(deputado.id, []);
      }
    }

    return despesasPorDeputado;
  }

  // ========================================
  // ANÁLISE DE INTEGRIDADE
  // ========================================

  /**
   * Analisa despesas suspeitas de um deputado
   */
  analisarDespesasSuspeitas(despesas: CamaraDespesa[]): {
    valorTotal: number;
    valorSuspeito: number;
    despesasSuspeitas: CamaraDespesa[];
    indicadores: string[];
  } {
    const despesasSuspeitas: CamaraDespesa[] = [];
    const indicadores: string[] = [];
    let valorSuspeito = 0;

    const valorTotal = despesas.reduce((total, despesa) => total + despesa.valorLiquido, 0);

    for (const despesa of despesas) {
      const suspeitas: string[] = [];

      // Valor muito alto para o tipo de despesa
      if (despesa.tipoDespesa === 'COMBUSTÍVEIS E LUBRIFICANTES' && despesa.valorLiquido > 10000) {
        suspeitas.push('Valor alto para combustível');
      }
      
      if (despesa.tipoDespesa === 'ALIMENTAÇÃO' && despesa.valorLiquido > 5000) {
        suspeitas.push('Valor alto para alimentação');
      }

      // Fornecedor suspeito (pessoa física em despesas empresariais)
      if (despesa.cnpjCpfFornecedor && despesa.cnpjCpfFornecedor.length === 11) {
        suspeitas.push('Fornecedor pessoa física');
      }

      // Valores exatos (suspeito de nota fria)
      if (despesa.valorLiquido % 100 === 0 && despesa.valorLiquido > 1000) {
        suspeitas.push('Valor exato suspeito');
      }

      // Mesma data, mesmo fornecedor, múltiplas despesas
      const mesmoDiaFornecedor = despesas.filter(d => 
        d.dataDocumento === despesa.dataDocumento && 
        d.cnpjCpfFornecedor === despesa.cnpjCpfFornecedor
      );
      
      if (mesmoDiaFornecedor.length > 3) {
        suspeitas.push('Múltiplas despesas mesmo dia/fornecedor');
      }

      if (suspeitas.length > 0) {
        despesasSuspeitas.push(despesa);
        valorSuspeito += despesa.valorLiquido;
        indicadores.push(...suspeitas);
      }
    }

    return {
      valorTotal,
      valorSuspeito,
      despesasSuspeitas,
      indicadores: Array.from(new Set(indicadores)), // Remove duplicatas
    };
  }
}