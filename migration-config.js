// ========================================
// CONFIGURACIÓN DE MIGRACIÓN AGENDA PRO
// ========================================

module.exports = {
  // URL de la base de datos de Railway
  DATABASE_URL: 'postgresql://postgres:jZmidaHqVcNEQdwhzUhfFlIsQbVDRnGO@interchange.proxy.rlwy.net:11747/railway',
  
  // Configuración de la migración
  MIGRATION: {
    // Nombre de la clínica a buscar (puede ser URL o nombre)
    CLINICA_IDENTIFIER: 'metodo-hebe',
    
    // Archivo Excel a procesar
    EXCEL_FILE: 'clientes_47066_1759595310.xlsx',
    
    // Límite de registros a procesar (0 = todos)
    LIMIT_RECORDS: 0,
    
    // Solo mostrar preview sin insertar datos (true = solo lectura)
    PREVIEW_ONLY: false,
    
    // Procesar en lotes (para mejor rendimiento)
    BATCH_SIZE: 50
  }
};

/*
INSTRUCCIONES DE USO:

1. CONFIGURAR DATABASE_URL:
   - Obtén tu DATABASE_URL de Railway
   - Reemplaza la línea DATABASE_URL con tu URL real
   - Formato: 'postgresql://username:password@host:port/database'

2. CONFIGURAR LA MIGRACIÓN:
   - CLINICA_IDENTIFIER: URL o nombre de la clínica destino
   - EXCEL_FILE: nombre del archivo Excel
   - LIMIT_RECORDS: 0 para todos, o un número para limitar
   - PREVIEW_ONLY: true para solo ver preview, false para migrar

3. EJECUTAR:
   - Primero ejecuta con PREVIEW_ONLY: true para verificar
   - Si todo está bien, cambia a PREVIEW_ONLY: false
   - Ejecuta: node migrate-agenda-pro-final.js

4. VERIFICAR RESULTADOS:
   - Revisa el resumen de la migración
   - Si hay errores, revisa migration-errors.json
*/
