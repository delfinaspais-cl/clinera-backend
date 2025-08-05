import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  // 1. Crear Clínica
  const clinica = await prisma.clinica.upsert({
    where: { url: 'clinica-demo' },
    update: {},
    create: {
      name: 'Clínica Demo',
      url: 'clinica-demo',
      address: 'Av. Siempre Viva 123',
      phone: '123456789',
      email: 'info@clinicademo.com',
      logo: 'https://via.placeholder.com/150',
      colorPrimario: '#00AEEF',
      colorSecundario: '#007ACC',
      estado: 'activa',
      estadoPago: 'pagado',
      descripcion: 'Clínica modelo para pruebas.',
      contacto: JSON.stringify({ whatsapp: '1122334455', web: 'clinicademo.com' }),
      especialidades: JSON.stringify(['Cardiología', 'Dermatología']),
    },
  });

  // 2. Usuarios por rol
  const roles = ['ADMIN', 'OWNER', 'SECRETARY', 'PROFESSIONAL', 'PATIENT'] as const;

  for (const role of roles) {
    for (let i = 1; i <= 2; i++) {
      await prisma.user.upsert({
        where: { email: `${role.toLowerCase()}${i}@clinera.io` },
        update: {},
        create: {
          email: `${role.toLowerCase()}${i}@clinera.io`,
          password,
          role,
          name: `${role} ${i}`,
          phone: `+54 11 5555-55${i}${i}`,
          location: 'Buenos Aires',
          bio: `Soy un usuario de tipo ${role.toLowerCase()}`,
          clinicaId: clinica.id,
          estado: 'activo',
        },
      });
    }
  }

  // 3. Crear registros Professional para usuarios con ese rol
  const professionalUsers = await prisma.user.findMany({
    where: { role: 'PROFESSIONAL' },
  });

  for (const user of professionalUsers) {
    await prisma.professional.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: user.name ?? 'Profesional sin nombre',
        specialties: ['Clínica General', 'Pediatría'],
        defaultDurationMin: 30,
        bufferMin: 10,
      },
    });
  }

  // 4. Turnos de prueba
  await prisma.turno.createMany({
    data: [
      {
        paciente: 'Juan Pérez',
        email: 'juan@paciente.com',
        telefono: '1112345678',
        especialidad: 'Cardiología',
        doctor: 'Dra. García',
        fecha: new Date('2025-08-10T10:00:00'),
        hora: '10:00',
        estado: 'confirmado',
        motivo: 'Chequeo general',
        clinicaId: clinica.id,
      },
      {
        paciente: 'Ana Torres',
        email: 'ana@paciente.com',
        telefono: '1122334455',
        especialidad: 'Dermatología',
        doctor: 'Dr. Gómez',
        fecha: new Date('2025-08-12T14:30:00'),
        hora: '14:30',
        estado: 'pendiente',
        motivo: 'Consulta por alergia',
        clinicaId: clinica.id,
      },
    ],
  });

  console.log('✅ Seed ejecutado correctamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });