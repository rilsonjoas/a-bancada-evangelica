import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Interface para dados da API da Câmara
interface CamaraDeputado {
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

interface CamaraDeputadoDetalhado {
  id: number;
  ultimoStatus: {
    id: number;
    uri: string;
    nome: string;
    siglaPartido: string;
    uriPartido: string;
    siglaUf: string;
    idLegislatura: number;
    urlFoto: string;
    email: string;
    data: string;
    nomeEleitoral: string;
    gabinete: {
      nome: string;
      predio: string;
      sala: string;
      andar: string;
      telefone: string;
      email: string;
    };
    situacao: string;
    condicaoEleitoral: string;
    descricaoStatus: string;
  };
  cpf: string;
  sexo: string;
  urlWebsite: string;
  redeSocial: string[];
  dataNascimento: string;
  dataFalecimento: string;
  ufNascimento: string;
  municipioNascimento: string;
  escolaridade: string;
}

interface CamaraGasto {
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

class CamaraSyncService {
  private readonly baseUrl = 'https://dadosabertos.camara.leg.br/api/v2';
  private readonly currentLegislature = 57; // 2023-2027

  async syncAllDeputados(): Promise<void> {
    console.log('🏛️ Iniciando sincronização com API da Câmara dos Deputados...');
    
    try {
      // Buscar lista de deputados ativos
      const response = await fetch(
        `${this.baseUrl}/deputados?idLegislatura=${this.currentLegislature}&ordem=ASC&ordenarPor=nome`
      );
      
      if (!response.ok) {
        throw new Error(`Erro na API da Câmara: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { dados: CamaraDeputado[] };
      console.log(`📊 Encontrados ${data.dados.length} deputados na legislatura atual`);

      let processed = 0;
      let inserted = 0;
      let updated = 0;
      let failed = 0;

      // Processar cada deputado
      for (const deputado of data.dados) {
        try {
          console.log(`📋 Processando: ${deputado.nome} (${deputado.siglaPartido}/${deputado.siglaUf})`);
          
          // Buscar detalhes completos do deputado
          const detailsResponse = await fetch(`${this.baseUrl}/deputados/${deputado.id}`);
          if (!detailsResponse.ok) {
            console.log(`⚠️ Erro ao buscar detalhes de ${deputado.nome}: ${detailsResponse.status}`);
            failed++;
            continue;
          }

          const details = await detailsResponse.json() as { dados: CamaraDeputadoDetalhado };
          const deputadoCompleto = details.dados;

          // Verificar se já existe no banco
          const existing = await prisma.politician.findFirst({
            where: {
              OR: [
                { legislature_id: deputado.id.toString() },
                { cpf: deputadoCompleto.cpf }
              ]
            }
          });

          const politicianData = {
            name: deputadoCompleto.ultimoStatus.nomeEleitoral || deputado.nome,
            full_name: deputado.nome,
            cpf: deputadoCompleto.cpf,
            email: deputado.email || deputadoCompleto.ultimoStatus.gabinete?.email,
            photo_url: deputado.urlFoto,
            birth_date: deputadoCompleto.dataNascimento ? new Date(deputadoCompleto.dataNascimento) : null,
            current_party: deputado.siglaPartido,
            current_state: deputado.siglaUf,
            current_house: 'CAMARA' as const,
            legislature_id: deputado.id.toString(),
            official_page_url: deputadoCompleto.urlWebsite,
            social_media_urls: deputadoCompleto.redeSocial.length > 0 ? 
              { redes: deputadoCompleto.redeSocial } : null,
            education_level: deputadoCompleto.escolaridade,
            is_active: deputadoCompleto.ultimoStatus.situacao === 'Exercício',
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

          // Criar/atualizar mandato atual
          await this.upsertMandate(politician.id, deputado, deputadoCompleto);

          // Criar score inicial se não existir
          await this.createInitialScore(politician.id);

          processed++;

        } catch (error) {
          console.error(`❌ Erro ao processar ${deputado.nome}:`, error);
          failed++;
        }

        // Delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Log do resultado
      await this.logSyncResult('POLITICIANS', 'CAMARA', 'SUCCESS', processed, inserted, updated, failed);
      console.log(`🎉 Sincronização concluída: ${processed} processados, ${inserted} criados, ${updated} atualizados, ${failed} falharam`);

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      await this.logSyncResult('POLITICIANS', 'CAMARA', 'ERROR', 0, 0, 0, 0, error.message);
      throw error;
    }
  }

  async syncGastos(deputadoId: number, year: number = new Date().getFullYear()): Promise<void> {
    console.log(`💰 Sincronizando gastos do deputado ${deputadoId} para o ano ${year}...`);

    try {
      for (let month = 1; month <= 12; month++) {
        console.log(`📅 Processando gastos de ${month}/${year}...`);

        const response = await fetch(
          `${this.baseUrl}/deputados/${deputadoId}/despesas?ano=${year}&mes=${month}&ordem=ASC&ordenarPor=ano`
        );

        if (!response.ok) {
          console.log(`⚠️ Erro ao buscar gastos ${month}/${year}: ${response.status}`);
          continue;
        }

        const data = await response.json() as { dados: CamaraGasto[] };
        
        for (const gasto of data.dados) {
          await this.processExpense(deputadoId, gasto);
        }

        // Delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 200));
      }

    } catch (error) {
      console.error(`❌ Erro ao sincronizar gastos do deputado ${deputadoId}:`, error);
      throw error;
    }
  }

  private async upsertMandate(
    politicianId: number, 
    deputado: CamaraDeputado, 
    deputadoCompleto: CamaraDeputadoDetalhado
  ): Promise<void> {
    await prisma.mandate.upsert({
      where: {
        id: -1 // Vai sempre criar novo por causa do where impossível
      },
      update: {},
      create: {
        politician_id: politicianId,
        house: 'CAMARA',
        party: deputado.siglaPartido,
        state: deputado.siglaUf,
        legislature: deputado.idLegislatura.toString(),
        start_date: new Date('2023-02-01'), // Início da 57ª legislatura
        end_date: new Date('2027-01-31'), // Fim da 57ª legislatura
        is_current: deputadoCompleto.ultimoStatus.situacao === 'Exercício',
        status: deputadoCompleto.ultimoStatus.situacao === 'Exercício' ? 'ACTIVE' : 'SUSPENDED'
      }
    });
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

  private async processExpense(deputadoId: number, gasto: CamaraGasto): Promise<void> {
    try {
      // Buscar o politician_id pelo legislature_id
      const politician = await prisma.politician.findFirst({
        where: { legislature_id: deputadoId.toString() }
      });

      if (!politician) {
        console.log(`⚠️ Político não encontrado para legislature_id: ${deputadoId}`);
        return;
      }

      // Calcular score de suspeição básico
      const suspicionReasons: string[] = [];
      let suspicionScore = 0;

      // Verificar valores suspeitos
      if (gasto.valorLiquido > 50000) {
        suspicionReasons.push('Valor muito alto para despesa mensal');
        suspicionScore += 30;
      }

      if (gasto.valorGlosa > 0) {
        suspicionReasons.push('Possui valor glosado');
        suspicionScore += 20;
      }

      if (!gasto.cnpjCpfFornecedor) {
        suspicionReasons.push('Fornecedor sem documento identificador');
        suspicionScore += 15;
      }

      await prisma.expense.upsert({
        where: {
          politician_id_year_month_document_number_source: {
            politician_id: politician.id,
            year: gasto.ano,
            month: gasto.mes,
            document_number: gasto.numDocumento || 'SEM_NUMERO',
            source: 'CAMARA'
          }
        },
        update: {
          gross_value: gasto.valorDocumento,
          net_value: gasto.valorLiquido,
          refund_value: gasto.valorGlosa,
          supplier_name: gasto.nomeFornecedor,
          supplier_document: gasto.cnpjCpfFornecedor,
          is_suspicious: suspicionScore > 20,
          suspicion_reasons: suspicionReasons,
          suspicion_score: Math.min(suspicionScore, 100)
        },
        create: {
          politician_id: politician.id,
          year: gasto.ano,
          month: gasto.mes,
          expense_type: gasto.tipoDespesa,
          document_type: gasto.tipoDocumento,
          document_number: gasto.numDocumento || 'SEM_NUMERO',
          document_date: gasto.dataDocumento ? new Date(gasto.dataDocumento) : null,
          gross_value: gasto.valorDocumento,
          net_value: gasto.valorLiquido,
          refund_value: gasto.valorGlosa,
          supplier_name: gasto.nomeFornecedor,
          supplier_document: gasto.cnpjCpfFornecedor,
          supplier_type: gasto.cnpjCpfFornecedor?.length === 14 ? 'COMPANY' : 'INDIVIDUAL',
          is_suspicious: suspicionScore > 20,
          suspicion_reasons: suspicionReasons,
          suspicion_score: Math.min(suspicionScore, 100),
          source: 'CAMARA',
          source_document_id: gasto.codDocumento.toString(),
          document_url: gasto.urlDocumento
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
async function syncCamara() {
  const service = new CamaraSyncService();
  
  try {
    await service.syncAllDeputados();
    console.log('✅ Sincronização da Câmara concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na sincronização da Câmara:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Função para sincronizar gastos de um deputado específico
async function syncGastosDeputado(deputadoId: number, year?: number) {
  const service = new CamaraSyncService();
  
  try {
    await service.syncGastos(deputadoId, year);
    console.log(`✅ Sincronização de gastos do deputado ${deputadoId} concluída!`);
  } catch (error) {
    console.error(`❌ Erro na sincronização de gastos do deputado ${deputadoId}:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if this file is run directly
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === 'gastos' && args[1]) {
    const deputadoId = parseInt(args[1]);
    const year = args[2] ? parseInt(args[2]) : undefined;
    await syncGastosDeputado(deputadoId, year);
  } else {
    await syncCamara();
  }
}

// Roda main() só se este arquivo for o entry point de verdade — sem essa
// guarda, apenas IMPORTAR este módulo (ex.: sync-worker.ts faz isso) já
// disparava uma sincronização completa como efeito colateral (achado real
// 2026-08-20, ao testar o worker antes de ligar em produção).
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { syncCamara, syncGastosDeputado, CamaraSyncService };