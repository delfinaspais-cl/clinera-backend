import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  await prisma.user.create({
    data: {
      email: 'paciente@clinera.io',
      password,
      role: 'PATIENT',
      patient: {
        create: {
          name: 'Paciente Prueba',
          birthDate: new Date('1990-01-01'),
          phone: '1234567890',
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'profesional@clinera.io',
      password,
      role: 'PROFESSIONAL',
      professional: {
        create: {
          name: 'Dra. Profesional',
          specialties: ['dermatología'],
          defaultDurationMin: 30,
          bufferMin: 10,
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@clinera.io',
      password,
      role: 'ADMIN',
      admin: {
        create: {
          clinicId: null,
        },
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
