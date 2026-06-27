// Types para APIs externas - Câmara, Senado e TSE

// ========================================
// CÂMARA DOS DEPUTADOS API TYPES
// ========================================

export interface CamaraDeputado {
  id: number;
  uri: string;
  nome: string;
  siglaPartido: string;
  uriPartido: string;
  siglaUf: string;
  idLegislatura: number;
  urlFoto: string;
  email: string;
}

export interface CamaraProposicao {
  id: number;
  uri: string;
  siglaTipo: string;
  codTipo: number;
  numero: number;
  ano: number;
  ementa: string;
  dataApresentacao: string;
  uriOrgaoNumerador: string;
  statusProposicao: {
    dataHora: string;
    sequencia: number;
    siglaOrgao: string;
    uriOrgao: string;
    regime: string;
    descricaoTramitacao: string;
    codTipoTramitacao: string;
    descricaoSituacao: string;
    codSituacao: number;
    despacho: string;
    url: string;
  };
  uriAutores: string;
  descricaoTipo: string;
  ementaDetalhada: string;
  keywords: string;
  uriPropPrincipal: string;
  uriPropAnterior: string;
  uriPropPosterior: string;
  urlInteiroTeor: string;
  urnFinal: string;
  texto: string;
  justificativa: string;
}

export interface CamaraVotacao {
  id: string;
  uri: string;
  data: string;
  dataHoraRegistro: string;
  siglaOrgao: string;
  uriOrgao: string;
  uriEvento: string;
  proposicoesAfetadas: Array<{
    codProposicao: number;
    uriProposicao: string;
  }>;
  ultimaAberturaVotacao: {
    dataHoraRegistro: string;
    descricao: string;
  };
  ultimaApresentacaoProposicao: {
    dataHoraRegistro: string;
    descricao: string;
  };
  votosSeparadosPorOrientacao: Array<{
    orientacaoVoto: string;
    codTipoVoto: string;
    descricaoVoto: string;
    qtdMembros: number;
  }>;
  orientacoesBancada: Array<{
    codTipoBancada: string;
    siglaPartidoBloco: string;
    orientacaoVoto: string;
  }>;
}

export interface CamaraVoto {
  deputado_: {
    id: number;
    uri: string;
    nome: string;
    siglaPartido: string;
    siglaUf: string;
    idLegislatura: number;
    urlFoto: string;
  };
  tipoVoto: string;
}

export interface CamaraDespesa {
  ano: number;
  mes: number;
  tipoDespesa: string;
  codDocumento: number;
  tipoDocumento: string;
  codTipoDocumento: number;
  dataDocumento: string;
  numDocumento: string;
  valorDocumento: number;
  urlDocumento: string;
  nomeFornecedor: string;
  cnpjCpfFornecedor: string;
  valorLiquido: number;
  valorGlosa: number;
  numRessarcimento: string;
  codLote: number;
  parcela: number;
}

// ========================================
// SENADO FEDERAL API TYPES
// ========================================

export interface SenadoSenador {
  CodigoParlamentar: string;
  CodigoPublicoNaLegislatura: string;
  NomeParlamentar: string;
  NomeCompletoParlamentar: string;
  SexoParlamentar: string;
  FormaTratamento: string;
  UrlFotoParlamentar: string;
  UrlPaginaParlamentar: string;
  EmailParlamentar: string;
  SiglaPartidoParlamentar: string;
  UfParlamentar: string;
}

export interface SenadoMateria {
  CodigoMateria: string;
  SiglaSubtipoMateria: string;
  DescricaoSubtipoMateria: string;
  NumeroMateria: string;
  AnoMateria: string;
  DescricaoObjetivoProcesso: string;
  DescricaoIdentificacaoMateria: string;
  IndicadorTramitando: string;
  DataApresentacao: string;
  DataLeitura: string;
  SiglaAssuntoGeral: string;
  DescricaoAssuntoGeral: string;
  SiglaAssuntoEspecifico: string;
  DescricaoAssuntoEspecifico: string;
  ExplicacaoEmenta: string;
  UrlGlossario: string;
  Ementa: string;
  IndicadorComplementar: string;
  NomeAutor: string;
  SiglaPartidoAutor: string;
  UfAutor: string;
  UrlAutor: string;
}

export interface SenadoVotacao {
  CodigoSessao: string;
  DataSessao: string;
  HoraInicioSessao: string;
  CodigoSessaoLegislativa: string;
  SiglaTipoSessao: string;
  NomeCasaSessao: string;
  CodigoMateria: string;
  IndicadorVotacaoSecreta: string;
  DescricaoVotacao: string;
  DescricaoResultado: string;
  TotalVotosSim: number;
  TotalVotosNao: number;
  TotalVotosAbstencao: number;
  TotalVotosOutros: number;
  VotoParlamentar: Array<{
    CodigoParlamentar: string;
    NomeParlamentar: string;
    SiglaPartido: string;
    UfParlamentar: string;
    DescricaoVoto: string;
  }>;
}

