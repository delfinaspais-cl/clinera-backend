import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  // Crear clínica
  const clinica = await prisma.clinica.create({
    data: {
      name: 'Clínica San Martín',
      url: 'clinica-san-martin',
      address: 'Av. San Martín 123',
      phone: '+54 11 1234-5678',
      email: 'info@clinicasanmartin.com',
      logo: 'https://example.com/logo.png',
      colorPrimario: '#3B82F6',
      colorSecundario: '#1E40AF',
      estado: 'activa',
      estadoPago: 'pagado',
      fechaCreacion: new Date('2024-01-15'),
      ultimoPago: new Date('2024-01-15'),
      proximoPago: new Date('2024-02-15'),
      horarios: 'Lunes a Viernes: 8:00 - 20:00',
      especialidades: JSON.stringify(['Cardiología', 'Traumatología', 'Pediatría']),
      descripcion: 'Atención médica de calidad',
      contacto: JSON.stringify({
        whatsapp: '+54 11 1234-5678',
        instagram: '@clinicasanmartin',
        facebook: 'ClinicaSanMartin'
      }),
      rating: 4.8,
      stats: JSON.stringify({
        pacientes: 1500,
        años: 15,
        especialidades: 8
      })
    }
  });

  await prisma.user.create({
    data: {
      email: 'paciente@clinera.io',
      password,
      role: 'PATIENT',
      name: 'Paciente Prueba',
    },
  });

  await prisma.user.create({
    data: {
      email: 'profesional@clinera.io',
      password,
      role: 'PROFESSIONAL',
      name: 'Dra. Profesional',
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@clinera.io',
      password,
      role: 'ADMIN',
      name: 'Admin General',
    },
  });

  // Crear usuario OWNER
  const ownerPassword = await bcrypt.hash('ricardo-2025', 10);
  await prisma.user.create({
    data: {
      email: 'propietario-root',
      password: ownerPassword,
      role: 'OWNER',
      name: 'Propietario Root',
    },
  });

  // Crear usuarios de clínica
  const adminClinicaPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin',
      password: adminClinicaPassword,
      role: 'ADMIN',
      name: 'Admin Clínica',
      clinicaId: clinica.id,
    },
  });

  // Crear algunos turnos de prueba
  await prisma.turno.createMany({
    data: [
      {
        paciente: 'María González',
        email: 'maria.gonzalez@email.com',
        telefono: '+54 11 1234-5678',
        especialidad: 'Cardiología',
        doctor: 'Dr. García',
        fecha: new Date('2024-01-25'),
        hora: '09:00',
        estado: 'confirmado',
        motivo: 'Control cardiológico',
        clinicaId: clinica.id
      },
      {
        paciente: 'Juan Pérez',
        email: 'juan.perez@email.com',
        telefono: '+54 11 2345-6789',
        especialidad: 'Traumatología',
        doctor: 'Dr. López',
        fecha: new Date('2024-01-25'),
        hora: '10:30',
        estado: 'pendiente',
        motivo: 'Consulta por dolor de rodilla',
        clinicaId: clinica.id
      },
      {
        paciente: 'Ana Martínez',
        email: 'ana.martinez@email.com',
        telefono: '+54 11 3456-7890',
        especialidad: 'Cardiología',
        doctor: 'Dr. García',
        fecha: new Date('2024-01-26'),
        hora: '14:00',
        estado: 'confirmado',
        motivo: 'Electrocardiograma',
        clinicaId: clinica.id
      }
    ]
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());