import { PrismaClient, FpeTier } from '@prisma/client';

const prisma = new PrismaClient();

// F16 — Seed dos tiers de filiação à FPE.
// Base: auditoria de 2026-08-25, na qual todos os membros foram cruzados
// nome-a-nome com a LISTA OFICIAL da frente 54477 (Câmara) / codcol 2583
// (Senado). Logo, todos os is_fpe_member=true atuais são REGISTRADO.
//
// Não há API oficial de frentes do Senado com lista de membros — a filiação
// dos senadores foi confirmada a partir da organização da bancada. Mantemos
// a mesma fonte/confiabilidade (REGISTRADO) pois vem de lista oficial.
//
// Correção (2026-09-16): o sync-fpe-members agora grava fpe_captured_at com
// a data REAL da leitura da lista oficial, então o seed NÃO sobrescreve uma
// data já gravada — era o que o fazia "rejuvenescer" membros para 25/08 toda
// vez que rodava manualmente.
const SOURCE_CAMARA = 'Lista oficial da Frente Parlamentar Evangélica — Câmara (frente 54477)';
const SOURCE_URL_CAMARA = 'https://dadosabertos.camara.leg.br/api/v2/frentes/54477/membros';
const SOURCE_SENADO = 'Composição da bancada evangélica no Senado (codcol 2583)';
const SOURCE_URL_SENADO = 'https://legis.senado.leg.br/dadosabertos/comissao/2583';

async function main() {
  const members = await prisma.politician.findMany({
    where: { is_fpe_member: true },
    select: { id: true, name: true, current_house: true },
  });

  console.log(`\n🔍 ${members.length} membros FPE atuais encontrados`);

  let updated = 0;
  for (const m of members) {
    const source =
      m.current_house === 'SENADO'
        ? SOURCE_SENADO
        : SOURCE_CAMARA;
    const sourceUrl =
      m.current_house === 'SENADO'
        ? SOURCE_URL_SENADO
        : SOURCE_URL_CAMARA;

    await prisma.politician.update({
      where: { id: m.id },
      data: {
        fpe_tier: FpeTier.REGISTRADO,
        fpe_source: source,
        fpe_source_url: sourceUrl,
        // Preserva a captured_at real (do sync diário ou de capturas
        // anteriores) — não solapa com data velha.
      },
    });
    updated++;
  }

  console.log(`✅ Atualizados ${updated} registros com tier REGISTRADO + fonte oficial`);

  // Sanidade: nenhum não-membro deve ter tier preenchido
  const nonMembersWithTier = await prisma.politician.count({
    where: { is_fpe_member: false, fpe_tier: { not: null } },
  });
  console.log(
    nonMembersWithTier === 0
      ? '✅ Nenhum não-membro com tier (coerente)'
      : `⚠️ ATENÇÃO: ${nonMembersWithTier} não-membros com tier — investigar`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
