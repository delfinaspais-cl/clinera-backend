import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding tratamientos y especialidades...');

  // Obtener la primera clínica disponible
  const clinica = await prisma.clinica.findFirst();
  if (!clinica) {
    console.log('❌ No se encontró ninguna clínica. Ejecuta primero el seed principal.');
    return;
  }

  console.log(`📋 Clínica encontrada: ${clinica.name}`);

  // Crear especialidades
  const especialidades = await Promise.all([
    prisma.especialidad.create({
      data: {
        name: 'Cardiología',
        clinicaId: clinica.id,
      },
    }),
    prisma.especialidad.create({
      data: {
        name: 'Dermatología',
        clinicaId: clinica.id,
      },
    }),
    prisma.especialidad.create({
      data: {
        name: 'Pediatría',
        clinicaId: clinica.id,
      },
    }),
    prisma.especialidad.create({
      data: {
        name: 'Ginecología',
        clinicaId: clinica.id,
      },
    }),
    prisma.especialidad.create({
      data: {
        name: 'Ortopedia',
        clinicaId: clinica.id,
      },
    }),
    prisma.especialidad.create({
      data: {
        name: 'Neurología',
        clinicaId: clinica.id,
      },
    }),
  ]);

  console.log(`✅ ${especialidades.length} especialidades creadas`);

  // Crear tratamientos
  const tratamientos = await Promise.all([
    prisma.tratamiento.create({
      data: {
        name: 'Consulta General',
        descripcion: 'Consulta médica general de rutina',
        duracionMin: 30,
        precio: 50.0,
        clinicaId: clinica.id,
        estado: 'activo',
      },
    }),
    prisma.tratamiento.create({
      data: {
        name: 'Consulta Especializada',
        descripcion: 'Consulta con especialista',
        duracionMin: 45,
        precio: 80.0,
        clinicaId: clinica.id,
        estado: 'activo',
      },
    }),
    prisma.tratamiento.create({
      data: {
        name: 'Control de Seguimiento',
        descripcion: 'Control de seguimiento de tratamiento',
        duracionMin: 20,
        precio: 30.0,
        clinicaId: clinica.id,
        estado: 'activo',
      },
    }),
    prisma.tratamiento.create({
      data: {
        name: 'Procedimiento Menor',
        descripcion: 'Procedimiento médico menor',
        duracionMin: 60,
        precio: 150.0,
        clinicaId: clinica.id,
        estado: 'activo',
      },
    }),
    prisma.tratamiento.create({
      data: {
        name: 'Evaluación Completa',
        descripcion: 'Evaluación médica completa',
        duracionMin: 90,
        precio: 200.0,
        clinicaId: clinica.id,
        estado: 'activo',
      },
    }),
  ]);

  console.log(`✅ ${tratamientos.length} tratamientos creados`);

  // Obtener profesionales existentes
  const profesionales = await prisma.professional.findMany({
    where: {
      user: {
        clinicaId: clinica.id,
      },
    },
    take: 3, // Solo los primeros 3 para no sobrecargar
  });

  if (profesionales.length === 0) {
    console.log('⚠️ No se encontraron profesionales. Las relaciones se crearán cuando se agreguen profesionales.');
    return;
  }

  console.log(`👨‍⚕️ ${profesionales.length} profesionales encontrados`);

  // Asignar especialidades y tratamientos a profesionales
  for (const profesional of profesionales) {
    // Asignar 2-3 especialidades aleatorias
    const especialidadesAleatorias = especialidades
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 2) + 2);

    for (const especialidad of especialidadesAleatorias) {
      await prisma.professionalEspecialidad.create({
        data: {
          professionalId: profesional.id,
          especialidadId: especialidad.id,
        },
      });
    }

    // Asignar 2-4 tratamientos aleatorios
    const tratamientosAleatorios = tratamientos
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 2);

    for (const tratamiento of tratamientosAleatorios) {
      await prisma.professionalTratamiento.create({
        data: {
          professionalId: profesional.id,
          tratamientoId: tratamiento.id,
          precio: tratamiento.precio ? tratamiento.precio * (0.8 + Math.random() * 0.4) : null, // ±20% del precio base
          duracionMin: tratamiento.duracionMin + Math.floor(Math.random() * 10) - 5, // ±5 minutos
        },
      });
    }
  }

  console.log('✅ Relaciones entre profesionales, especialidades y tratamientos creadas');

  // Mostrar resumen
  const totalEspecialidades = await prisma.especialidad.count({
    where: { clinicaId: clinica.id },
  });
  const totalTratamientos = await prisma.tratamiento.count({
    where: { clinicaId: clinica.id },
  });
  const totalRelacionesEspecialidades = await prisma.professionalEspecialidad.count();
  const totalRelacionesTratamientos = await prisma.professionalTratamiento.count();

  console.log('\n📊 RESUMEN FINAL:');
  console.log(`🏥 Clínica: ${clinica.name}`);
  console.log(`📋 Especialidades: ${totalEspecialidades}`);
  console.log(`💊 Tratamientos: ${totalTratamientos}`);
  console.log(`🔗 Relaciones Profesional-Especialidad: ${totalRelacionesEspecialidades}`);
  console.log(`🔗 Relaciones Profesional-Tratamiento: ${totalRelacionesTratamientos}`);
  console.log('\n🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
