import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

const prisma = new PrismaClient();

// Interface para dados da API do Senado
interface SenadoSenador {
  CodigoParlamentar: string;
  CodigoPublicoNaLegislatura: string;
  NomeParlamentar: string;
  NomeCompletoParlamentar: string;
  SexoParlamentar: string;
  FormaTratamento: string;
  UrlFotoParlamentar: string;
  UrlPaginaParlamentar: string;
  UrlPaginaParticular: string;
  EmailParlamentar: string;
  SiglaPartidoParlamentar: string;
  UfParlamentar: string;
}

interface SenadoSenadorDetalhado {
  CodigoParlamentar: string;
  CodigoPublicoNaLegislatura: string;
  NomeParlamentar: string;
  NomeCompletoParlamentar: string;
  CpfParlamentar: string;
  DataNascimento: string;
  UfNascimento: string;
  NaturalMunicipio: string;
  Escolaridade: string;
  FormaTratamento: string;
  UrlFotoParlamentar: string;
  UrlPaginaParlamentar: string;
  EmailParlamentar: string;
  SiglaPartidoParlamentar: string;
  UfParlamentar: string;
  Mandatos: {
    Mandato: Array<{
      CodigoMandato: string;
      UfMandato: string;
      PrimeiroAnoMandato: string;
      SegundoAnoMandato: string;
      DescricaoParticipacao: string;
    }>;
  };
}

interface SenadoGasto {
  Ano: number;
  Mes: number;
  TipoDespesa: string;
  CodDocumento: number;
  DataDocumento: string;
  NumDocumento: string;
  Valor: number;
  Fornecedor: string;
  CNPJCPF: string;
}

class SenadoSyncService {
  private readonly baseUrl = 'https://legis.senado.leg.br/dadosabertos/senador';
  private readonly currentLegislature = 57; // 2023-2027

