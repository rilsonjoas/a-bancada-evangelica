// Engine de pontuação baseado nos 5 critérios evangélicos
import { VotacaoProcessada, DespesaProcessada } from '@/types/api';
import { Politician } from '@/types/politician';

export interface CriteriaWeights {
  lifeProtection: number;      // 30%
  familyValues: number;        // 25%
  moralIntegrity: number;      // 20%
  socialResponsibility: number; // 15%
  religiousFreedom: number;    // 10%
}

export interface CriteriaScores {
  lifeProtection: number;
  familyValues: number;
  moralIntegrity: number;
  socialResponsibility: number;
  religiousFreedom: number;
  overall: number;
}

export interface ScoringContext {
  votacoes: VotacaoProcessada[];
  despesas: DespesaProcessada[];
  mandatos: number; // Quantidade de mandatos
  tempo_servico: number; // Anos de serviço
}

export class CriteriaEngine {
  private readonly weights: CriteriaWeights = {
    lifeProtection: 0.30,
    familyValues: 0.25,
    moralIntegrity: 0.20,
    socialResponsibility: 0.15,
    religiousFreedom: 0.10,
  };

  // Valores máximos possíveis para cada critério
  private readonly maxScores: CriteriaWeights = {
    lifeProtection: 100,
    familyValues: 100,
    moralIntegrity: 100,
    socialResponsibility: 100,
    religiousFreedom: 100,
  };

  // ========================================
  // CÁLCULO PRINCIPAL DE PONTUAÇÃO
  // ========================================

  calculateScore(context: ScoringContext): CriteriaScores {
    const lifeProtection = this.calculateLifeProtectionScore(context);
    const familyValues = this.calculateFamilyValuesScore(context);
    const moralIntegrity = this.calculateMoralIntegrityScore(context);
    const socialResponsibility = this.calculateSocialResponsibilityScore(context);
    const religiousFreedom = this.calculateReligiousFreedomScore(context);

    // Cálculo da pontuação geral ponderada
    const overall = Math.round(
      (lifeProtection * this.weights.lifeProtection) +
      (familyValues * this.weights.familyValues) +
      (moralIntegrity * this.weights.moralIntegrity) +
      (socialResponsibility * this.weights.socialResponsibility) +
      (religiousFreedom * this.weights.religiousFreedom)
    );

    return {
      lifeProtection: Math.round(lifeProtection),
      familyValues: Math.round(familyValues),
      moralIntegrity: Math.round(moralIntegrity),
      socialResponsibility: Math.round(socialResponsibility),
      religiousFreedom: Math.round(religiousFreedom),
      overall: Math.max(0, Math.min(100, overall)), // Garantir entre 0-100
    };
  }

  // ========================================
  // PROTEÇÃO À VIDA (30%)
  // ========================================

  private calculateLifeProtectionScore(context: ScoringContext): number {
    const votacoesVida = context.votacoes.filter(v => 
      v.pauta_id.includes('vida') || 
      v.pauta_id.includes('aborto') ||
      v.pauta_id.includes('eutanasia')
    );

    if (votacoesVida.length === 0) {
      return 50; // Pontuação neutra sem dados
    }

    // Soma ponderada dos votos
    const pontuacaoTotal = votacoesVida.reduce((acc, votacao) => {
      return acc + votacao.pontuacao_aplicada;
    }, 0);

    // Normalizar para 0-100
    const pontuacaoBase = Math.max(0, 50 + pontuacaoTotal);
    
    // Aplicar bônus por consistência
    const consistencia = this.calculateConsistency(votacoesVida);
    const bonusConsistencia = consistencia * 10; // Até 10 pontos de bônus

    return Math.min(100, pontuacaoBase + bonusConsistencia);
  }

  // ========================================
  // DEFESA DA FAMÍLIA (25%)
  // ========================================

  private calculateFamilyValuesScore(context: ScoringContext): number {
    const votacoesFamilia = context.votacoes.filter(v => 
      v.pauta_id.includes('familia') || 
      v.pauta_id.includes('casamento') ||
      v.pauta_id.includes('adocao') ||
      v.pauta_id.includes('educacao')
    );

    if (votacoesFamilia.length === 0) {
      return 50; // Pontuação neutra sem dados
    }

    const pontuacaoTotal = votacoesFamilia.reduce((acc, votacao) => {
      return acc + votacao.pontuacao_aplicada;
    }, 0);

    const pontuacaoBase = Math.max(0, 50 + pontuacaoTotal);
    
    // Bônus por propostas pró-família (simulado)
    const bonusPropostas = this.calculateFamilyProposalsBonus(context);

    return Math.min(100, pontuacaoBase + bonusPropostas);
  }

  // ========================================
  // INTEGRIDADE MORAL (20%)
  // ========================================

