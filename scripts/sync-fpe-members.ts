import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const prisma = new PrismaClient();

const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';

interface FrenteResponse {
  dados: Array<{
    id: number;
    titulo: string;
    uri: string;
  }>;
}

interface MembroResponse {
  dados: Array<{
    id: number;
    uri: string;
    nome: string;
    siglaPartido: string;
    siglaUf: string;
    idLegislatura: number;
    urlFoto: string;
    email: string;
  }>;
}

async function findFpeId(): Promise<number | null> {
  console.log('🔍 Buscando ID da FPE (paginando resultados)...');

  const keywords = ['evangélica', 'evangelica'];
  let page = 1;
  let bestId: number | null = null;
  let bestLegislatura = 0;

  while (true) {
    const res = await fetch(`${CAMARA_API}/frentes?pagina=${page}&itens=100`);
    if (!res.ok) throw new Error(`Erro ao listar frentes (pág ${page}): ${res.status}`);
    const data = (await res.json()) as FrenteResponse;
    if (!data.dados?.length) break;

    for (const frente of data.dados) {
      const lower = frente.titulo.toLowerCase();
      if (keywords.some(k => lower.includes(k))) {
        // Preferir a frente da legislatura mais recente — ID mais alto indica mais recente
        if (frente.id > bestLegislatura) {
          bestLegislatura = frente.id;
          bestId = frente.id;
          console.log(`  → Candidata: "${frente.titulo}" (ID: ${frente.id})`);
        }
      }
    }
    page++;
  }

  if (bestId) {
    console.log(`  → Usando ID ${bestId} (mais recente encontrado)`);
  } else {
    console.warn('  ⚠️  Nenhuma frente com "evangélica" encontrada após varrer todas as páginas.');
  }

  return bestId;
}

async function fetchMembros(frenteId: number): Promise<MembroResponse['dados']> {
  console.log(`  Buscando membros da FPE (frente ${frenteId})...`);
  const res = await fetch(`${CAMARA_API}/frentes/${frenteId}/membros`);
  if (!res.ok) throw new Error(`Erro ao buscar membros: ${res.status}`);
  const data = (await res.json()) as MembroResponse;
  console.log(`  → ${data.dados.length} membros encontrados.`);
  return data.dados;
}

async function updateMembers(membros: MembroResponse['dados']) {
  console.log('\n🔄 Atualizando filiação à FPE no banco...');

  // A lista oficial (frente mais recente da Câmara) é a fonte da captura.
  // Achado real (2026-09-16): o script só virava o is_fpe_member e nunca
  // gravava fpe_captured_at/fpe_source — a UI mostrava uma data hardcoded
  // (25/08 no seed) e o "fonte verificável" ficava mentiroso. Agora a data
  // de captura é a data em que a lista oficial foi lida.
  const FPE_SOURCE = 'Lista oficial da Frente Parlamentar Evangélica (Câmara)';
  const capturedAt = new Date();

  // Buscar todos os políticos ativos da Câmara
  const politicians = await prisma.politician.findMany({
    where: { is_active: true, current_house: 'CAMARA' },
    select: { id: true, legislature_id: true, name: true },
  });

  const memberIds = new Set<number>();
  let updated = 0;
  let notFound: number[] = [];

  for (const member of membros) {
    const match = politicians.find(
      p => p.legislature_id === String(member.id) || p.name.toLowerCase().includes(member.nome.toLowerCase())
    );

    if (match) {
      memberIds.add(match.id);
      await prisma.politician.update({
        where: { id: match.id },
        data: {
          is_fpe_member: true,
          fpe_captured_at: capturedAt,
          // preserva fpe_tier existente (curadoria manual do seed) — não solapa
        },
      });
      updated++;
    } else {
      notFound.push(member.id);
    }
  }

  // Remover filiação de quem deixou a lista (ou sumiu do match) e LIMPAR a
  // auditoria velha — fpe_tier/fpe_source/fpe_captured_at de alguém que não é
  // mais membro é dado morto (a UI exibe "não é membro", mas o banco não
  // deveria mentir).
  const currentFpeIds = (await prisma.politician.findMany({
    where: { is_fpe_member: true },
    select: { id: true },
  })).map(p => p.id);

  const dropped = currentFpeIds.filter(id => !memberIds.has(id));
  if (dropped.length > 0) {
    await prisma.politician.updateMany({
      where: { id: { in: dropped } },
      data: { is_fpe_member: false, fpe_source: null, fpe_captured_at: null },
    });
  }

  console.log(`  → ${updated} políticos marcados como FPE (capturados em ${capturedAt.toISOString()}).`);
  if (dropped.length > 0) {
    console.log(`  → ${dropped.length} políticos desmarcados (não estão mais na lista oficial).`);
  }
  if (notFound.length > 0) {
    console.log(`  → ${notFound.length} membros da FPE não encontrados no banco (IDs: ${notFound.slice(0, 10).join(', ')}${notFound.length > 10 ? '...' : ''})`);
  }

  // Trilha de auditoria: registrar no SyncLog (padrão dos demais syncs).
  // Achado real (2026-09-15): este script não registrava no SyncLog —
  // mesmo rodando no cron, o histórico do app não mostrava a execução.
  await prisma.syncLog.create({
    data: {
      sync_type: 'POLITICIANS',
      source: 'CAMARA',
      status: 'SUCCESS',
      start_time: new Date(),
      end_time: new Date(),
      records_processed: membros.length,
      records_inserted: 0,
      records_updated: updated,
      records_failed: notFound.length,
      details: {
        action: 'sync_fpe_members',
        fpeOfficialCount: membros.length,
        fpeMatched: updated,
        fpeDropped: dropped.length,
        notFoundIds: notFound.slice(0, 50),
        legislature: '57',
        capturedAt: capturedAt.toISOString(),
      },
    },
  });
}

async function main() {
  console.log('📥 Sync de Membros da Frente Parlamentar Evangélica\n');

  const frenteId = await findFpeId();
  if (!frenteId) {
    console.error('\n❌ Não foi possível determinar o ID da FPE.');
    console.log('\nDica: busque manualmente o ID em:');
    console.log('  curl https://dadosabertos.camara.leg.br/api/v2/frentes | jq .');
    console.log('Depois execute: tsx scripts/sync-fpe-members.ts <id>');
    process.exit(1);
  }

  // Se um ID foi passado como argumento, usar ele
  const targetId = process.argv[2] ? parseInt(process.argv[2]) : frenteId;
  const membros = await fetchMembros(targetId);
  await updateMembers(membros);

  // Estatísticas finais
  const fpeCount = await prisma.politician.count({ where: { is_fpe_member: true } });
  console.log(`\n✅ Total de membros FPE no banco: ${fpeCount}`);
  console.log('📊 Execute "pnpm scores:recalculate" se necessário.');

  await prisma.$disconnect();
}

// Roda só se este arquivo for o entry point (achado real 2026-08-20,
// mesma correção dos outros scripts de sync).
// pathToFileURL: o guard antigo (`file://${argv[1]}`) falhava SILENCIOSAMENTE
// em caminhos com espaço/acento (import.meta.url vem percent-encoded) — script
// não rodava e saía 0. Achado real 2026-08-23 rodando da máquina local.
const isEntryPoint = Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntryPoint) {
  main().catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
  });
}
