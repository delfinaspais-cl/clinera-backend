const { PrismaClient } = require('@prisma/client');

// Script para verificar la restricción en la base de datos de Railway
async function verifyConstraint() {
  console.log('🔍 Verificando restricción en Railway...');
  
  try {
    // Usar la URL pública de la base de datos de Railway
    const railwayUrl = 'postgresql://postgres:jEOzyzhJOYOWjFyEyqDfMPuqbZSORIiC@maglev.proxy.rlwy.net:29247/railway';
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: railwayUrl
        }
      }
    });

    console.log('🔍 Conectando a la base de datos de Railway...');
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos de Railway');

    console.log('🔍 Verificando restricciones actuales...');
    
    // Verificar restricciones existentes
    const constraints = await prisma.$queryRaw`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = '"User"'::regclass 
      AND conname LIKE '%email%'
    `;
    
    console.log('📋 Restricciones actuales:', constraints);

    // Verificar si existe el email en la base de datos
    console.log('🔍 Verificando usuarios existentes con email delfina.spais@oacg.cl...');
    
    const existingUsers = await prisma.user.findMany({
      where: {
        email: 'delfina.spais@oacg.cl'
      },
      select: {
        id: true,
        email: true,
        clinicaId: true,
        role: true
      }
    });
    
    console.log('👥 Usuarios existentes con email delfina.spais@oacg.cl:', existingUsers);

    // Verificar usuarios por clínica específica
    const usersInClinica = await prisma.user.findMany({
      where: {
        email: 'delfina.spais@oacg.cl',
        clinicaId: 'cmforbc6i0000pj31mipssih5'
      },
      select: {
        id: true,
        email: true,
        clinicaId: true,
        role: true
      }
    });
    
    console.log('🏥 Usuarios en clínica cmforbc6i0000pj31mipssih5:', usersInClinica);

    console.log('✅ Verificación completada');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error al verificar la base de datos:', error);
    process.exit(1);
  }
}

verifyConstraint();