  private calculateMoralIntegrityScore(context: ScoringContext): number {
    let pontuacao = 80; // Pontuação base alta (presunção de inocência)

    // Análise de despesas suspeitas
    const analiseDespsas = this.analyzeSuspiciousExpenses(context.despesas);
    pontuacao -= analiseDespsas.penalidade;

    // Análise de votações relacionadas à corrupção/transparência
    const votacoesEtica = context.votacoes.filter(v => 
      v.pauta_id.includes('corrupcao') ||
      v.pauta_id.includes('transparencia') ||
      v.pauta_id.includes('etica')
    );

    if (votacoesEtica.length > 0) {
      const pontuacaoEtica = votacoesEtica.reduce((acc, votacao) => {
        return acc + votacao.pontuacao_aplicada;
      }, 0);
      
      pontuacao += pontuacaoEtica / votacoesEtica.length; // Média das votações
    }

    // Bônus por transparência voluntária
    const bonusTransparencia = this.calculateTransparencyBonus(context);
    pontuacao += bonusTransparencia;

    return Math.max(0, Math.min(100, pontuacao));
  }

  // ========================================
  // RESPONSABILIDADE SOCIAL (15%)
  // ========================================

  private calculateSocialResponsibilityScore(context: ScoringContext): number {
    const votacoesSociais = context.votacoes.filter(v => 
      v.pauta_id.includes('social') ||
      v.pauta_id.includes('pobreza') ||
      v.pauta_id.includes('assistencia') ||
      v.pauta_id.includes('vulneravel')
    );

    if (votacoesSociais.length === 0) {
      return 50; // Pontuação neutra sem dados
    }

    const pontuacaoTotal = votacoesSociais.reduce((acc, votacao) => {
      return acc + votacao.pontuacao_aplicada;
    }, 0);

    const pontuacaoBase = Math.max(0, 50 + pontuacaoTotal);

    // Bônus por projetos sociais de autoria (simulado)
    const bonusProjetos = this.calculateSocialProjectsBonus(context);

    return Math.min(100, pontuacaoBase + bonusProjetos);
  }

  // ========================================
  // LIBERDADE RELIGIOSA (10%)
  // ========================================

  private calculateReligiousFreedomScore(context: ScoringContext): number {
    const votacoesReligiosas = context.votacoes.filter(v => 
      v.pauta_id.includes('religiao') ||
      v.pauta_id.includes('culto') ||
      v.pauta_id.includes('religios')
    );

    if (votacoesReligiosas.length === 0) {
      return 60; // Pontuação base positiva (Brasil é majoritariamente cristão)
    }

    const pontuacaoTotal = votacoesReligiosas.reduce((acc, votacao) => {
      return acc + votacao.pontuacao_aplicada;
    }, 0);

    const pontuacaoBase = Math.max(0, 60 + pontuacaoTotal);

    // Bônus por defesa ativa da liberdade religiosa
    const bonusLiberdade = this.calculateReligiousDefenseBonus(context);

    return Math.min(100, pontuacaoBase + bonusLiberdade);
  }

  // ========================================
  // FUNÇÕES AUXILIARES DE ANÁLISE
  // ========================================

  private calculateConsistency(votacoes: VotacaoProcessada[]): number {
    if (votacoes.length <= 1) return 0;

    const votosSim = votacoes.filter(v => v.voto === 'SIM').length;
    const votosNao = votacoes.filter(v => v.voto === 'NAO').length;
    const totalVotosValidos = votosSim + votosNao;

    if (totalVotosValidos === 0) return 0;

    // Consistência é medida pela predominância de um tipo de voto
    const maiorFrequencia = Math.max(votosSim, votosNao);
    return maiorFrequencia / totalVotosValidos;
  }

  private analyzeSuspiciousExpenses(despesas: DespesaProcessada[]): {
    penalidade: number;
    indicadores: string[];
  } {
    let penalidade = 0;
    const indicadores: string[] = [];

    if (despesas.length === 0) {
      return { penalidade, indicadores };
    }

    // Calcular métricas agregadas
    const valorTotalGasto = despesas.reduce((acc, d) => acc + d.valor_total, 0);
    const valorSuspeitoTotal = despesas.reduce((acc, d) => acc + d.valor_suspeito, 0);
    const percentualSuspeito = valorTotalGasto > 0 ? (valorSuspeitoTotal / valorTotalGasto) * 100 : 0;

    // Penalidades baseadas no percentual de gastos suspeitos
    if (percentualSuspeito > 30) {
      penalidade += 40;
      indicadores.push('Alto percentual de gastos suspeitos');
    } else if (percentualSuspeito > 20) {
      penalidade += 25;
      indicadores.push('Percentual moderado de gastos suspeitos');
    } else if (percentualSuspeito > 10) {
      penalidade += 10;
      indicadores.push('Alguns gastos suspeitos identificados');
    }

    // Penalidade por volume excessivo de gastos
    const gastoMedioMensal = valorTotalGasto / despesas.length;
    if (gastoMedioMensal > 40000) { // Mais de R$ 40k/mês
      penalidade += 15;
      indicadores.push('Volume de gastos acima da média');
    }

    return { penalidade, indicadores };
  }

