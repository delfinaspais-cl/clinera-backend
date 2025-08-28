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

  // 8. Crea turnos de prueba con los nuevos campos
  const professionalId = professionals[0]?.id;

  // Turnos para hoy (que coincidan con el frontend)
  const hoy = new Date();
  const turnosHoy = [
    {
      paciente: 'Maria González',
      email: 'maria@email.com',
      telefono: '+56912345678',
      doctor: 'Dra. Franco Chemar',
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 9, 0),
      hora: '09:00',
      duracionMin: 60,
      estado: 'confirmado',
      motivo: 'Limpieza dental',
      servicio: 'Limpieza dental',
      notas: 'Primera visita, paciente con miedo al dentista',
      clinicaId: clinica.id,
      professionalId,
    },
    {
      paciente: 'Carlos Pérez',
      email: 'carlos@email.com',
      telefono: '+56987654321',
      doctor: 'Dr. Martinez',
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 10, 30),
      hora: '10:30',
      duracionMin: 90,
      estado: 'pendiente',
      motivo: 'Endodoncia',
      servicio: 'Endodoncia',
      notas: 'Continuación de tratamiento, segunda sesión',
      clinicaId: clinica.id,
      professionalId,
    },
    {
      paciente: 'Ana Martinez',
      email: 'ana@email.com',
      telefono: '+56955667788',
      doctor: 'Dra. Franco Chemar',
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12, 0),
      hora: '12:00',
      duracionMin: 45,
      estado: 'completado',
      motivo: 'Control ortodoncia',
      servicio: 'Control ortodoncia',
      notas: 'Revisión mensual, ajuste de brackets',
      clinicaId: clinica.id,
      professionalId,
    },
    {
      paciente: 'Luis Silva',
      email: 'luis@email.com',
      telefono: '+56911223344',
      doctor: 'Dr. Martinez',
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 14, 30),
      hora: '14:30',
      duracionMin: 60,
      estado: 'cancelado',
      motivo: 'Extracción',
      servicio: 'Extracción',
      notas: 'Cancelada por el paciente, reprogramar',
      clinicaId: clinica.id,
      professionalId,
    },
    {
      paciente: 'Patricia López',
      email: 'patricia@email.com',
      telefono: '+56912345678',
      doctor: 'Dr. Martinez',
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 16, 0),
      hora: '16:00',
      duracionMin: 45,
      estado: 'confirmado',
      motivo: 'Consulta general',
      servicio: 'Consulta general',
      notas: 'Dolor en muela del juicio, posible extracción',
      clinicaId: clinica.id,
      professionalId,
    },
  ];

  // Turnos para otros días (para el calendario)
  const turnosOtrosDias = [
    {
      paciente: 'Roberto Díaz',
      email: 'roberto@email.com',
      telefono: '+56999887766',
      doctor: 'Dra. Franco Chemar',
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 11, 0),
      hora: '11:00',
      duracionMin: 30,
      estado: 'confirmado',
      motivo: 'Consulta de rutina',
      servicio: 'Consulta de rutina',
      notas: 'Paciente regular, sin problemas',
      clinicaId: clinica.id,
      professionalId,
    },
    {
      paciente: 'Carmen Ruiz',
      email: 'carmen@email.com',
      telefono: '+56955443322',
      doctor: 'Dr. Martinez',
      fecha: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 2, 15, 0),
      hora: '15:00',
      duracionMin: 60,
      estado: 'pendiente',
      motivo: 'Blanqueamiento dental',
      servicio: 'Blanqueamiento dental',
      notas: 'Primera sesión de blanqueamiento',
      clinicaId: clinica.id,
      professionalId,
    },
  ];

  await prisma.turno.createMany({
    data: [...turnosHoy, ...turnosOtrosDias],
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