import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de especialidades y tratamientos...');

  // Buscar una clínica existente o crear una de ejemplo
  let clinica = await prisma.clinica.findFirst();
  
  if (!clinica) {
    console.log('📋 Creando clínica de ejemplo...');
    clinica = await prisma.clinica.create({
      data: {
        name: 'Clínica Dental Ejemplo',
        address: 'Calle Ejemplo 123',
        phone: '+1234567890',
        email: 'info@clinicaejemplo.com',
        url: 'clinica-ejemplo',
        estado: 'activo',
        estadoPago: 'pagado',
      },
    });
  }

  console.log(`🏥 Usando clínica: ${clinica.name}`);

  // Crear especialidades
  console.log('🦷 Creando especialidades...');
  const especialidades = await Promise.all([
    prisma.especialidad.create({
      data: {
        name: 'Odontología General',
        clinicaId: clinica.id,
      },
    }),
    prisma.especialidad.create({
      data: {
        name: 'Ortodoncia',
        clinicaId: clinica.id,
      },
    }),
    prisma.especialidad.create({
      data: {
        name: 'Endodoncia',
        clinicaId: clinica.id,
      },
    }),
    prisma.especialidad.create({
      data: {
        name: 'Periodoncia',
        clinicaId: clinica.id,
      },
    }),
    prisma.especialidad.create({
      data: {
        name: 'Cirugía Oral',
        clinicaId: clinica.id,
      },
    }),
  ]);

  console.log(`✅ Creadas ${especialidades.length} especialidades`);

  // Crear tratamientos
  console.log('💊 Creando tratamientos...');
  const tratamientos = await Promise.all([
    prisma.tratamiento.create({
      data: {
        name: 'Limpieza Dental',
        descripcion: 'Limpieza profesional de dientes y encías',
        duracionMin: 30,
        precio: 80.00,
        clinicaId: clinica.id,
        estado: 'activo',
      },
    }),
    prisma.tratamiento.create({
      data: {
        name: 'Ortodoncia',
        descripcion: 'Tratamiento de ortodoncia completo',
        duracionMin: 60,
        precio: 2500.00,
        clinicaId: clinica.id,
        estado: 'activo',
      },
    }),
    prisma.tratamiento.create({
      data: {
        name: 'Empaste Dental',
        descripcion: 'Restauración de caries dental',
        duracionMin: 45,
        precio: 120.00,
        clinicaId: clinica.id,
        estado: 'activo',
      },
    }),
    prisma.tratamiento.create({
      data: {
        name: 'Endodoncia',
        descripcion: 'Tratamiento de conducto radicular',
        duracionMin: 90,
        precio: 300.00,
        clinicaId: clinica.id,
        estado: 'activo',
      },
    }),
    prisma.tratamiento.create({
      data: {
        name: 'Extracción Dental',
        descripcion: 'Extracción de diente dañado',
        duracionMin: 30,
        precio: 150.00,
        clinicaId: clinica.id,
        estado: 'activo',
      },
    }),
    prisma.tratamiento.create({
      data: {
        name: 'Blanqueamiento Dental',
        descripcion: 'Tratamiento de blanqueamiento profesional',
        duracionMin: 60,
        precio: 200.00,
        clinicaId: clinica.id,
        estado: 'activo',
      },
    }),
  ]);

  console.log(`✅ Creados ${tratamientos.length} tratamientos`);

  // Crear usuarios profesionales de ejemplo
  console.log('👨‍⚕️ Creando profesionales de ejemplo...');
  const profesionales = await Promise.all([
    prisma.user.create({
      data: {
        email: 'dr.juan.perez@clinicaejemplo.com',
        password: 'password123', // En producción usar hash
        name: 'Dr. Juan Pérez',
        role: 'PROFESSIONAL',
        clinicaId: clinica.id,
        professional: {
          create: {
            name: 'Dr. Juan Pérez',
            defaultDurationMin: 30,
            bufferMin: 10,
          },
        },
      },
      include: {
        professional: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'dra.maria.garcia@clinicaejemplo.com',
        password: 'password123',
        name: 'Dra. María García',
        role: 'PROFESSIONAL',
        clinicaId: clinica.id,
        professional: {
          create: {
            name: 'Dra. María García',
            defaultDurationMin: 45,
            bufferMin: 15,
          },
        },
      },
      include: {
        professional: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'dr.carlos.lopez@clinicaejemplo.com',
        password: 'password123',
        name: 'Dr. Carlos López',
        role: 'PROFESSIONAL',
        clinicaId: clinica.id,
        professional: {
          create: {
            name: 'Dr. Carlos López',
            defaultDurationMin: 60,
            bufferMin: 20,
          },
        },
      },
      include: {
        professional: true,
      },
    }),
  ]);

  console.log(`✅ Creados ${profesionales.length} profesionales`);

  // Asignar especialidades a profesionales
  console.log('🔗 Asignando especialidades a profesionales...');
  await Promise.all([
    // Dr. Juan Pérez - Odontología General
    prisma.professionalEspecialidad.create({
      data: {
        professionalId: profesionales[0].professional!.id,
        especialidadId: especialidades[0].id,
      },
    }),
    // Dra. María García - Ortodoncia
    prisma.professionalEspecialidad.create({
      data: {
        professionalId: profesionales[1].professional!.id,
        especialidadId: especialidades[1].id,
      },
    }),
    // Dr. Carlos López - Endodoncia
    prisma.professionalEspecialidad.create({
      data: {
        professionalId: profesionales[2].professional!.id,
        especialidadId: especialidades[2].id,
      },
    }),
    // Dr. Juan Pérez también puede hacer ortodoncia
    prisma.professionalEspecialidad.create({
      data: {
        professionalId: profesionales[0].professional!.id,
        especialidadId: especialidades[1].id,
      },
    }),
  ]);

  console.log('✅ Especialidades asignadas a profesionales');

  // Asignar tratamientos a profesionales
  console.log('🔗 Asignando tratamientos a profesionales...');
  await Promise.all([
    // Dr. Juan Pérez - Limpieza Dental
    prisma.professionalTratamiento.create({
      data: {
        professionalId: profesionales[0].professional!.id,
        tratamientoId: tratamientos[0].id,
        precio: 80.00,
        duracionMin: 30,
      },
    }),
    // Dr. Juan Pérez - Ortodoncia
    prisma.professionalTratamiento.create({
      data: {
        professionalId: profesionales[0].professional!.id,
        tratamientoId: tratamientos[1].id,
        precio: 2500.00,
        duracionMin: 60,
      },
    }),
    // Dra. María García - Ortodoncia
    prisma.professionalTratamiento.create({
      data: {
        professionalId: profesionales[1].professional!.id,
        tratamientoId: tratamientos[1].id,
        precio: 2500.00,
        duracionMin: 60,
      },
    }),
    // Dr. Carlos López - Endodoncia
    prisma.professionalTratamiento.create({
      data: {
        professionalId: profesionales[2].professional!.id,
        tratamientoId: tratamientos[3].id,
        precio: 300.00,
        duracionMin: 90,
      },
    }),
    // Dr. Juan Pérez - Empaste Dental
    prisma.professionalTratamiento.create({
      data: {
        professionalId: profesionales[0].professional!.id,
        tratamientoId: tratamientos[2].id,
        precio: 120.00,
        duracionMin: 45,
      },
    }),
  ]);

  console.log('✅ Tratamientos asignados a profesionales');

  console.log('🎉 Seed completado exitosamente!');
  console.log(`📊 Resumen:`);
  console.log(`   - Clínica: ${clinica.name}`);
  console.log(`   - Especialidades: ${especialidades.length}`);
  console.log(`   - Tratamientos: ${tratamientos.length}`);
  console.log(`   - Profesionales: ${profesionales.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


