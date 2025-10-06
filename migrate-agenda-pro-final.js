const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const config = require('./migration-config.js');

// ========================================
// CONFIGURACIÓN DESDE ARCHIVO
// ========================================
const DATABASE_URL = config.DATABASE_URL;
const MIGRATION_CONFIG = config.MIGRATION;

console.log('🚀 MIGRACIÓN DE DATOS AGENDA PRO A CLINERA');
console.log('==========================================');
console.log(`📁 Archivo Excel: ${MIGRATION_CONFIG.EXCEL_FILE}`);
console.log(`🏥 Clínica: ${MIGRATION_CONFIG.CLINICA_IDENTIFIER}`);
console.log(`📊 Modo: ${MIGRATION_CONFIG.PREVIEW_ONLY ? 'PREVIEW (solo lectura)' : 'MIGRACIÓN COMPLETA'}`);
console.log(`🔢 Límite: ${MIGRATION_CONFIG.LIMIT_RECORDS || 'Todos los registros'}`);
console.log('==========================================\n');

// Configurar Prisma
const prisma = new PrismaClient({
  datasources: {
    db: { url: DATABASE_URL }
  }
});

async function migrateAgendaProData() {
  try {
    // 1. Verificar conexión a la base de datos
    console.log('🔗 Verificando conexión a la base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 2. Buscar la clínica
    console.log(`🔍 Buscando clínica: ${MIGRATION_CONFIG.CLINICA_IDENTIFIER}...`);
    
    let clinica = await prisma.clinica.findUnique({
      where: { url: MIGRATION_CONFIG.CLINICA_IDENTIFIER },
      select: { id: true, name: true, url: true, email: true }
    });

    if (!clinica) {
      console.log('❌ Clínica no encontrada por URL, buscando por nombre...');
      clinica = await prisma.clinica.findFirst({
        where: { name: { contains: MIGRATION_CONFIG.CLINICA_IDENTIFIER, mode: 'insensitive' } },
        select: { id: true, name: true, url: true, email: true }
      });
    }

    if (!clinica) {
      console.log('❌ Clínica no encontrada');
      console.log('📋 Clínicas disponibles:');
      const todasLasClinicas = await prisma.clinica.findMany({
        select: { id: true, name: true, url: true },
        take: 10
      });
      
      todasLasClinicas.forEach((c, index) => {
        console.log(`${index + 1}. ${c.name} (${c.url}) - ID: ${c.id}`);
      });
      
      throw new Error('No se encontró la clínica especificada');
    }

    console.log(`✅ Clínica encontrada: ${clinica.name} (${clinica.url}) - ID: ${clinica.id}\n`);

    // 3. Leer el Excel
    console.log(`📖 Leyendo archivo Excel: ${MIGRATION_CONFIG.EXCEL_FILE}...`);
    const workbook = XLSX.readFile(MIGRATION_CONFIG.EXCEL_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Total de registros en Excel: ${jsonData.length}`);
    
    // Aplicar límite si está configurado
    const dataToProcess = MIGRATION_CONFIG.LIMIT_RECORDS > 0 
      ? jsonData.slice(0, MIGRATION_CONFIG.LIMIT_RECORDS)
      : jsonData;
    
    console.log(`📋 Registros a procesar: ${dataToProcess.length}\n`);

    // 4. Mostrar muestra de datos
    console.log('📄 MUESTRA DE DATOS:');
    console.log('===================');
    dataToProcess.slice(0, 3).forEach((row, index) => {
      console.log(`Fila ${index + 1}:`);
      console.log(`  Email: ${row.Email}`);
      console.log(`  Nombre: ${row.Nombres} ${row.Apellidos || ''}`);
      console.log(`  Teléfono: ${row.Teléfono}`);
      console.log(`  Cliente #: ${row['Número de cliente']}`);
      console.log(`  Fecha: ${row['Fecha de creación.']}`);
      console.log('');
    });

    if (MIGRATION_CONFIG.PREVIEW_ONLY) {
      console.log('🔍 MODO PREVIEW: No se insertarán datos');
      console.log('📊 Para ejecutar la migración real, cambia PREVIEW_ONLY a false');
      return;
    }

    // 5. Procesar registros
    console.log('🔄 Iniciando procesamiento de registros...\n');
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < dataToProcess.length; i += MIGRATION_CONFIG.BATCH_SIZE) {
      const batch = dataToProcess.slice(i, i + MIGRATION_CONFIG.BATCH_SIZE);
      
      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j;
        const row = batch[j];
        
        try {
          // Validar datos requeridos
          if (!row.Email || !row.Nombres) {
            throw new Error('Email y nombres son requeridos');
          }

          // Combinar nombre y apellidos
          const fullName = `${row.Nombres} ${row.Apellidos || ''}`.trim();
          
          // Convertir fecha
          let createdAt = new Date();
          if (row['Fecha de creación.']) {
            const dateParts = row['Fecha de creación.'].split('/');
            if (dateParts.length === 3) {
              createdAt = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
            }
          }

          // Verificar si el paciente ya existe
          const existingPatient = await prisma.patient.findFirst({
            where: {
              email: row.Email,
              clinicaId: clinica.id
            }
          });

          if (existingPatient) {
            console.log(`⏭️ Paciente ya existe: ${row.Email} (fila ${rowIndex + 1})`);
            skipCount++;
            continue;
          }

          // Crear paciente
          const patientData = {
            name: fullName,
            email: row.Email,
            phone: row.Teléfono || null,
            birthDate: null,
            notes: `Migrado desde Agenda Pro - Cliente #${row['Número de cliente'] || 'N/A'} - Fecha original: ${row['Fecha de creación.'] || 'N/A'}`,
            clinicaId: clinica.id,
            createdAt: createdAt
          };

          const patient = await prisma.patient.create({
            data: patientData
          });

          successCount++;
          
          if (successCount % 10 === 0) {
            console.log(`✅ Progreso: ${successCount} pacientes creados...`);
          }

        } catch (error) {
          console.log(`❌ Error en fila ${rowIndex + 1}: ${error.message}`);
          errors.push({
            row: rowIndex + 1,
            email: row.Email || 'N/A',
            error: error.message,
            data: row
          });
          errorCount++;
        }
      }
      
      // Pausa entre lotes
      if (i + MIGRATION_CONFIG.BATCH_SIZE < dataToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // 6. Resumen final
    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log('========================');
    console.log(`✅ Pacientes creados: ${successCount}`);
    console.log(`⏭️ Pacientes omitidos (ya existían): ${skipCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📋 Total procesados: ${successCount + skipCount + errorCount}/${dataToProcess.length}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORES DETALLADOS (primeros 10):');
      errors.slice(0, 10).forEach(error => {
        console.log(`  Fila ${error.row}: ${error.email} - ${error.error}`);
      });
      
      if (errors.length > 10) {
        console.log(`  ... y ${errors.length - 10} errores más`);
      }

      // Guardar reporte de errores
      const fs = require('fs');
      fs.writeFileSync('migration-errors.json', JSON.stringify(errors, null, 2));
      console.log('\n📄 Reporte completo de errores guardado en migration-errors.json');
    }

    console.log('\n🎉 Migración completada!');

  } catch (error) {
    console.error('\n💥 Error crítico:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrateAgendaProData();
