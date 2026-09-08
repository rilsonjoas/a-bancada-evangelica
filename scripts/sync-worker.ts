import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { syncCamara, CamaraSyncService } from './sync-camara';
import { syncSenado, SenadoSyncService } from './sync-senado';
import { runQualityChecks } from './quality-check';

const execFileAsync = promisify(execFile);
const prisma = new PrismaClient();

// ── Eixo 1 do PLANO-OPERACAO-SUSTENTAVEL.md — frescor + alerta de falha ──────
//
// Mesmo padrão já em produção em hetzner-infra/backup/backup.sh: cada job
// manda um ping opcional pro Uptime Kuma ao terminar (status=up/down). O
// Uptime Kuma já tem alerta real (Telegram + e-mail) configurado — nenhum
// código de alerta novo aqui, só reaproveitar infra que já roda. Sem URL
// configurada na env = no-op silencioso, nunca quebra o job em si.
const UPTIME_KUMA_PUSH_ENV: Record<string, string> = {
  'daily-politicians-sync': 'UPTIME_KUMA_PUSH_URL_POLITICIANS',
  'daily-news-sync': 'UPTIME_KUMA_PUSH_URL_NEWS',
  'daily-score-calculation': 'UPTIME_KUMA_PUSH_URL_SCORES',
  'weekly-expenses-sync': 'UPTIME_KUMA_PUSH_URL_EXPENSES',
  'weekly-expense-analysis': 'UPTIME_KUMA_PUSH_URL_EXPENSE_ANALYSIS',
  'monthly-log-cleanup': 'UPTIME_KUMA_PUSH_URL_LOG_CLEANUP',
};

async function pingUptimeKuma(envVar: string, opts: { status?: 'up' | 'down'; msg?: string } = {}): Promise<void> {
  const url = process.env[envVar];
  if (!url) return; // monitor ainda não criado/configurado — silencioso de propósito

  const { status = 'up', msg = 'OK' } = opts;
  const separator = url.includes('?') ? '&' : '?';
  const target = `${url}${separator}status=${status}&msg=${encodeURIComponent(msg)}`;

  try {
    await fetch(target, { signal: AbortSignal.timeout(10_000) });
  } catch (err) {
    // Falha de push não deve derrubar o job real — só registra e segue.
    console.error(`⚠️ Push pro Uptime Kuma falhou (${envVar}):`, err instanceof Error ? err.message : err);
  }
}

// Eixo 2 do plano — capacidade de curadoria da fila de notícias.
//
// Decisão do Rilson (2026-09-08): curadoria por EVENTO (quando o alerta
// disparar), não por calendário fixo — ele não tem como ficar revisando
// isso com frequência, e o sistema não exige: PENDING nunca aparece pro
// público, então não curar por um tempo só significa "menos conteúdo
// publicado", nunca "conteúdo errado publicado". Defaults tolerantes de
// propósito, pra alertar raramente.
const CURATION_QUEUE_ALERT_THRESHOLD = Number(process.env.CURATION_QUEUE_ALERT_THRESHOLD ?? 150);
const CURATION_QUEUE_STALE_DAYS = Number(process.env.CURATION_QUEUE_STALE_DAYS ?? 120);

interface SyncSchedule {
  name: string;
  cronExpression: string;
  description: string;
  task: () => Promise<void>;
  enabled: boolean;
}

class SyncWorkerService {
  private schedules: SyncSchedule[] = [];
  private isRunning = false;

  constructor() {
    this.setupSchedules();
  }

