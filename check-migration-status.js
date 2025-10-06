const { PrismaClient } = require('@prisma/client');
const config = require('./migration-config.js');

const prisma = new PrismaClient({
  datasources: { db: { url: config.DATABASE_URL } }
});

async function checkMigrationStatus() {
  try {
    console.log('📊 ESTADO DE LA MIGRACIÓN');
    console.log('=========================\n');

    // Buscar la clínica
    const clinica = await prisma.clinica.findUnique({
      where: { url: 'metodo-hebe' },
      select: { id: true, name: true, url: true }
    });

    if (!clinica) {
      console.log('❌ Clínica metodo-hebe no encontrada');
      return;
    }

    console.log(`🏥 Clínica: ${clinica.name} (${clinica.url})`);
    console.log(`🆔 ID: ${clinica.id}\n`);

    // Contar pacientes en la clínica
    const totalPatientsInClinica = await prisma.patient.count({
      where: { clinicaId: clinica.id }
    });

    console.log(`👥 Total pacientes en la clínica: ${totalPatientsInClinica}`);

    // Contar pacientes migrados (que tengan la nota de migración)
    const migratedPatients = await prisma.patient.count({
      where: {
        clinicaId: clinica.id,
        notes: { contains: 'Migrado desde Agenda Pro' }
      }
    });

    console.log(`📋 Pacientes migrados desde Agenda Pro: ${migratedPatients}`);

    // Mostrar pacientes recién creados
    const recentPatients = await prisma.patient.findMany({
      where: {
        clinicaId: clinica.id,
        notes: { contains: 'Migrado desde Agenda Pro' }
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('\n📄 ÚLTIMOS PACIENTES MIGRADOS:');
    console.log('===============================');
    recentPatients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.name} (${patient.email})`);
      console.log(`   Creado: ${patient.createdAt.toLocaleString()}`);
      console.log(`   ID: ${patient.id}`);
      console.log('');
    });

    // Estadísticas por fecha
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const patientsToday = await prisma.patient.count({
      where: {
        clinicaId: clinica.id,
        notes: { contains: 'Migrado desde Agenda Pro' },
        createdAt: { gte: today }
      }
    });

    console.log(`📅 Pacientes migrados hoy: ${patientsToday}`);

    // Total esperado del Excel
    console.log(`\n🎯 OBJETIVO: 14,574 pacientes del Excel`);
    console.log(`📊 PROGRESO: ${migratedPatients}/14,574 (${((migratedPatients/14574)*100).toFixed(1)}%)`);

    if (migratedPatients > 0) {
      console.log('\n✅ La migración está en progreso o completada');
    } else {
      console.log('\n⏳ La migración aún no ha comenzado o no hay pacientes migrados');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationStatus();
