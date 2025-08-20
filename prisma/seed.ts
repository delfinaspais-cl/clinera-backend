import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  // 1. Crea clínica
  const clinica = await prisma.clinica.upsert({
    where: { url: 'clinica-demo' },
    update: {},
    create: {
      name: 'Clínica Demo',
      url: 'clinica-demo',
      colorPrimario: '#3B82F6',
      colorSecundario: '#1E40AF',
      estado: 'activa',
      estadoPago: 'pagado',
      fechaCreacion: new Date(),
      ultimoPago: new Date(),
      proximoPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 2. Crea especialidades relacionadas
  await prisma.especialidad.createMany({
    data: [
      { name: 'Cardiología', clinicaId: clinica.id },
      { name: 'Dermatología', clinicaId: clinica.id },
      { name: 'Pediatría', clinicaId: clinica.id },
    ],
  });

  // 3. Crea horarios (corrigiendo los días)
  await prisma.horario.createMany({
    data: [
      { day: 'LUNES', openTime: '08:00', closeTime: '16:00', clinicaId: clinica.id },
      { day: 'MARTES', openTime: '09:00', closeTime: '17:00', clinicaId: clinica.id },
      { day: 'MIERCOLES', openTime: '10:00', closeTime: '18:00', clinicaId: clinica.id },
    ],
  });

  // 4. Crea usuarios por rol
  const roles = ['ADMIN', 'SECRETARY', 'PROFESSIONAL', 'PATIENT'] as const;

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

  // 5. Crea usuarios OWNER (sin clinicaId)
  for (let i = 1; i <= 2; i++) {
    await prisma.user.upsert({
      where: { email: `owner${i}@clinera.io` },
      update: {},
      create: {
        email: `owner${i}@clinera.io`,
        password,
        role: 'OWNER',
        name: `Owner ${i}`,
        phone: `+54 11 5555-55${i}${i}`,
        location: 'Buenos Aires',
        bio: 'Soy un propietario del sistema',
        clinicaId: null, // Los OWNER no tienen clínica específica
        estado: 'activo',
      },
    });
  }

  // 6. Crea profesionales
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

  // 7. Crea pacientes (relacionados con usuarios de rol PATIENT)
  const patientUsers = await prisma.user.findMany({
    where: { role: 'PATIENT' },
  });
  for (const user of patientUsers) {
    await prisma.patient.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: user.name ?? 'Paciente sin nombre',
        birthDate: new Date('1990-01-01'),
        phone: user.phone,
        notes: 'Paciente de prueba',
      },
    });
  }

  // 7. Crea agendas para profesionales
  const professionals = await prisma.professional.findMany();
  for (const prof of professionals) {
    await prisma.agenda.create({
      data: {
        professionalId: prof.id,
        dia: 'LUNES',
        horaInicio: '08:00',
        horaFin: '12:00',
        duracionMin: 30,
      },
    });
  }

  // 8. Crea turnos de prueba
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

  // 9. Crea mensajes de ejemplo
  await prisma.mensaje.createMany({
    data: [
      {
        asunto: 'Bienvenida',
        mensaje: '¡Bienvenido a la clínica!',
        tipo: 'general',
        clinicaId: clinica.id,
      },
      {
        asunto: 'Recordatorio de pago',
        mensaje: 'Recuerda abonar tu cuota mensual.',
        tipo: 'pago',
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