  private setupSchedules(): void {
    // Sincronização diária dos políticos (03:00)
    this.schedules.push({
      name: 'daily-politicians-sync',
      cronExpression: '0 3 * * *',
      description: 'Sincronização diária de dados dos políticos',
      task: async () => {
        console.log('🔄 Iniciando sincronização diária de políticos...');
        await this.syncPoliticiansData();
      },
      enabled: true
    });

    // Sincronização semanal de gastos (domingo às 04:00)
    this.schedules.push({
      name: 'weekly-expenses-sync',
      cronExpression: '0 4 * * 0',
      description: 'Sincronização semanal de gastos parlamentares',
      task: async () => {
        console.log('💰 Iniciando sincronização semanal de gastos...');
        await this.syncExpensesData();
      },
      enabled: true
    });

    // Menções na imprensa (todo dia às 03:30, entre políticos e scores).
    //
    // Achado real (2026-09-08): scripts/sync-news.ts existia desde #7
    // (2026-08-28) mas nunca esteve no cron — só rodava quando alguém
    // digitava `pnpm sync:news` manualmente. Isso ia direto contra a
    // "Tarefa contínua de curadoria" já registrada no ROADMAP, e ficaria
    // pior justo no mês que mais importa: 1º turno em 04/10/2026 é quando
    // o volume de matéria sobre cada parlamentar mais cresce.
    //
    // Sem --limit/--state: processa todo mundo is_active, igual aos
    // outros jobs diários. Google News RSS não usa API key (comentário
    // original do script) — se começar a bloquear/rate-limitar por volume
    // diário, é sinal de reduzir frequência ou aplicar --state por
    // rodízio, não de insistir sem ajuste.
    this.schedules.push({
      name: 'daily-news-sync',
      cronExpression: '30 3 * * *',
      description: 'Busca diária de menções na imprensa (fila de curadoria)',
      task: async () => {
        console.log('📰 Iniciando busca diária de menções na imprensa...');
        try {
          const { stdout, stderr } = await execFileAsync('pnpm', ['sync:news'], {
            cwd: process.cwd(),
            maxBuffer: 1024 * 1024 * 10,
          });
          if (stdout) console.log(stdout);
          if (stderr) console.error(stderr);
          console.log('✅ Busca de menções concluída');
        } catch (error) {
          console.error('❌ Erro na busca de menções na imprensa:', error);
          throw error;
        }

        // Eixo 2 do plano (2026-09-08): a busca agora é automática, mas a
        // decisão de aprovar/rejeitar continua 100% humana por decisão de
        // produto — o que pode crescer sem controle é a FILA. Duas
        // salvaguardas pra ela não virar um backlog impossível se a
        // curadoria ficar parada um tempo:
        await this.manageCurationQueue();
      },
      enabled: true
    });

    // Recálculo de pontuações (todo dia às 05:00)
    this.schedules.push({
      name: 'daily-score-calculation',
      cronExpression: '0 5 * * *',
      description: 'Recálculo diário das pontuações',
      task: async () => {
        console.log('📊 Iniciando recálculo de pontuações...');
        await this.recalculateAllScores();
      },
      enabled: true
    });

    // Análise de despesas suspeitas (segunda-feira às 06:00)
    this.schedules.push({
      name: 'weekly-expense-analysis',
      cronExpression: '0 6 * * 1',
      description: 'Análise semanal de despesas suspeitas',
      task: async () => {
        console.log('🔍 Iniciando análise de despesas suspeitas...');
        await this.analyzeExpenses();
      },
      enabled: true
    });

    // Limpeza de logs antigos (primeiro dia do mês às 02:00)
    this.schedules.push({
      name: 'monthly-log-cleanup',
      cronExpression: '0 2 1 * *',
      description: 'Limpeza mensal de logs antigos',
      task: async () => {
        console.log('🧹 Iniciando limpeza de logs antigos...');
        await this.cleanupOldLogs();
      },
      enabled: true
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Worker já está em execução');
      return;
    }

    console.log('🚀 Iniciando Sync Worker Service...');
    this.isRunning = true;

    // Registrar todas as tarefas agendadas
    for (const schedule of this.schedules) {
      if (schedule.enabled) {
        cron.schedule(schedule.cronExpression, async () => {
          const pushEnvVar = UPTIME_KUMA_PUSH_ENV[schedule.name];
          try {
            console.log(`⏰ Executando tarefa agendada: ${schedule.name}`);
            await schedule.task();
            console.log(`✅ Tarefa concluída: ${schedule.name}`);
            if (pushEnvVar) await pingUptimeKuma(pushEnvVar, { status: 'up', msg: `${schedule.name} concluída` });
          } catch (error) {
            console.error(`❌ Erro na tarefa ${schedule.name}:`, error);
            await this.logError(schedule.name, error);
            if (pushEnvVar) {
              await pingUptimeKuma(pushEnvVar, {
                status: 'down',
                msg: error instanceof Error ? error.message : String(error),
              });
            }
          }
        });

        console.log(`📅 Agendamento configurado: ${schedule.name} (${schedule.cronExpression})`);
      }
    }

    console.log('✅ Sync Worker Service iniciado com sucesso!');
    console.log('📋 Tarefas agendadas:');
    
    this.schedules
      .filter(s => s.enabled)
      .forEach(s => {
        console.log(`   - ${s.name}: ${s.description} (${s.cronExpression})`);
      });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Worker não está em execução');
      return;
    }

    console.log('🛑 Parando Sync Worker Service...');
    
    // Parar todas as tarefas agendadas
    cron.getTasks().forEach((task, name) => {
      console.log(`⏹️ Parando tarefa: ${name}`);
      task.stop();
    });

    this.isRunning = false;
    console.log('✅ Sync Worker Service parado');
  }

