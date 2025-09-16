import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos de prueba...');

  // Crear clínica de prueba
  const testClinica = await prisma.clinica.upsert({
    where: { url: 'clinica-test' },
    update: {},
    create: {
      name: 'Clínica Test',
      url: 'clinica-test',
      address: 'Av. Test 123',
      phone: '+5491112345678',
      email: 'test@clinica.com',
      colorPrimario: '#3B82F6',
      colorSecundario: '#1E40AF',
      descripcion: 'Clínica de prueba para testing',
      contacto: 'Test Contact',
      estado: 'activa',
      estadoPago: 'pagado',
      fechaCreacion: new Date(),
      ultimoPago: new Date(),
      proximoPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      rating: 4.5,
      stats: null,
    },
  });

  console.log('✅ Clínica de prueba creada:', testClinica.name);

  // Crear usuario de prueba (OWNER)
  const testUser = await prisma.user.upsert({
    where: { id: 'test-user-id' },
    update: {},
    create: {
      name: 'Test Owner',
      email: 'test@example.com',
      password: 'hashed_password', // En producción usar hash real
      role: 'OWNER',
      estado: 'activo',
      clinicaId: testClinica.id,
    },
  });

  console.log('✅ Usuario de prueba creado:', testUser.name);

  // Crear algunos turnos de prueba
  const testTurnos = await Promise.all([
    prisma.turno.create({
      data: {
        paciente: 'Juan Pérez',
        email: 'juan@test.com',
        telefono: '+5491112345678',
        doctor: 'Dr. Test',
        fecha: new Date('2025-08-20'),
        hora: '10:00',
        estado: 'pendiente',
        motivo: 'Consulta de prueba',
        clinicaId: testClinica.id,
      },
    }),
    prisma.turno.create({
      data: {
        paciente: 'María García',
        email: 'maria@test.com',
        telefono: '+5491187654321',
        doctor: 'Dr. Cardiólogo',
        fecha: new Date('2025-08-21'),
        hora: '14:30',
        estado: 'confirmado',
        motivo: 'Control cardiológico',
        clinicaId: testClinica.id,
      },
    }),
  ]);

  console.log('✅ Turnos de prueba creados:', testTurnos.length);

  // Crear notificaciones de prueba
  const testNotificaciones = await Promise.all([
    prisma.notificacion.create({
      data: {
        titulo: 'Nuevo turno solicitado',
        mensaje: 'Se ha solicitado un nuevo turno para Juan Pérez',
        tipo: 'info',
        prioridad: 'media',
        clinicaId: testClinica.id,
      },
    }),
    prisma.notificacion.create({
      data: {
        titulo: 'Turno confirmado',
        mensaje: 'El turno de María García ha sido confirmado',
        tipo: 'success',
        prioridad: 'baja',
        clinicaId: testClinica.id,
      },
    }),
  ]);

  console.log('✅ Notificaciones de prueba creadas:', testNotificaciones.length);

  console.log('🎉 Seed de datos de prueba completado exitosamente!');
  console.log('');
  console.log('📋 Datos creados:');
  console.log(`   - Clínica: ${testClinica.name} (${testClinica.url})`);
  console.log(`   - Usuario: ${testUser.name} (${testUser.role})`);
  console.log(`   - Turnos: ${testTurnos.length}`);
  console.log(`   - Notificaciones: ${testNotificaciones.length}`);
  console.log('');
  console.log('🔗 URLs de prueba:');
  console.log(`   - Clínica: https://clinera-backend-develop.up.railway.app/clinicas`);
  console.log(`   - Turnos públicos: POST /turnos/public con clinicaUrl: "clinica-test"`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 