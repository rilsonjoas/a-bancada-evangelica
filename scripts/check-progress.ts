import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProgress() {
  try {
    const totalPoliticians = await prisma.politician.count({
      where: { is_active: true }
    });

    const camaraCount = await prisma.politician.count({
      where: { is_active: true, current_house: 'CAMARA' }
    });

    const senadoCount = await prisma.politician.count({
      where: { is_active: true, current_house: 'SENADO' }
    });

    const withScores = await prisma.politician.count({
      where: {
        is_active: true,
        scores: {
          some: {}
        }
      }
    });

    console.log('\n📊 PROGRESSO DA FASE 2 - EXPANSÃO DE DADOS');
    console.log('==================================================');
    console.log(`🏛️ POLÍTICOS NO BANCO:`);
    console.log(`   • Total: ${totalPoliticians}`);
    console.log(`   • Câmara dos Deputados: ${camaraCount}`);
    console.log(`   • Senado Federal: ${senadoCount}`);
    console.log(`\n📊 PONTUAÇÕES:`);
    console.log(`   • Com scores: ${withScores}/${totalPoliticians} (${((withScores/totalPoliticians)*100).toFixed(1)}%)`);
    console.log('==================================================\n');

  } catch (error) {
    console.error('❌ Erro ao verificar progresso:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProgress();