// Serviço para integração com a API do Senado Federal
import { BaseAPIService } from './base';
import { 
  SenadoSenador, 
  SenadoMateria, 
  SenadoVotacao,
  APIConfig 
} from '@/types/api';

export class SenadoAPIService extends BaseAPIService {
  constructor(config: APIConfig['senado']) {
    super(config);
  }

  // ========================================
  // SENADORES
  // ========================================

  /**
   * Busca todos os senadores em exercício na legislatura atual
   */
  async getSenadoresAtivos(): Promise<SenadoSenador[]> {
    const cacheKey = 'senadores_ativos';
    const cached = this.getCached<SenadoSenador[]>(cacheKey);
    if (cached) return cached;

    try {
      const logInicio = Date.now();
      
      // A API do Senado usa XML por padrão, mas aceita JSON
      const response = await this.request<{
        ListaParlamentarLegislatura: {
          Parlamentares: {
            Parlamentar: SenadoSenador[]
          }
        }
      }>('/senador/lista/atual.json');

      const senadores = response.ListaParlamentarLegislatura?.Parlamentares?.Parlamentar || [];

      // Cache por 6 horas
      this.setCached(cacheKey, senadores, 360);

      await this.logSincronizacao({
        tipo: 'senadores',
        fonte: 'senado',
        status: 'sucesso',
        data_inicio: new Date(logInicio).toISOString(),
        data_fim: new Date().toISOString(),
        registros_processados: senadores.length,
        registros_inseridos: senadores.length,
        registros_atualizados: 0,
        registros_erro: 0,
      });

      return senadores;
    } catch (error) {
      await this.logSincronizacao({
        tipo: 'senadores',
        fonte: 'senado',
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
   * Busca detalhes de um senador específico
   */
  async getSenadorDetalhes(codigoParlamentar: string): Promise<SenadoSenador> {
    const cacheKey = `senador_${codigoParlamentar}`;
    const cached = this.getCached<SenadoSenador>(cacheKey);
    if (cached) return cached;

    const response = await this.request<{
      DetalheParlamentar: {
        Parlamentar: SenadoSenador
      }
    }>(`/senador/${codigoParlamentar}.json`);

    const senador = response.DetalheParlamentar?.Parlamentar;
    if (!senador) {
      throw new Error(`Senador ${codigoParlamentar} não encontrado`);
    }

    // Cache por 24 horas
    this.setCached(cacheKey, senador, 1440);
    
    return senador;
  }

  // ========================================
  // MATÉRIAS (equivalente às Proposições da Câmara)
  // ========================================

  /**
   * Busca matérias por termo de pesquisa
   */
  async buscarMateriasPorTermo(
    termo: string,
    ano?: number,
    tramitando: boolean = true
  ): Promise<SenadoMateria[]> {
    try {
      let endpoint = `/materia/pesquisa/${encodeURIComponent(termo)}.json`;
      
      const params: string[] = [];
      if (ano) params.push(`ano=${ano}`);
      if (tramitando) params.push(`tramitando=S`);
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }

      const response = await this.request<{
        PesquisaBasicaMateria: {
          Materias: {
            Materia: SenadoMateria[]
          }
        }
      }>(endpoint);

      const materias = response.PesquisaBasicaMateria?.Materias?.Materia || [];
      
      console.log(`Encontradas ${materias.length} matérias para "${termo}"`);
      return Array.isArray(materias) ? materias : [materias];
    } catch (error) {
      console.error(`Erro ao buscar matérias para "${termo}":`, error);
      return [];
    }
  }

  /**
   * Busca matérias por múltiplas palavras-chave
   */
  async buscarMateriasPorPalavrasChave(
    keywords: string[],
    ano?: number
  ): Promise<SenadoMateria[]> {
    const materias: SenadoMateria[] = [];

    for (const keyword of keywords) {
      try {
        const keywordMaterias = await this.buscarMateriasPorTermo(keyword, ano);
        materias.push(...keywordMaterias);

        console.log(`Encontradas ${keywordMaterias.length} matérias para "${keyword}"`);
      } catch (error) {
        console.error(`Erro ao buscar matérias para "${keyword}":`, error);
      }
    }

    // Remove duplicatas baseado no código da matéria
    const uniqueMaterias = materias.filter((materia, index, self) => 
      index === self.findIndex(m => m.CodigoMateria === materia.CodigoMateria)
    );

    return uniqueMaterias;
  }

  /**
   * Busca detalhes de uma matéria específica
   */
  async getMateriaDetalhes(codigoMateria: string): Promise<SenadoMateria> {
    const cacheKey = `materia_${codigoMateria}`;
    const cached = this.getCached<SenadoMateria>(cacheKey);
    if (cached) return cached;

    const response = await this.request<{
      DetalheMateria: {
        Materia: SenadoMateria
      }
    }>(`/materia/${codigoMateria}.json`);

    const materia = response.DetalheMateria?.Materia;
    if (!materia) {
      throw new Error(`Matéria ${codigoMateria} não encontrada`);
    }

    // Cache por 12 horas
    this.setCached(cacheKey, materia, 720);
    
    return materia;
  }

  // ========================================
  // VOTAÇÕES
  // ========================================

  /**
   * Busca votações de uma matéria específica
   */
  async getVotacoesMateria(codigoMateria: string): Promise<SenadoVotacao[]> {
    const cacheKey = `votacoes_materia_${codigoMateria}`;
    const cached = this.getCached<SenadoVotacao[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.request<{
        VotacaoMateria: {
          Materia: {
            Votacoes: {
              Votacao: SenadoVotacao[]
            }
          }
        }
      }>(`/materia/votacoes/${codigoMateria}.json`);

      const votacoes = response.VotacaoMateria?.Materia?.Votacoes?.Votacao || [];
      
      // Garantir que é array
      const votacoesArray = Array.isArray(votacoes) ? votacoes : [votacoes];

      // Cache por 2 horas
      this.setCached(cacheKey, votacoesArray, 120);
      
      return votacoesArray;
    } catch (error) {
      console.error(`Erro ao buscar votações da matéria ${codigoMateria}:`, error);
      return [];
    }
  }

  /**
   * Busca votações recentes de um período
   */
  async getVotacoesRecentes(diasAtras: number = 30): Promise<SenadoVotacao[]> {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - diasAtras);
    
    const dataInicioStr = dataInicio.toISOString().split('T')[0];
    const dataFimStr = new Date().toISOString().split('T')[0];

    try {
      const response = await this.request<{
        VotacoesPlenario: {
          Votacoes: {
            Votacao: SenadoVotacao[]
          }
        }
      }>(`/votacoes?dataInicio=${dataInicioStr}&dataFim=${dataFimStr}.json`);

      const votacoes = response.VotacoesPlenario?.Votacoes?.Votacao || [];
      return Array.isArray(votacoes) ? votacoes : [votacoes];
    } catch (error) {
      console.error('Erro ao buscar votações recentes do Senado:', error);
      return [];
    }
  }

  /**
   * Busca como um senador específico votou em uma legislatura
   */
  async getVotacoesSenador(
    codigoParlamentar: string, 
    legislatura?: number
  ): Promise<SenadoVotacao[]> {
    const cacheKey = `votacoes_senador_${codigoParlamentar}_${legislatura || 'atual'}`;
    const cached = this.getCached<SenadoVotacao[]>(cacheKey);
    if (cached) return cached;

    try {
      let endpoint = `/senador/${codigoParlamentar}/votacoes`;
      if (legislatura) {
        endpoint += `/${legislatura}`;
      }
      endpoint += '.json';

      const response = await this.request<{
        VotacoesParlamentar: {
          Parlamentar: {
            Votacoes: {
              Votacao: SenadoVotacao[]
            }
          }
        }
      }>(endpoint);

      const votacoes = response.VotacoesParlamentar?.Parlamentar?.Votacoes?.Votacao || [];
      const votacoesArray = Array.isArray(votacoes) ? votacoes : [votacoes];

      // Cache por 6 horas
      this.setCached(cacheKey, votacoesArray, 360);
      
      return votacoesArray;
    } catch (error) {
      console.error(`Erro ao buscar votações do senador ${codigoParlamentar}:`, error);
      return [];
    }
  }

  // ========================================
  // ANÁLISE E PROCESSAMENTO
  // ========================================

  /**
   * Processa votações para extrair votos individuais
   */
  processarVotacoesSenadores(votacoes: SenadoVotacao[]): Array<{
    codigoMateria: string;
    codigoSenador: string;
    nomeSenador: string;
    siglaPartido: string;
    ufSenador: string;
    voto: string;
    dataVotacao: string;
    descricaoVotacao: string;
    resultado: string;
  }> {
    const votosProcessados: Array<{
      codigoMateria: string;
      codigoSenador: string;
      nomeSenador: string;
      siglaPartido: string;
      ufSenador: string;
      voto: string;
      dataVotacao: string;
      descricaoVotacao: string;
      resultado: string;
    }> = [];

    for (const votacao of votacoes) {
      if (votacao.VotoParlamentar && Array.isArray(votacao.VotoParlamentar)) {
        for (const voto of votacao.VotoParlamentar) {
          votosProcessados.push({
            codigoMateria: votacao.CodigoMateria,
            codigoSenador: voto.CodigoParlamentar,
            nomeSenador: voto.NomeParlamentar,
            siglaPartido: voto.SiglaPartido,
            ufSenador: voto.UfParlamentar,
            voto: voto.DescricaoVoto,
            dataVotacao: votacao.DataSessao,
            descricaoVotacao: votacao.DescricaoVotacao,
            resultado: votacao.DescricaoResultado,
          });
        }
      }
    }

    return votosProcessados;
  }

  /**
   * Mapeia tipos de voto do Senado para padrão unificado
   */
  normalizarTipoVoto(votoSenado: string): 'SIM' | 'NAO' | 'ABSTENCAO' | 'OBSTRUCAO' | 'AUSENTE' {
    const voto = votoSenado.toUpperCase();
    
    if (voto.includes('SIM') || voto.includes('FAVORÁVEL') || voto.includes('APROVO')) {
      return 'SIM';
    }
    
    if (voto.includes('NÃO') || voto.includes('NAO') || voto.includes('CONTRÁRIO') || voto.includes('REJEITO')) {
      return 'NAO';
    }
    
    if (voto.includes('ABSTENÇÃO') || voto.includes('ABSTENCAO') || voto.includes('ABSTER')) {
      return 'ABSTENCAO';
    }
    
    if (voto.includes('OBSTRUÇÃO') || voto.includes('OBSTRUCAO') || voto.includes('OBSTRUI')) {
      return 'OBSTRUCAO';
    }
    
    return 'AUSENTE';
  }

  /**
   * Busca matérias relevantes para os critérios de avaliação
   */
  async buscarMateriasRelevantes(): Promise<Map<string, SenadoMateria[]>> {
    const criteriosKeywords = {
      'lifeProtection': ['aborto', 'vida', 'eutanásia', 'pena de morte', 'homicídio'],
      'familyValues': ['família', 'casamento', 'adoção', 'menor', 'criança', 'educação sexual'],
      'moralIntegrity': ['corrupção', 'transparência', 'ética', 'improbidade', 'lavagem'],
      'socialResponsibility': ['social', 'pobreza', 'desigualdade', 'vulnerável', 'assistência'],
      'religiousFreedom': ['religião', 'culto', 'igreja', 'templo', 'liberdade religiosa'],
    };

    const materiasPorCriterio = new Map<string, SenadoMateria[]>();

    for (const [criterio, keywords] of Object.entries(criteriosKeywords)) {
      console.log(`Buscando matérias para o critério: ${criterio}`);
      
      const materias = await this.buscarMateriasPorPalavrasChave(keywords);
      materiasPorCriterio.set(criterio, materias);
      
      console.log(`Encontradas ${materias.length} matérias para ${criterio}`);
    }

    return materiasPorCriterio;
  }
}