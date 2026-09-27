import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { syncCamara, CamaraSyncService } from './sync-camara';
import { syncSenado, SenadoSyncService } from './sync-senado';
import { runQualityChecks } from './quality-check';
import {
  junkReason,
  normalizeTitle,
  selectQueueExpirations,
  CURATION_MAX_AGE_DAYS,
  CURATION_MAX_PENDING_PER_POLITICIAN,
  type PendingForTrim,
} from './lib/news-curation';

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
// Decisão do Rilson (2026-09-27, docs/DECISOES.md): curadoria quando ele
// tiver tempo, sem alerta de fila grande. Revisar não tem cadência, então
// avisar que a fila cresceu só gera ruído. Em vez disso a fila se mantém
// pequena sozinha (regras em lib/news-curation.ts). PENDING nunca aparece
// pro público: não curar significa "menos conteúdo publicado", nunca
// "conteúdo errado publicado".

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

        // Eixo 2 do plano: a busca é automática, mas aprovar/rejeitar
        // continua 100% humano — o que pode crescer sem controle é a FILA.
        // Isso aqui a mantém num tamanho revisável (decisão 2026-09-27).
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
      
      // Atualiza filiação FPE (membros da Frente Parlamentar Evangélica).
      // Achado real (2026-09-15): o sync:fpe NUNCA rodou no cron — só
      // manualmente. Gap de 22 membros (232 oficiais vs 210 no DB).
      // Roda no mesmo fluxo do politician sync porque depende da base
      // de políticos estar atualizada (precisa de legislature_id pra match).
      console.log('🏛️ Sincronizando membros da FPE (frente 54477)...');
      try {
        const { stdout, stderr } = await execFileAsync('pnpm', ['sync:fpe'], {
          cwd: process.cwd(),
          maxBuffer: 1024 * 1024 * 10,
        });
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log('✅ Sincronização FPE concluída');
      } catch (fpeError) {
        // Falha no FPE não deve derrubar o sync de políticos —
        // os dados da Câmara/Senado já foram atualizados.
        console.error('⚠️ Erro no sync FPE (políticos já atualizados):', fpeError instanceof Error ? fpeError.message : fpeError);
      }
      
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
   * Mantém a fila num tamanho que uma pessoa consegue revisar (decisão
   * 2026-09-27, docs/DECISOES.md). Nenhuma regra aprova nada nem julga
   * conteúdo — só tira da fila:
   *
   * 1. o que não é notícia (ficha de candidatura, título só com o nome,
   *    site de partido) — mesmas regras da coleta, aplicadas aqui também
   *    pra limpar o que entrou antes delas existirem;
   * 2. título repetido pro mesmo parlamentar (mesma matéria em outra URL);
   * 3. notícia publicada há mais de CURATION_MAX_AGE_DAYS;
   * 4. o que passa de CURATION_MAX_PENDING_PER_POLITICIAN por parlamentar
   *    (saem as mais antigas).
   *
   * O que sai vira REJECTED com reviewed_at NULL — é assim que se distingue
   * de uma reprovação humana (que sempre carimba reviewed_at). Motivo e ids
   * ficam no SyncLog (details), sem coluna nova nem migração de schema.
   *
   * O push pro Uptime Kuma é sempre status=up: o monitor só confirma que a
   * busca diária de notícias rodou. Tamanho de fila não é mais alerta.
   */
  private async manageCurationQueue(): Promise<void> {
    try {
      const pending = await prisma.newsMention.findMany({
        where: { status: 'PENDING' },
        select: {
          id: true,
          politician_id: true,
          title: true,
          source_name: true,
          published_at: true,
          politician: { select: { name: true } },
        },
        orderBy: { id: 'asc' }, // em título repetido, fica o que chegou primeiro
      });

      // Título já decidido (por você ou pela regra) não volta por outra URL.
      const seenTitles = new Set(
        (await prisma.newsMention.findMany({
          where: { status: { not: 'PENDING' } },
          select: { politician_id: true, title: true },
        })).map((m) => `${m.politician_id}|${normalizeTitle(m.title)}`),
      );

      const removed: Record<string, number[]> = {
        pagina_candidatura: [],
        titulo_so_nome: [],
        fonte_partidaria: [],
        titulo_repetido: [],
      };
      const kept: PendingForTrim[] = [];

      for (const n of pending) {
        const junk = junkReason({ title: n.title, sourceName: n.source_name }, n.politician.name);
        const key = `${n.politician_id}|${normalizeTitle(n.title)}`;
        if (junk) {
          removed[junk].push(n.id);
        } else if (seenTitles.has(key)) {
          removed.titulo_repetido.push(n.id);
        } else {
          seenTitles.add(key);
          kept.push({ id: n.id, politicianId: n.politician_id, publishedAt: n.published_at });
        }
      }

      const { tooOld, overflow } = selectQueueExpirations(kept);
      const reasons = { ...removed, fora_da_janela: tooOld, acima_do_teto: overflow };
      const expiredIds = Object.values(reasons).flat();

      if (expiredIds.length > 0) {
        // Em lotes: a primeira execução depois da mudança tira ~12 mil de uma vez.
        for (let i = 0; i < expiredIds.length; i += 5000) {
          await prisma.newsMention.updateMany({
            // status PENDING de novo: se você revisou algo nesse meio-tempo, vale a sua decisão
            where: { id: { in: expiredIds.slice(i, i + 5000) }, status: 'PENDING' },
            data: { status: 'REJECTED', reviewed_at: null },
          });
        }

        const counts = Object.fromEntries(Object.entries(reasons).map(([k, ids]) => [k, ids.length]));

        await prisma.syncLog.create({
          data: {
            sync_type: 'NEWS',
            source: 'MANUAL',
            status: 'SUCCESS',
            start_time: new Date(),
            end_time: new Date(),
            records_processed: pending.length,
            records_updated: expiredIds.length,
            details: {
              action: 'auto_trim_curation_queue',
              rules: {
                maxAgeDays: CURATION_MAX_AGE_DAYS,
                maxPendingPerPolitician: CURATION_MAX_PENDING_PER_POLITICIAN,
              },
              counts,
              expiredIds: reasons,
            },
          },
        });

        console.log(`🗑️ ${expiredIds.length} menções tiradas da fila automaticamente:`, counts);
      }

      const pendingCount = await prisma.newsMention.count({ where: { status: 'PENDING' } });
      console.log(`📋 Fila de curadoria: ${pendingCount} pendentes`);

      await pingUptimeKuma('UPTIME_KUMA_PUSH_URL_CURATION_QUEUE', {
        status: 'up',
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