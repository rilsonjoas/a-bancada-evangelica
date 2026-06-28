import { PrismaClient } from '@prisma/client';

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
  console.log('\n🔄 Atualizando is_fpe_member no banco...');

  // Marcar todos como não-FPE inicialmente
  const [totalPoliticians, reset] = await Promise.all([
    prisma.politician.count({ where: { is_active: true, current_house: 'CAMARA' } }),
    prisma.politician.updateMany({
      where: { is_active: true, current_house: 'CAMARA' },
      data: { is_fpe_member: false },
    }),
  ]);
  console.log(`  → Resetados ${reset.count} políticos ativos da Câmara.`);

  // Mapear membros FPE por ID da legislatura
  const camaraIds = new Set(membros.map(m => m.id));
  let updated = 0;
  let notFound: number[] = [];

  // Buscar todos os políticos ativos da Câmara
  const politicians = await prisma.politician.findMany({
    where: { is_active: true, current_house: 'CAMARA' },
    select: { id: true, legislature_id: true, name: true },
  });

  for (const member of membros) {
    const match = politicians.find(
      p => p.legislature_id === String(member.id) || p.name.toLowerCase().includes(member.nome.toLowerCase())
    );

    if (match) {
      await prisma.politician.update({
        where: { id: match.id },
        data: { is_fpe_member: true },
      });
      updated++;
    } else {
      notFound.push(member.id);
    }
  }

  console.log(`  → ${updated} políticos marcados como FPE.`);
  if (notFound.length > 0) {
    console.log(`  → ${notFound.length} membros da FPE não encontrados no banco (IDs: ${notFound.slice(0, 10).join(', ')}${notFound.length > 10 ? '...' : ''})`);
  }
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

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
