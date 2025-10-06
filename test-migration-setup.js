const { PrismaClient } = require('@prisma/client');
const config = require('./migration-config.js');
const XLSX = require('xlsx');

console.log('🧪 PRUEBA DE CONFIGURACIÓN DE MIGRACIÓN');
console.log('=======================================\n');

async function testSetup() {
  try {
    // 1. Verificar configuración
    console.log('📋 CONFIGURACIÓN:');
    console.log(`  DATABASE_URL: ${config.DATABASE_URL ? '✅ Configurada' : '❌ No configurada'}`);
    console.log(`  Clínica: ${config.MIGRATION.CLINICA_IDENTIFIER}`);
    console.log(`  Archivo Excel: ${config.MIGRATION.EXCEL_FILE}`);
    console.log(`  Modo Preview: ${config.MIGRATION.PREVIEW_ONLY ? '✅ Sí' : '❌ No'}`);
    console.log(`  Límite registros: ${config.MIGRATION.LIMIT_RECORDS || 'Todos'}\n`);

    // 2. Verificar archivo Excel
    console.log('📁 VERIFICANDO ARCHIVO EXCEL:');
    try {
      const workbook = XLSX.readFile(config.MIGRATION.EXCEL_FILE);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`  ✅ Archivo encontrado: ${config.MIGRATION.EXCEL_FILE}`);
      console.log(`  📊 Total registros: ${jsonData.length}`);
      console.log(`  📋 Columnas: ${Object.keys(jsonData[0] || {}).join(', ')}\n`);
      
      // Mostrar muestra
      if (jsonData.length > 0) {
        console.log('📄 MUESTRA DE DATOS:');
        const sample = jsonData[0];
        Object.keys(sample).forEach(key => {
          console.log(`  ${key}: ${sample[key]}`);
        });
        console.log('');
      }
    } catch (error) {
      console.log(`  ❌ Error leyendo Excel: ${error.message}\n`);
    }

    // 3. Verificar conexión a base de datos
    console.log('🔗 VERIFICANDO CONEXIÓN A BASE DE DATOS:');
    const prisma = new PrismaClient({
      datasources: { db: { url: config.DATABASE_URL } }
    });

    try {
      await prisma.$connect();
      console.log('  ✅ Conexión exitosa a la base de datos\n');
    } catch (error) {
      console.log(`  ❌ Error de conexión: ${error.message}\n`);
      console.log('  💡 Configura tu DATABASE_URL real en migration-config.js\n');
      return;
    }

    // 4. Buscar clínica
    console.log(`🔍 BUSCANDO CLÍNICA: ${config.MIGRATION.CLINICA_IDENTIFIER}`);
    try {
      let clinica = await prisma.clinica.findUnique({
        where: { url: config.MIGRATION.CLINICA_IDENTIFIER },
        select: { id: true, name: true, url: true }
      });

      if (!clinica) {
        clinica = await prisma.clinica.findFirst({
          where: { name: { contains: config.MIGRATION.CLINICA_IDENTIFIER, mode: 'insensitive' } },
          select: { id: true, name: true, url: true }
        });
      }

      if (clinica) {
        console.log(`  ✅ Clínica encontrada: ${clinica.name} (${clinica.url}) - ID: ${clinica.id}\n`);
      } else {
        console.log('  ❌ Clínica no encontrada');
        console.log('  📋 Clínicas disponibles:');
        const clinicas = await prisma.clinica.findMany({
          select: { id: true, name: true, url: true },
          take: 5
        });
        clinicas.forEach((c, index) => {
          console.log(`    ${index + 1}. ${c.name} (${c.url})`);
        });
        console.log('');
      }
    } catch (error) {
      console.log(`  ❌ Error buscando clínica: ${error.message}\n`);
    }

    // 5. Verificar pacientes existentes
    console.log('👥 VERIFICANDO PACIENTES EXISTENTES:');
    try {
      const totalPatients = await prisma.patient.count();
      console.log(`  📊 Total pacientes en la base: ${totalPatients}`);
      
      if (clinica) {
        const patientsInClinica = await prisma.patient.count({
          where: { clinicaId: clinica.id }
        });
        console.log(`  📊 Pacientes en la clínica: ${patientsInClinica}\n`);
      } else {
        console.log('  ⚠️ No se puede contar pacientes - clínica no encontrada\n');
      }
    } catch (error) {
      console.log(`  ❌ Error contando pacientes: ${error.message}\n`);
    }

    console.log('✅ PRUEBA COMPLETADA');
    console.log('===================');
    console.log('📝 Siguiente paso:');
    if (config.MIGRATION.PREVIEW_ONLY) {
      console.log('  1. Ejecuta: node migrate-agenda-pro-final.js');
      console.log('  2. Revisa el preview');
      console.log('  3. Si todo está bien, cambia PREVIEW_ONLY a false en migration-config.js');
      console.log('  4. Ejecuta nuevamente: node migrate-agenda-pro-final.js');
    } else {
      console.log('  ⚠️ PREVIEW_ONLY está en false - se insertarán datos reales');
      console.log('  🔄 Ejecuta: node migrate-agenda-pro-final.js');
    }

  } catch (error) {
    console.error('💥 Error en la prueba:', error.message);
  } finally {
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}

testSetup();
