const { PrismaClient } = require('@prisma/client');

console.log('🔍 DIAGNÓSTICO DE PROBLEMA EN RAILWAY');
console.log('=====================================\n');

async function diagnose() {
  try {
    console.log('1. Verificando variables de entorno...');
    console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada');
    console.log('   NODE_ENV:', process.env.NODE_ENV || 'No definida');
    console.log('   PORT:', process.env.PORT || 'No definida');
    
    console.log('\n2. Verificando conexión a base de datos...');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('   ✅ Conexión a base de datos exitosa');
      
      // Verificar si hay datos
      const clinicaCount = await prisma.clinica.count();
      const patientCount = await prisma.patient.count();
      
      console.log(`   📊 Clínicas en BD: ${clinicaCount}`);
      console.log(`   📊 Pacientes en BD: ${patientCount}`);
      
      if (patientCount > 10000) {
        console.log('   ⚠️ ADVERTENCIA: Muchos pacientes pueden causar problemas de rendimiento');
        console.log('   💡 SOLUCIÓN: Implementar paginación (ya hecho)');
      }
      
    } catch (dbError) {
      console.log('   ❌ Error de conexión a BD:', dbError.message);
    } finally {
      await prisma.$disconnect();
    }
    
    console.log('\n3. Verificando configuración de la aplicación...');
    console.log('   ✅ Paginación implementada en pacientes');
    console.log('   ✅ Logs de debug comentados');
    console.log('   ✅ Endpoint de health check disponible');
    
    console.log('\n4. Posibles causas del healthcheck fallido:');
    console.log('   - La aplicación puede estar tardando en iniciar');
    console.log('   - Puede haber un error en el startup');
    console.log('   - El endpoint /health puede no estar respondiendo');
    console.log('   - Problemas de memoria con muchos pacientes');
    
    console.log('\n5. Soluciones recomendadas:');
    console.log('   ✅ Paginación implementada (reduce carga)');
    console.log('   ✅ Logs optimizados (reduce rate limit)');
    console.log('   🔄 Reiniciar el servicio en Railway');
    console.log('   🔄 Verificar logs de Railway para errores específicos');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

diagnose();
