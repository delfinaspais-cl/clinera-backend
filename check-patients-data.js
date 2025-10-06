const { PrismaClient } = require('@prisma/client');

console.log('🔍 VERIFICANDO DATOS DE PACIENTES EN LA CLÍNICA METODO-HEBE');
console.log('===========================================================\n');

async function checkPatients() {
  let prisma = null;
  
  try {
    // Configurar Prisma con la URL de Railway
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:jZmidaHqVcNEQdwhzUhfFlIsQbVDRnGO@interchange.proxy.rlwy.net:11747/railway';
    
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl + '?connection_limit=5&pool_timeout=20&connect_timeout=60'
        }
      }
    });

    await prisma.$connect();
    console.log('✅ Conexión a la base de datos exitosa.');

    const clinicaUrl = 'metodo-hebe';

    console.log(`\n1. Buscando clínica "${clinicaUrl}"...`);
    const clinica = await prisma.clinica.findFirst({
      where: { url: clinicaUrl },
      select: { id: true, name: true, url: true }
    });

    if (!clinica) {
      console.error(`❌ Error: Clínica "${clinicaUrl}" no encontrada en la base de datos.`);
      return;
    }
    console.log(`✅ Clínica encontrada: ${clinica.name} (ID: ${clinica.id})`);

    console.log('\n2. Contando pacientes para esta clínica...');
    const patientCount = await prisma.patient.count({
      where: { clinicaId: clinica.id },
    });
    console.log(`📊 Total de pacientes registrados para "${clinica.name}": ${patientCount}`);

    if (patientCount === 0) {
      console.warn('⚠️ No se encontraron pacientes en la base de datos para esta clínica.');
      console.log('\n3. Verificando si hay pacientes en otras clínicas...');
      const totalPatients = await prisma.patient.count();
      console.log(`📊 Total de pacientes en TODA la base de datos: ${totalPatients}`);
      
      if (totalPatients > 0) {
        console.log('\n4. Verificando distribución de pacientes por clínica...');
        const clinicaStats = await prisma.clinica.findMany({
          select: {
            id: true,
            name: true,
            url: true,
            _count: {
              select: { patients: true }
            }
          }
        });
        
        clinicaStats.forEach(c => {
          console.log(`   - ${c.name} (${c.url}): ${c._count.patients} pacientes`);
        });
      }
    } else {
      console.log('\n3. Obteniendo una muestra de pacientes (primeros 5)...');
      const samplePatients = await prisma.patient.findMany({
        where: { clinicaId: clinica.id },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      console.log('✅ Muestra de pacientes encontrada:');
      samplePatients.forEach((p, index) => {
        console.log(`   ${index + 1}. ID: ${p.id}, Nombre: ${p.name}, Email: ${p.email || 'N/A'}, Teléfono: ${p.phone || 'N/A'}, Creado: ${p.createdAt.toISOString()}`);
      });

      console.log('\n4. Simulando la respuesta del endpoint de pacientes...');
      
      // Simular la lógica del endpoint con paginación
      const page = 1;
      const limit = 20;
      const skip = (page - 1) * limit;

      const pacientes = await prisma.patient.findMany({
        where: { clinicaId: clinica.id },
        include: { clinica: true },
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.patient.count({
        where: { clinicaId: clinica.id }
      });

      // Simular conteo de turnos para cada paciente
      const pacientesConTurnos = await Promise.all(
        pacientes.map(async (paciente) => {
          let turnosCount = 0;
          
          if (paciente.email) {
            turnosCount = await prisma.turno.count({
              where: {
                email: paciente.email,
                clinicaId: clinica.id,
              },
            });
          }

          return {
            ...paciente,
            totalTurnos: turnosCount,
          };
        })
      );

      const response = {
        success: true,
        data: pacientesConTurnos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };

      console.log(`✅ Respuesta simulada del endpoint:`);
      console.log(`   - Total de pacientes devueltos: ${response.data.length}`);
      console.log(`   - Total de registros: ${response.pagination.total}`);
      console.log(`   - Página actual: ${response.pagination.page}`);
      console.log(`   - Total de páginas: ${response.pagination.totalPages}`);
      
      if (response.data.length > 0) {
        console.log('\n   Muestra de respuesta (primeros 3):');
        response.data.slice(0, 3).forEach((p, index) => {
          console.log(`     ${index + 1}. ID: ${p.id}, Nombre: ${p.name}, Email: ${p.email || 'N/A'}, Turnos: ${p.totalTurnos}`);
        });
      }
    }

  } catch (error) {
    console.error('\n❌ Ocurrió un error durante la verificación:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('\n✅ Conexión a la base de datos cerrada.');
    }
  }
}

checkPatients();