// ========================================
// TSE API TYPES (CSV Import)
// ========================================

export interface TSECandidato {
  ano_eleicao: number;
  tipo_eleicao: string;
  nome_urna: string;
  numero_urna: string;
  cpf: string;
  nome: string;
  data_nascimento: string;
  titulo_eleitor: string;
  sexo: string;
  grau_instrucao: string;
  estado_civil: string;
  nacionalidade: string;
  sigla_uf: string;
  codigo_municipio: string;
  municipio: string;
  codigo_cargo: number;
  cargo: string;
  codigo_situacao_candidato: number;
  situacao_candidato: string;
  codigo_partido: number;
  sigla_partido: string;
  nome_partido: string;
  codigo_legenda: number;
  sigla_legenda: string;
  composicao_legenda: string;
  nome_legenda: string;
  codigo_ocupacao: number;
  ocupacao: string;
  valor_max_gasto_campanha: number;
  situacao_totalizacao: string;
  email_candidato: string;
}

export interface TSEBemCandidato {
  ano_eleicao: number;
  tipo_eleicao: string;
  cpf: string;
  sequencial_candidato: string;
  codigo_tipo_bem: number;
  descricao_tipo_bem: string;
  descricao_bem: string;
  valor_bem: number;
  data_ultima_atualizacao: string;
  hora_ultima_atualizacao: string;
}

export interface TSEPrestacaoContas {
  ano_eleicao: number;
  tipo_eleicao: string;
  cpf_candidato: string;
  sequencial_candidato: string;
  codigo_especie_recurso: number;
  descricao_especie_recurso: string;
  origem_receita: string;
  fonte_recurso: string;
  cnpj_prestador_conta: string;
  data_receita: string;
  valor_receita: number;
  cpf_cnpj_doador: string;
  nome_doador: string;
  nome_doador_receita_federal: string;
  codigo_setor_economico_doador: number;
  setor_economico_doador: string;
  data_prestacao_contas: string;
  sequencial_receita: string;
}

// ========================================
// TIPOS INTERNOS PARA PROCESSAMENTO
// ========================================

export interface PautaChave {
  id: string;
  titulo: string;
  descricao: string;
  criterio: 'familyValues' | 'lifeProtection' | 'moralIntegrity' | 'socialResponsibility' | 'religiousFreedom';
  peso_positivo: number; // Para votos alinhados aos valores
  peso_negativo: number; // Para votos contrários aos valores
  fonte: 'camara' | 'senado';
  fonte_id: string | number; // ID da proposição na API origem
  keywords: string[]; // Para busca automática
  status: 'ativa' | 'arquivada' | 'aprovada' | 'rejeitada';
  data_criacao: string;
  data_atualizacao: string;
}

export interface VotacaoProcessada {
  pauta_id: string;
  politico_id: number;
  voto: 'SIM' | 'NAO' | 'ABSTENCAO' | 'OBSTRUCAO' | 'AUSENTE';
  pontuacao_aplicada: number;
  data_votacao: string;
  fonte: 'camara' | 'senado';
  fonte_votacao_id: string;
}

export interface DespesaProcessada {
  politico_id: number;
  ano: number;
  mes: number;
  valor_total: number;
  valor_suspeito: number; // Baseado em regras de análise
  qtd_despesas_suspeitas: number;
  fonte: 'camara' | 'senado';
  data_processamento: string;
}

export interface SincronizacaoLog {
  id: string;
  tipo: 'deputados' | 'senadores' | 'proposicoes' | 'votacoes' | 'despesas';
  fonte: 'camara' | 'senado' | 'tse';
  status: 'iniciado' | 'sucesso' | 'erro' | 'parcial';
  data_inicio: string;
  data_fim?: string;
  registros_processados: number;
  registros_inseridos: number;
  registros_atualizados: number;
  registros_erro: number;
  mensagem_erro?: string;
  detalhes?: unknown;
}

// ========================================
// TIPOS PARA CONFIGURAÇÃO DE APIS
// ========================================

export interface APIConfig {
  camara: {
    base_url: string;
    rate_limit: number; // requests per minute
    timeout: number;
    retry_attempts: number;
  };
  senado: {
    base_url: string;
    rate_limit: number;
    timeout: number;
    retry_attempts: number;
  };
  tse: {
    base_url: string;
    data_path: string; // Path para downloads
    update_frequency: 'daily' | 'weekly' | 'monthly';
  };
}

export interface WorkerConfig {
  votacoes: {
    enabled: boolean;
    cron_schedule: string; // Ex: '0 */6 * * *' para cada 6 horas
    batch_size: number;
  };
  despesas: {
    enabled: boolean;
    cron_schedule: string;
    meses_analise: number; // Quantos meses para trás analisar
  };
  politicos: {
    enabled: boolean;
    cron_schedule: string;
  };
  tse_sync: {
    enabled: boolean;
    cron_schedule: string;
    eleicoes_monitoradas: number[]; // Anos das eleições para monitorar
  };
}