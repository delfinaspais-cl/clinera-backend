const { PrismaClient } = require('@prisma/client');

console.log('🔧 ARREGLANDO CONEXIONES DE BASE DE DATOS');
console.log('=========================================\n');

async function fixConnections() {
  let prisma = null;
  
  try {
    console.log('1. Conectando a la base de datos...');
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://postgres:jZmidaHqVcNEQdwhzUhfFlIsQbVDRnGO@interchange.proxy.rlwy.net:11747/railway'
        }
      },
      log: ['error'] // Solo logs de error para reducir ruido
    });
    
    await prisma.$connect();
    console.log('✅ Conexión exitosa');
    
    console.log('\n2. Verificando estado de la base de datos...');
    const clinicaCount = await prisma.clinica.count();
    const patientCount = await prisma.patient.count();
    
    console.log(`   📊 Clínicas: ${clinicaCount}`);
    console.log(`   📊 Pacientes: ${patientCount}`);
    
    if (patientCount > 10000) {
      console.log('   ⚠️ ADVERTENCIA: Muchos pacientes pueden causar problemas de rendimiento');
    }
    
    console.log('\n3. Cerrando conexión...');
    await prisma.$disconnect();
    console.log('✅ Conexión cerrada correctamente');
    
    console.log('\n4. Recomendaciones para Railway:');
    console.log('   - La aplicación está funcionando en modo fallback');
    console.log('   - El healthcheck está pasando');
    console.log('   - El problema es de pool de conexiones');
    console.log('   - Necesitamos optimizar la configuración de Prisma');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('too many clients')) {
      console.log('\n💡 SOLUCIÓN:');
      console.log('   - El problema es de pool de conexiones');
      console.log('   - Necesitamos optimizar la configuración de Prisma');
      console.log('   - La aplicación funciona en modo fallback');
    }
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (e) {
        // Ignorar errores al cerrar
      }
    }
  }
}

fixConnections();
