/**
 * Script de prueba para importación de pacientes desde CSV
 * 
 * Uso:
 * 1. Asegúrate de tener un usuario autenticado
 * 2. Ajusta las variables BASE_URL, CLINICA_URL y TOKEN
 * 3. Ejecuta: node test-import-csv.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACIÓN - AJUSTA ESTOS VALORES
// ============================================================================
const BASE_URL = 'http://localhost:3000';
const CLINICA_URL = 'clinica-demo'; // URL de tu clínica
const TOKEN = 'TU_JWT_TOKEN_AQUI'; // Obtener del login

// ============================================================================
// FUNCIONES DE PRUEBA
// ============================================================================

/**
 * 1. Descargar plantilla
 */
async function descargarPlantilla(tipo = 'estandar') {
  console.log(`\n📄 Descargando plantilla tipo: ${tipo}...`);
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(
      `${BASE_URL}/api/clinica/${CLINICA_URL}/pacientes/import/template/${tipo}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const csv = await response.text();
    const filename = `plantilla-descargada-${tipo}.csv`;
    fs.writeFileSync(filename, csv, 'utf8');
    
    console.log(`✅ Plantilla descargada: ${filename}`);
    console.log(`📝 Contenido de ejemplo:\n${csv.split('\n').slice(0, 3).join('\n')}`);
    
    return filename;
  } catch (error) {
    console.error('❌ Error descargando plantilla:', error.message);
    throw error;
  }
}

/**
 * 2. Crear CSV de prueba
 */
function crearCSVPrueba() {
  console.log('\n📝 Creando CSV de prueba...');
  
  const csvContent = `name,email,phone,birthDate,documento,gender,notes
Juan Pérez Test,juan.test@email.com,+5491112345678,1990-05-15,12345678,Masculino,Paciente de prueba
María González Test,maria.test@email.com,+5491198765432,1985-03-20,87654321,Femenino,Paciente de prueba 2
Pedro López Test,,+5491156781234,1978-11-10,23456789,Masculino,Sin email
Ana Rodríguez Test,ana.test@email.com,,,34567890,Femenino,Sin teléfono ni fecha`;

  const filename = 'pacientes-prueba.csv';
  fs.writeFileSync(filename, csvContent, 'utf8');
  
  console.log(`✅ CSV de prueba creado: ${filename}`);
  console.log(`📊 4 pacientes de prueba listos para importar`);
  
  return filename;
}

/**
 * 3. Importar pacientes
 */
async function importarPacientes(csvFile, options = {}) {
  console.log(`\n📤 Importando pacientes desde: ${csvFile}...`);
  
  try {
    const FormData = (await import('form-data')).default;
    const fetch = (await import('node-fetch')).default;
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(csvFile));
    formData.append('duplicateStrategy', options.duplicateStrategy || 'skip');
    formData.append('duplicateField', options.duplicateField || 'email');
    formData.append('dryRun', options.dryRun || false);

    const response = await fetch(
      `${BASE_URL}/api/clinica/${CLINICA_URL}/pacientes/import`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          ...formData.getHeaders(),
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('\n✅ RESULTADO DE LA IMPORTACIÓN:');
    console.log('═'.repeat(60));
    console.log(`📊 Total procesados: ${result.totalProcesados}`);
    console.log(`✅ Exitosos: ${result.exitosos}`);
    console.log(`❌ Errores: ${result.errores}`);
    console.log(`⚠️  Duplicados: ${result.duplicados}`);
    console.log(`⏱️  Tiempo: ${result.tiempoProcesamiento}ms`);
    console.log(`📝 Mensaje: ${result.message}`);
    console.log('═'.repeat(60));

    if (result.detallesErrores && result.detallesErrores.length > 0) {
      console.log('\n❌ ERRORES DETALLADOS:');
      result.detallesErrores.forEach((error) => {
        console.log(`  Línea ${error.linea}: ${error.error}`);
        console.log(`    Datos:`, error.datos);
      });
    }

    if (result.pacientesCreados && result.pacientesCreados.length > 0) {
      console.log(`\n✅ Pacientes creados (${result.pacientesCreados.length}):`);
      result.pacientesCreados.slice(0, 5).forEach((id) => {
        console.log(`  - ${id}`);
      });
      if (result.pacientesCreados.length > 5) {
        console.log(`  ... y ${result.pacientesCreados.length - 5} más`);
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Error importando pacientes:', error.message);
    throw error;
  }
}

/**
 * 4. Exportar pacientes
 */
async function exportarPacientes() {
  console.log('\n📥 Exportando pacientes...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(
      `${BASE_URL}/api/clinica/${CLINICA_URL}/pacientes/export`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const csv = await response.text();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `pacientes-exportados-${timestamp}.csv`;
    fs.writeFileSync(filename, csv, 'utf8');
    
    const lines = csv.split('\n').length - 1; // -1 por el header
    console.log(`✅ Exportación completada: ${filename}`);
    console.log(`📊 Total de pacientes exportados: ${lines}`);
    console.log(`📝 Primeras líneas:\n${csv.split('\n').slice(0, 3).join('\n')}`);
    
    return filename;
  } catch (error) {
    console.error('❌ Error exportando pacientes:', error.message);
    throw error;
  }
}

/**
 * 5. Dry Run (validar sin importar)
 */
async function validarCSV(csvFile) {
  console.log(`\n🔍 Validando CSV sin importar (dry-run): ${csvFile}...`);
  
  return importarPacientes(csvFile, { dryRun: true });
}

// ============================================================================
// MENÚ INTERACTIVO
// ============================================================================

async function mostrarMenu() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     PRUEBA DE IMPORTACIÓN/EXPORTACIÓN DE PACIENTES CSV       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n1. Descargar plantilla (estándar)');
  console.log('2. Descargar plantilla (Chile - RUT)');
  console.log('3. Descargar plantilla (México - CURP)');
  console.log('4. Crear CSV de prueba');
  console.log('5. Validar CSV (dry-run, sin importar)');
  console.log('6. Importar pacientes desde CSV');
  console.log('7. Exportar pacientes actuales');
  console.log('8. PRUEBA COMPLETA (todo el flujo)');
  console.log('0. Salir');
}

async function ejecutarOpcion(opcion) {
  switch (opcion) {
    case '1':
      await descargarPlantilla('estandar');
      break;
    case '2':
      await descargarPlantilla('chile');
      break;
    case '3':
      await descargarPlantilla('mexico');
      break;
    case '4':
      crearCSVPrueba();
      break;
    case '5':
      const csvValidar = 'pacientes-prueba.csv';
      if (!fs.existsSync(csvValidar)) {
        console.log('❌ Archivo no encontrado. Crea uno con la opción 4.');
        break;
      }
      await validarCSV(csvValidar);
      break;
    case '6':
      const csvImportar = 'pacientes-prueba.csv';
      if (!fs.existsSync(csvImportar)) {
        console.log('❌ Archivo no encontrado. Crea uno con la opción 4.');
        break;
      }
      await importarPacientes(csvImportar);
      break;
    case '7':
      await exportarPacientes();
      break;
    case '8':
      await pruebaCompleta();
      break;
    case '0':
      console.log('\n👋 ¡Hasta luego!');
      process.exit(0);
    default:
      console.log('❌ Opción inválida');
  }
}

/**
 * Prueba completa de todo el flujo
 */
async function pruebaCompleta() {
  console.log('\n🚀 INICIANDO PRUEBA COMPLETA...\n');
  
  try {
    // 1. Descargar plantilla
    await descargarPlantilla('estandar');
    
    // 2. Crear CSV de prueba
    const csvFile = crearCSVPrueba();
    
    // 3. Validar (dry-run)
    await validarCSV(csvFile);
    
    // 4. Importar
    await importarPacientes(csvFile);
    
    // 5. Exportar
    await exportarPacientes();
    
    console.log('\n✅ PRUEBA COMPLETA FINALIZADA CON ÉXITO');
  } catch (error) {
    console.error('\n❌ Error en prueba completa:', error.message);
  }
}

// ============================================================================
// EJECUCIÓN PRINCIPAL
// ============================================================================

async function main() {
  // Verificar token
  if (TOKEN === 'TU_JWT_TOKEN_AQUI') {
    console.log('\n⚠️  AVISO: Debes configurar tu TOKEN en el archivo');
    console.log('   Edita las variables al inicio del archivo:\n');
    console.log('   const TOKEN = "tu_token_jwt_real";');
    console.log('   const CLINICA_URL = "tu-clinica-url";\n');
    console.log('📝 Para obtener un token, inicia sesión en tu aplicación.');
    process.exit(1);
  }

  // Si se pasa un argumento, ejecutar prueba completa
  if (process.argv.includes('--full')) {
    await pruebaCompleta();
    return;
  }

  // Menú interactivo
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const pregunta = (query) => new Promise((resolve) => readline.question(query, resolve));

  while (true) {
    await mostrarMenu();
    const opcion = await pregunta('\n👉 Selecciona una opción: ');
    console.log('');
    await ejecutarOpcion(opcion.trim());
    
    if (opcion.trim() !== '0') {
      await pregunta('\n[Presiona Enter para continuar...]');
    }
  }
}

// Ejecutar
main().catch(console.error);