  async syncAllSenadores(): Promise<void> {
    console.log('🏛️ Iniciando sincronização com API do Senado Federal...');

    try {
      // Buscar lista de senadores ativos
      const response = await fetch(`${this.baseUrl}/lista/atual`);

      if (!response.ok) {
        throw new Error(`Erro na API do Senado: ${response.status} ${response.statusText}`);
      }

      // Parse XML para JSON
      const xmlText = await response.text();
      const data = await parseStringPromise(xmlText);

      // Navegar pela estrutura XML parseada
      const parlamentares = data.ListaParlamentarEmExercicio?.Parlamentares?.[0]?.Parlamentar || [];

      const senadores = parlamentares.map((p: any) => {
        const id = p.IdentificacaoParlamentar?.[0] || {};
        return {
          CodigoParlamentar: id.CodigoParlamentar?.[0] || '',
          CodigoPublicoNaLegislatura: id.CodigoPublicoNaLegAtual?.[0] || '',
          NomeParlamentar: id.NomeParlamentar?.[0] || '',
          NomeCompletoParlamentar: id.NomeCompletoParlamentar?.[0] || '',
          SexoParlamentar: id.SexoParlamentar?.[0] || '',
          FormaTratamento: id.FormaTratamento?.[0] || '',
          UrlFotoParlamentar: id.UrlFotoParlamentar?.[0] || '',
          UrlPaginaParlamentar: id.UrlPaginaParlamentar?.[0] || '',
          UrlPaginaParticular: id.UrlPaginaParticular?.[0] || '',
          EmailParlamentar: id.EmailParlamentar?.[0] || '',
          SiglaPartidoParlamentar: id.SiglaPartidoParlamentar?.[0] || '',
          UfParlamentar: id.UfParlamentar?.[0] || '',
        };
      });
      console.log(`📊 Encontrados ${senadores.length} senadores na legislatura atual`);

      let processed = 0;
      let inserted = 0;
      let updated = 0;
      let failed = 0;

      // Processar cada senador
      for (const senador of senadores) {
        try {
          console.log(`📋 Processando: ${senador.NomeParlamentar} (${senador.SiglaPartidoParlamentar}/${senador.UfParlamentar})`);
          
          // Buscar detalhes completos do senador
          const detailsResponse = await fetch(`${this.baseUrl}/${senador.CodigoParlamentar}`);
          if (!detailsResponse.ok) {
            console.log(`⚠️ Erro ao buscar detalhes de ${senador.NomeParlamentar}: ${detailsResponse.status}`);
            failed++;
            continue;
          }

          // Parse XML dos detalhes
          const detailsXml = await detailsResponse.text();
          const detailsData = await parseStringPromise(detailsXml);

          const detalheParlamentar = detailsData.DetalheParlamentar?.Parlamentar?.[0] || {};
          const idDetalhes = detalheParlamentar.IdentificacaoParlamentar?.[0] || {};
          const dadosBasicos = detalheParlamentar.DadosBasicosParlamentar?.[0] || {};

const senadorCompleto = {
            CodigoParlamentar: idDetalhes.CodigoParlamentar?.[0] || senador.CodigoParlamentar,
            CodigoPublicoNaLegislatura: idDetalhes.CodigoPublicoNaLegAtual?.[0] || '',
            NomeParlamentar: idDetalhes.NomeParlamentar?.[0] || senador.NomeParlamentar,
            NomeCompletoParlamentar: idDetalhes.NomeCompletoParlamentar?.[0] || senador.NomeCompletoParlamentar,
            CpfParlamentar: dadosBasicos.CpfParlamentar?.[0] || null,
            DataNascimento: dadosBasicos.DataNascimento?.[0] || null,
            UfNascimento: dadosBasicos.UfNascimento?.[0] || null,
            NaturalMunicipio: dadosBasicos.NaturalMunicipio?.[0] || null,
            Escolaridade: dadosBasicos.Escolaridade?.[0] || null,
            FormaTratamento: idDetalhes.FormaTratamento?.[0] || senador.FormaTratamento,
            UrlFotoParlamentar: idDetalhes.UrlFotoParlamentar?.[0] || senador.UrlFotoParlamentar,
            UrlPaginaParlamentar: idDetalhes.UrlPaginaParlamentar?.[0] || senador.UrlPaginaParlamentar,
            EmailParlamentar: idDetalhes.EmailParlamentar?.[0] || senador.EmailParlamentar,
            SiglaPartidoParlamentar: idDetalhes.SiglaPartidoParlamentar?.[0] || senador.SiglaPartidoParlamentar,
            UfParlamentar: idDetalhes.UfParlamentar?.[0] || senador.UfParlamentar,
            Mandatos: { Mandato: [] as any[] },
          };

          // Verificar se já existe no banco (guarda: só casa SENADO; cpf só se não for null)
          const whereClause: any = {
            current_house: 'SENADO',
            OR: [
              { legislature_id: senador.CodigoParlamentar }
            ]
          };
          if (senadorCompleto.CpfParlamentar) {
            whereClause.OR.push({ cpf: senadorCompleto.CpfParlamentar });
          }

          const existing = await prisma.politician.findFirst({
            where: whereClause
          });

          const politicianData = {
            name: senador.NomeParlamentar,
            full_name: senador.NomeCompletoParlamentar,
            cpf: senadorCompleto.CpfParlamentar,
            email: senador.EmailParlamentar,
            photo_url: senador.UrlFotoParlamentar,
            birth_date: senadorCompleto.DataNascimento ? new Date(senadorCompleto.DataNascimento) : null,
            current_party: senador.SiglaPartidoParlamentar,
            current_state: senador.UfParlamentar,
            current_house: 'SENADO' as const,
            legislature_id: senador.CodigoParlamentar,
            official_page_url: senador.UrlPaginaParlamentar,
            social_media_urls: senador.UrlPaginaParticular ? 
              { website: senador.UrlPaginaParticular } : null,
            education_level: senadorCompleto.Escolaridade,
            is_active: true,
          };

          let politician;

          if (existing) {
            // Atualizar existente
            politician = await prisma.politician.update({
              where: { id: existing.id },
              data: politicianData
            });
            updated++;
            console.log(`✅ Atualizado: ${politician.name}`);
          } else {
            // Criar novo
            politician = await prisma.politician.create({
              data: politicianData
            });
            inserted++;
            console.log(`✨ Criado: ${politician.name}`);
          }

          // Criar/atualizar mandatos
          await this.upsertMandates(politician.id, senador, senadorCompleto);

          // Criar score inicial se não existir
          await this.createInitialScore(politician.id);

          processed++;

        } catch (error) {
          console.error(`❌ Erro ao processar ${senador.NomeParlamentar}:`, error);
          failed++;
        }

        // Delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Log do resultado
      await this.logSyncResult('POLITICIANS', 'SENADO', 'SUCCESS', processed, inserted, updated, failed);
      console.log(`🎉 Sincronização concluída: ${processed} processados, ${inserted} criados, ${updated} atualizados, ${failed} falharam`);

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      await this.logSyncResult('POLITICIANS', 'SENADO', 'ERROR', 0, 0, 0, 0, error.message);
      throw error;
    }
  }

  async syncGastos(senadorCodigo: string, year: number = new Date().getFullYear()): Promise<void> {
    console.log(`💰 Sincronizando gastos do senador ${senadorCodigo} para o ano ${year}...`);

    try {
      const response = await fetch(
        `https://legis.senado.leg.br/dadosabertos/senador/${senadorCodigo}/gastos/${year}`
      );

      if (!response.ok) {
        console.log(`⚠️ Erro ao buscar gastos de ${year}: ${response.status}`);
        return;
      }

      const data = await response.json() as {
        GastosParlamentar: {
          Gastos: {
            Gasto: SenadoGasto[]
          }
        }
      };

      if (!data.GastosParlamentar?.Gastos?.Gasto) {
        console.log(`ℹ️ Nenhum gasto encontrado para o senador ${senadorCodigo} em ${year}`);
        return;
      }

      const gastos = Array.isArray(data.GastosParlamentar.Gastos.Gasto) 
        ? data.GastosParlamentar.Gastos.Gasto 
        : [data.GastosParlamentar.Gastos.Gasto];
      
      for (const gasto of gastos) {
        await this.processExpense(senadorCodigo, gasto);
      }

    } catch (error) {
      console.error(`❌ Erro ao sincronizar gastos do senador ${senadorCodigo}:`, error);
      throw error;
    }
  }

  private async upsertMandates(
    politicianId: number, 
    senador: SenadoSenador, 
    _senadorCompleto: SenadoSenadorDetalhado
  ): Promise<void> {
    try {
      const response = await fetch(
        `https://legis.senado.leg.br/dadosabertos/senador/${senador.CodigoParlamentar}/mandatos?v=5`
      );
      if (!response.ok) return;

      const data = await response.json();
      const mandatoData = data?.MandatoParlamentar?.Parlamentar?.Mandatos?.Mandato;
      if (!mandatoData) return;

      const mandatos = Array.isArray(mandatoData) ? mandatoData : [mandatoData];
      const now = new Date();

      for (const mandato of mandatos) {
        const legislaturas = [
          mandato.PrimeiraLegislaturaDoMandato,
          mandato.SegundaLegislaturaDoMandato,
        ].filter(Boolean);

        const partidos = mandato.Partidos?.Partido ?? [];
        const partidosList = Array.isArray(partidos) ? partidos : [partidos];

        for (const leg of legislaturas) {
          const legNum = String(leg.NumeroLegislatura);
          const startDate = new Date(leg.DataInicio);
          const endDate = new Date(leg.DataFim);
          const isCurrent = now >= startDate && now <= endDate;

          // Partido vigente no início da legislatura
          let party = senador.SiglaPartidoParlamentar;
          for (const p of partidosList) {
            const filStart = new Date(p.DataFiliacao);
            const filEnd = p.DataDesfiliacao ? new Date(p.DataDesfiliacao) : new Date('2099-01-01');
            if (filStart <= startDate && filEnd > startDate) {
              party = p.Sigla;
              break;
            }
          }

          await prisma.mandate.upsert({
            where: {
              politician_id_house_legislature: {
                politician_id: politicianId,
                house: 'SENADO',
                legislature: legNum,
              }
            },
            update: {
              party,
              state: mandato.UfParlamentar ?? senador.UfParlamentar,
              is_current: isCurrent,
            },
            create: {
              politician_id: politicianId,
              house: 'SENADO',
              legislature: legNum,
              start_date: startDate,
              end_date: endDate,
              party,
              state: mandato.UfParlamentar ?? senador.UfParlamentar,
              is_current: isCurrent,
              status: 'ACTIVE',
            }
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️ Mandatos de ${senador.NomeParlamentar} ignorados:`, error);
    }
  }

  private async createInitialScore(politicianId: number): Promise<void> {
    const existingScore = await prisma.politicianScore.findUnique({
      where: { politician_id: politicianId }
    });

    if (!existingScore) {
      await prisma.politicianScore.create({
        data: {
          politician_id: politicianId,
          life_protection: 50,
          family_values: 50,
          moral_integrity: 80, // Presunção de inocência
          social_responsibility: 50,
          religious_freedom: 60,
          overall_score: 58, // Média ponderada inicial
          performance_level: 'AVERAGE',
          performance_label: 'Aguardando Análise',
          performance_description: 'Político recém-adicionado, aguardando coleta de dados de votação'
        }
      });
    }
  }

  private async processExpense(senadorCodigo: string, gasto: SenadoGasto): Promise<void> {
    try {
      // Buscar o politician_id pelo legislature_id
      const politician = await prisma.politician.findFirst({
        where: { legislature_id: senadorCodigo }
      });

      if (!politician) {
        console.log(`⚠️ Político não encontrado para legislature_id: ${senadorCodigo}`);
        return;
      }

      // Calcular score de suspeição básico
      const suspicionReasons: string[] = [];
      let suspicionScore = 0;

      // Verificar valores suspeitos (Senado tem valores geralmente maiores)
      if (gasto.Valor > 100000) {
        suspicionReasons.push('Valor muito alto para despesa mensal');
        suspicionScore += 30;
      }

      if (!gasto.CNPJCPF) {
        suspicionReasons.push('Fornecedor sem documento identificador');
        suspicionScore += 15;
      }

      if (!gasto.Fornecedor || gasto.Fornecedor.trim() === '') {
        suspicionReasons.push('Nome do fornecedor não informado');
        suspicionScore += 10;
      }

      await prisma.expense.upsert({
        where: {
          politician_id_year_month_document_number_source: {
            politician_id: politician.id,
            year: gasto.Ano,
            month: gasto.Mes,
            document_number: gasto.NumDocumento || 'SEM_NUMERO',
            source: 'SENADO'
          }
        },
        update: {
          gross_value: gasto.Valor,
          net_value: gasto.Valor, // Senado não tem distinção
          refund_value: 0, // Senado não tem dados de glosa
          supplier_name: gasto.Fornecedor,
          supplier_document: gasto.CNPJCPF,
          is_suspicious: suspicionScore > 20,
          suspicion_reasons: suspicionReasons,
          suspicion_score: Math.min(suspicionScore, 100)
        },
        create: {
          politician_id: politician.id,
          year: gasto.Ano,
          month: gasto.Mes,
          expense_type: gasto.TipoDespesa,
          document_type: 'SENADO_EXPENSE',
          document_number: gasto.NumDocumento || 'SEM_NUMERO',
          document_date: gasto.DataDocumento ? new Date(gasto.DataDocumento) : null,
          gross_value: gasto.Valor,
          net_value: gasto.Valor,
          refund_value: 0,
          supplier_name: gasto.Fornecedor,
          supplier_document: gasto.CNPJCPF,
          supplier_type: gasto.CNPJCPF?.length === 14 ? 'COMPANY' : 'INDIVIDUAL',
          is_suspicious: suspicionScore > 20,
          suspicion_reasons: suspicionReasons,
          suspicion_score: Math.min(suspicionScore, 100),
          source: 'SENADO',
          source_document_id: gasto.CodDocumento.toString()
        }
      });

    } catch (error) {
      console.error(`❌ Erro ao processar gasto:`, error);
    }
  }

  private async logSyncResult(
    syncType: string,
    source: string, 
    status: string,
    processed: number,
    inserted: number,
    updated: number,
    failed: number,
    errorMessage?: string
  ): Promise<void> {
    await prisma.syncLog.create({
      data: {
        sync_type: syncType as any,
        source: source as any,
        status: status as any,
        start_time: new Date(),
        end_time: new Date(),
        records_processed: processed,
        records_inserted: inserted,
        records_updated: updated,
        records_failed: failed,
        error_message: errorMessage,
        details: {
          legislature: this.currentLegislature,
          timestamp: new Date().toISOString()
        }
      }
    });
  }
}

// Função principal para execução
async function syncSenado() {
  const service = new SenadoSyncService();
  
  try {
    await service.syncAllSenadores();
    console.log('✅ Sincronização do Senado concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na sincronização do Senado:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Função para sincronizar gastos de um senador específico
async function syncGastosSenador(senadorCodigo: string, year?: number) {
  const service = new SenadoSyncService();
  
  try {
    await service.syncGastos(senadorCodigo, year);
    console.log(`✅ Sincronização de gastos do senador ${senadorCodigo} concluída!`);
  } catch (error) {
    console.error(`❌ Erro na sincronização de gastos do senador ${senadorCodigo}:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if this file is run directly
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === 'gastos' && args[1]) {
    const senadorCodigo = args[1];
    const year = args[2] ? parseInt(args[2]) : undefined;
    await syncGastosSenador(senadorCodigo, year);
  } else {
    await syncSenado();
  }
}

// Roda main() só se este arquivo for o entry point de verdade — mesma
// correção do sync-camara.ts (achado real 2026-08-20).
// pathToFileURL: o guard antigo (`file://${argv[1]}`) falhava SILENCIOSAMENTE
// em caminhos com espaço/acento (import.meta.url vem percent-encoded) — script
// não rodava e saía 0. Achado real 2026-08-23 rodando da máquina local.
const isEntryPoint = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntryPoint) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { syncSenado, syncGastosSenador, SenadoSyncService };