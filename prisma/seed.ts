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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());