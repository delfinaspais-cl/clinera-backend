const { PrismaClient } = require('@prisma/client');
const config = require('./migration-config.js');

const prisma = new PrismaClient({
  datasources: { db: { url: config.DATABASE_URL } }
});

async function monitorMigration() {
  try {
    console.log('🔄 MONITOR DE MIGRACIÓN EN TIEMPO REAL');
    console.log('=====================================\n');

    const clinica = await prisma.clinica.findUnique({
      where: { url: 'metodo-hebe' },
      select: { id: true, name: true }
    });

    if (!clinica) {
      console.log('❌ Clínica no encontrada');
      return;
    }

    let lastCount = 0;
    let startTime = Date.now();

    console.log(`🏥 Clínica: ${clinica.name}`);
    console.log(`🎯 Objetivo: 14,574 pacientes`);
    console.log(`⏰ Iniciando monitoreo...\n`);

    while (true) {
      const currentCount = await prisma.patient.count({
        where: {
          clinicaId: clinica.id,
          notes: { contains: 'Migrado desde Agenda Pro' }
        }
      });

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const progress = ((currentCount / 14574) * 100).toFixed(1);
      
      if (currentCount > lastCount) {
        const rate = (currentCount - lastCount) / (elapsed / 60); // pacientes por minuto
        const estimated = currentCount > 0 ? Math.floor((14574 - currentCount) / rate) : 0;
        
        console.log(`📊 ${currentCount}/14,574 (${progress}%) - Tiempo: ${elapsed}s - Velocidad: ${rate.toFixed(1)} p/min - Restante: ${estimated}min`);
        lastCount = currentCount;
      }

      if (currentCount >= 14574) {
        console.log('\n🎉 ¡MIGRACIÓN COMPLETADA!');
        console.log(`✅ Total pacientes migrados: ${currentCount}`);
        console.log(`⏰ Tiempo total: ${Math.floor(elapsed / 60)} minutos`);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 10000)); // Verificar cada 10 segundos
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

monitorMigration();