  // Métodos de sincronização
  private async syncPoliticiansData(): Promise<void> {
    try {
      console.log('📥 Sincronizando dados da Câmara...');
      await syncCamara();
      
      console.log('📥 Sincronizando dados do Senado...');
      await syncSenado();
      
      console.log('🔍 Rodando data quality checks...');
      await runQualityChecks();
      
      console.log('✅ Sincronização de políticos concluída');
    } catch (error) {
      console.error('❌ Erro na sincronização de políticos:', error);
      throw error;
    }
  }

  private async syncExpensesData(): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();
      
      // Buscar todos os políticos ativos
      const politicians = await prisma.politician.findMany({
        where: { is_active: true }
      });

      console.log(`💰 Sincronizando gastos de ${politicians.length} políticos para ${currentYear}...`);

      const camaraService = new CamaraSyncService();
      const senadoService = new SenadoSyncService();

      for (const politician of politicians) {
        try {
          if (politician.current_house === 'CAMARA' && politician.legislature_id) {
            await camaraService.syncGastos(parseInt(politician.legislature_id), currentYear);
          } else if (politician.current_house === 'SENADO' && politician.legislature_id) {
            await senadoService.syncGastos(politician.legislature_id, currentYear);
          }
          
          // Delay para não sobrecarregar as APIs
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`❌ Erro ao sincronizar gastos de ${politician.name}:`, error);
        }
      }

      console.log('✅ Sincronização de gastos concluída');
    } catch (error) {
      console.error('❌ Erro na sincronização de gastos:', error);
      throw error;
    }
  }

  private async recalculateAllScores(): Promise<void> {
    // Chama scripts/recalculate-scores.ts (mesmo motor testado em
    // criteriaEngine.test.ts, pesos publicados na Metodologia:
    // 30/25/20/15/10) via subprocesso, em vez de duplicar a lógica de
    // pontuação aqui dentro.
    //
    // Achado real (2026-08-20): a versão anterior deste método tinha sua
    // própria fórmula, com pesos diferentes (25/20/20/10/5 + 20% de
    // "outros critérios" que não existe na Metodologia) e a maioria dos
    // critérios FIXOS pra todo mundo — life_protection, family_values e
    // religious_freedom nunca olhavam voto real nenhum. Isso ia rodar
    // todo dia às 5h e sobrescrever os scores reais e calculados com
    // esses valores genéricos, incompatíveis com o que o site publica
    // como metodologia. Rodar via subprocesso também evita duplicar o
    // ciclo de vida do PrismaClient do script real (ele já gerencia
    // conexão/desconexão sozinho).
    try {
      console.log('📊 Recalculando pontuações via scripts/recalculate-scores.ts...');
      const { stdout, stderr } = await execFileAsync('pnpm', ['scores:recalculate'], {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10,
      });
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      console.log('✅ Recálculo de pontuações concluído');
    } catch (error) {
      console.error('❌ Erro no recálculo de pontuações:', error);
      throw error;
    }
  }

  private async analyzeExpenses(): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();
      
      // Buscar todos os políticos com gastos no ano atual
      const politicians = await prisma.politician.findMany({
        where: { 
          is_active: true,
          expenses: {
            some: { year: currentYear }
          }
        },
        include: {
          expenses: {
            where: { year: currentYear }
          }
        }
      });

      console.log(`🔍 Analisando gastos de ${politicians.length} políticos para ${currentYear}...`);

      for (const politician of politicians) {
        try {
          await this.generateExpenseAnalysis(politician);
        } catch (error) {
          console.error(`❌ Erro ao analisar gastos de ${politician.name}:`, error);
        }
      }

      console.log('✅ Análise de gastos concluída');
    } catch (error) {
      console.error('❌ Erro na análise de gastos:', error);
      throw error;
    }
  }

  private async generateExpenseAnalysis(politician: any): Promise<void> {
    const expenses = politician.expenses;
    const currentYear = new Date().getFullYear();

    // Agrupar gastos por mês
    const monthlyExpenses = expenses.reduce((acc: any, expense: any) => {
      const key = `${expense.year}-${expense.month}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(expense);
      return acc;
    }, {});

    // Criar análise para cada mês
    for (const [monthKey, monthExpenses] of Object.entries(monthlyExpenses)) {
      const [year, month] = monthKey.split('-').map(Number);
      const expenses = monthExpenses as any[];

      const totalValue = expenses.reduce((sum, e) => sum + e.net_value, 0);
      const suspiciousExpenses = expenses.filter(e => e.is_suspicious);
      const suspiciousValue = suspiciousExpenses.reduce((sum, e) => sum + e.net_value, 0);
      const suspiciousCount = suspiciousExpenses.length;
      const suspiciousPercentage = expenses.length > 0 ? (suspiciousCount / expenses.length) * 100 : 0;

      // Calcular score de integridade (0-100)
      let integrityScore = 100;
      if (suspiciousPercentage > 50) integrityScore -= 40;
      else if (suspiciousPercentage > 25) integrityScore -= 25;
      else if (suspiciousPercentage > 10) integrityScore -= 15;

      if (totalValue > 50000) integrityScore -= 10; // Gastos muito altos
      if (suspiciousValue > totalValue * 0.5) integrityScore -= 20; // Mais de 50% do valor suspeito

      // Determinar nível de risco
      let riskLevel;
      if (integrityScore >= 80) riskLevel = 'LOW';
      else if (integrityScore >= 60) riskLevel = 'MEDIUM';
      else if (integrityScore >= 40) riskLevel = 'HIGH';
      else riskLevel = 'CRITICAL';

      // Gerar flags de alerta
      const flags = [];
      if (suspiciousPercentage > 25) flags.push('ALTO_PERCENTUAL_SUSPEITO');
      if (totalValue > 100000) flags.push('GASTOS_ELEVADOS');
      if (suspiciousValue > 25000) flags.push('VALOR_SUSPEITO_ALTO');
      if (expenses.some(e => !e.supplier_name)) flags.push('FORNECEDOR_NAO_IDENTIFICADO');

      // Criar ou atualizar análise
      await prisma.expenseAnalysis.upsert({
        where: {
          politician_id_year_month_source: {
            politician_id: politician.id,
            year,
            month,
            source: politician.current_house === 'CAMARA' ? 'CAMARA' : 'SENADO'
          }
        },
        update: {
          total_value: totalValue,
          suspicious_value: suspiciousValue,
          suspicious_count: suspiciousCount,
          suspicious_percentage: suspiciousPercentage,
          integrity_score: Math.max(0, integrityScore),
          risk_level: riskLevel,
          flags,
          analysis_date: new Date()
        },
        create: {
          politician_id: politician.id,
          year,
          month,
          total_value: totalValue,
          suspicious_value: suspiciousValue,
          suspicious_count: suspiciousCount,
          suspicious_percentage: suspiciousPercentage,
          integrity_score: Math.max(0, integrityScore),
          risk_level: riskLevel,
          flags,
          source: politician.current_house === 'CAMARA' ? 'CAMARA' : 'SENADO'
        }
      });
    }
  }

  /**
   * Eixo 2 do PLANO-OPERACAO-SUSTENTAVEL.md — capacidade de curadoria.
   *
   * Duas salvaguardas, nenhuma delas decide "aprovar" ou "rejeitar" no
   * sentido editorial (isso continua exclusivamente humano, na área de
   * curadoria) — só protegem a FILA em si de virar um problema:
   *
   * 1. Expira PENDING esquecido há mais de CURATION_QUEUE_STALE_DAYS
   *    (padrão 90) sem revisão. Sem isso, ficar semanas sem curar =
   *    culpa acumulando sem limite; com isso, a fila se autolimpa mesmo
   *    se a curadoria ficar parada um tempo. Motivo fica registrado no
   *    SyncLog (details), não numa coluna nova em NewsMention — mesmo
   *    padrão de auditoria que H6 já usa pra diff de scores, sem exigir
   *    migração de schema.
   * 2. Reporta a saúde da fila pro Uptime Kuma: status=down (dispara
   *    alerta real, Telegram/e-mail) se PENDING passar de
   *    CURATION_QUEUE_ALERT_THRESHOLD (padrão 50) — em vez de você
   *    descobrir o backlog só quando abrir a página por acaso.
   */
  private async manageCurationQueue(): Promise<void> {
    const cutoff = new Date(Date.now() - CURATION_QUEUE_STALE_DAYS * 24 * 60 * 60 * 1000);

    try {
      const stale = await prisma.newsMention.findMany({
        where: { status: 'PENDING', created_at: { lt: cutoff } },
        select: { id: true, title: true, politician_id: true },
      });

      if (stale.length > 0) {
        await prisma.newsMention.updateMany({
          where: { id: { in: stale.map((s) => s.id) } },
          data: { status: 'REJECTED', reviewed_at: new Date() },
        });

        await prisma.syncLog.create({
          data: {
            sync_type: 'NEWS',
            source: 'MANUAL',
            status: 'SUCCESS',
            start_time: new Date(),
            end_time: new Date(),
            records_processed: stale.length,
            records_updated: stale.length,
            details: {
              action: 'auto_expire_stale_pending',
              reason: `PENDING sem revisão humana há mais de ${CURATION_QUEUE_STALE_DAYS} dias`,
              expiredIds: stale.map((s) => s.id),
            },
          },
        });

        console.log(`🗑️ ${stale.length} menções expiradas automaticamente (PENDING > ${CURATION_QUEUE_STALE_DAYS} dias)`);
      }

      const pendingCount = await prisma.newsMention.count({ where: { status: 'PENDING' } });
      console.log(`📋 Fila de curadoria: ${pendingCount} pendentes (limite de alerta: ${CURATION_QUEUE_ALERT_THRESHOLD})`);

      await pingUptimeKuma('UPTIME_KUMA_PUSH_URL_CURATION_QUEUE', {
        status: pendingCount > CURATION_QUEUE_ALERT_THRESHOLD ? 'down' : 'up',
        msg: `${pendingCount} pendentes na fila de curadoria`,
      });
    } catch (error) {
      // Falha aqui não deve derrubar o job de busca de notícias, que já
      // terminou com sucesso antes desta etapa rodar.
      console.error('❌ Erro ao gerenciar a fila de curadoria:', error);
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const deleted = await prisma.syncLog.deleteMany({
        where: {
          created_at: {
            lt: threeMonthsAgo
          }
        }
      });

      console.log(`🧹 Removidos ${deleted.count} logs antigos`);
    } catch (error) {
      console.error('❌ Erro na limpeza de logs:', error);
      throw error;
    }
  }

  private async logError(taskName: string, error: any): Promise<void> {
    try {
      await prisma.syncLog.create({
        data: {
          sync_type: 'POLITICIANS', // Tipo genérico para erros de worker
          source: 'MANUAL',
          status: 'ERROR',
          start_time: new Date(),
          end_time: new Date(),
          records_processed: 0,
          records_inserted: 0,
          records_updated: 0,
          records_failed: 1,
          error_message: `Worker Error in ${taskName}: ${error.message}`,
          details: {
            task: taskName,
            stack: error.stack,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (logError) {
      console.error('❌ Erro ao registrar log de erro:', logError);
    }
  }

  // Método para executar tarefas manualmente
  async runTask(taskName: string): Promise<void> {
    const schedule = this.schedules.find(s => s.name === taskName);
    if (!schedule) {
      throw new Error(`Tarefa não encontrada: ${taskName}`);
    }

    console.log(`🔄 Executando tarefa manual: ${taskName}`);
    await schedule.task();
    console.log(`✅ Tarefa manual concluída: ${taskName}`);
  }

  // Método para listar tarefas disponíveis
  listTasks(): SyncSchedule[] {
    return this.schedules.map(s => ({
      ...s,
      task: undefined as any // Não retornar a função
    }));
  }
}

// Instância singleton do worker
const syncWorker = new SyncWorkerService();

// Função para iniciar o worker
async function startSyncWorker() {
  try {
    await syncWorker.start();
    
    // Manter o processo rodando
    process.on('SIGTERM', async () => {
      console.log('📨 Recebido SIGTERM, parando worker...');
      await syncWorker.stop();
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('📨 Recebido SIGINT, parando worker...');
      await syncWorker.stop();
      await prisma.$disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar worker:', error);
    process.exit(1);
  }
}

// Execute if this file is run directly
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === 'run' && args[1]) {
    // Executar tarefa específica
    await syncWorker.runTask(args[1]);
  } else if (args[0] === 'list') {
    // Listar tarefas disponíveis
    console.log('📋 Tarefas disponíveis:');
    syncWorker.listTasks().forEach(task => {
      console.log(`   - ${task.name}: ${task.description} (${task.cronExpression})`);
    });
  } else {
    // Iniciar worker completo
    await startSyncWorker();
  }
}

// Run main if this file is executed directly
main().catch((error) => {
  console.error(error);
  process.exit(1);
});

export { SyncWorkerService, syncWorker };