  private calculateTransparencyBonus(context: ScoringContext): number {
    // Simulação de bônus por transparência
    // Em produção, isso viria de dados reais sobre:
    // - Publicação voluntária de agenda
    // - Declarações de patrimônio detalhadas
    // - Participação em audiências públicas
    // - Respostas a questionamentos da mídia
    
    return Math.floor(Math.random() * 5); // 0-5 pontos de bônus
  }

  private calculateFamilyProposalsBonus(context: ScoringContext): number {
    // Simulação de bônus por propostas pró-família
    // Em produção, analisaria projetos de autoria relacionados à família
    
    return Math.floor(Math.random() * 8); // 0-8 pontos de bônus
  }

  private calculateSocialProjectsBonus(context: ScoringContext): number {
    // Simulação de bônus por projetos sociais
    // Em produção, analisaria projetos de autoria com viés social
    
    return Math.floor(Math.random() * 6); // 0-6 pontos de bônus
  }

  private calculateReligiousDefenseBonus(context: ScoringContext): number {
    // Simulação de bônus por defesa da liberdade religiosa
    // Em produção, analisaria ações específicas em defesa da liberdade religiosa
    
    return Math.floor(Math.random() * 7); // 0-7 pontos de bônus
  }

  // ========================================
  // CLASSIFICAÇÃO FINAL
  // ========================================

  classifyPerformance(score: number): {
    level: 'excellent' | 'good' | 'average' | 'poor';
    label: string;
    color: string;
    description: string;
  } {
    if (score >= 80) {
      return {
        level: 'excellent',
        label: 'Excelente',
        color: '#22c55e', // green-500
        description: 'Alinhamento excepcional com valores cristãos e evangélicos'
      };
    } else if (score >= 60) {
      return {
        level: 'good',
        label: 'Bom',
        color: '#eab308', // yellow-500
        description: 'Bom alinhamento com valores cristãos e evangélicos'
      };
    } else if (score >= 40) {
      return {
        level: 'average',
        label: 'Médio',
        color: '#f97316', // orange-500
        description: 'Alinhamento parcial com valores cristãos e evangélicos'
      };
    } else {
      return {
        level: 'poor',
        label: 'Insuficiente',
        color: '#ef4444', // red-500
        description: 'Baixo alinhamento com valores cristãos e evangélicos'
      };
    }
  }

  // ========================================
  // ANÁLISE DETALHADA
  // ========================================

  generateDetailedAnalysis(context: ScoringContext, scores: CriteriaScores): {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    keyVotes: VotacaoProcessada[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Identificar pontos fortes
    if (scores.lifeProtection >= 80) {
      strengths.push('Forte defesa da vida e valores pró-vida');
    }
    if (scores.familyValues >= 80) {
      strengths.push('Comprometimento consistente com valores familiares');
    }
    if (scores.moralIntegrity >= 80) {
      strengths.push('Alta integridade moral e transparência');
    }
    if (scores.socialResponsibility >= 80) {
      strengths.push('Excelente responsabilidade social cristã');
    }
    if (scores.religiousFreedom >= 80) {
      strengths.push('Firme defesa da liberdade religiosa');
    }

    // Identificar pontos fracos
    if (scores.lifeProtection < 50) {
      weaknesses.push('Posicionamento questionável sobre proteção à vida');
    }
    if (scores.familyValues < 50) {
      weaknesses.push('Alinhamento insuficiente com valores familiares tradicionais');
    }
    if (scores.moralIntegrity < 60) {
      weaknesses.push('Questões relacionadas à integridade moral ou transparência');
    }
    if (scores.socialResponsibility < 50) {
      weaknesses.push('Baixo comprometimento com responsabilidade social');
    }
    if (scores.religiousFreedom < 50) {
      weaknesses.push('Posicionamento ambíguo sobre liberdade religiosa');
    }

    // Gerar recomendações
    if (scores.overall < 60) {
      recommendations.push('Revisar posicionamentos em questões de valores cristãos');
      recommendations.push('Buscar maior alinhamento com a comunidade evangélica');
    }
    if (scores.moralIntegrity < 70) {
      recommendations.push('Aumentar transparência e prestação de contas');
    }

    // Identificar votações-chave (as mais impactantes)
    const keyVotes = context.votacoes
      .filter(v => Math.abs(v.pontuacao_aplicada) >= 5)
      .sort((a, b) => Math.abs(b.pontuacao_aplicada) - Math.abs(a.pontuacao_aplicada))
      .slice(0, 5);

    return {
      strengths,
      weaknesses,
      recommendations,
      keyVotes,
    };
  }
}