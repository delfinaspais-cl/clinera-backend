import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlans() {
  console.log('🌱 Seeding plans...');

  try {
    // Limpiar planes existentes
    await prisma.plan.deleteMany();

    // Crear los 3 planes según la imagen
    const plans = [
      {
        nombre: 'CORE',
        tagline: 'Agenda + Ventas',
        descripcion: 'Plan básico con funcionalidades esenciales de agenda y ventas',
        precio: 70.00,
        moneda: 'USD',
        intervalo: 'monthly',
        activo: true,
        popular: false,
        orden: 1,
        caracteristicas: [
          'Agenda 24/7',
          'Vista calendario y agenda',
          'Panel de ventas básico',
          'Gestión de clientes',
          'Gestión de citas'
        ],
        limitaciones: {
          profesionales: 3,
          uam: 1000,
          extraProfesional: 10,
          extraUam: 0.25,
          almacenamiento: '1GB'
        }
      },
      {
        nombre: 'FLOW',
        tagline: 'Agenda + Ventas + Mensajería',
        descripcion: 'Plan intermedio que incluye mensajería omnicanal y plantillas WhatsApp',
        precio: 120.00,
        moneda: 'USD',
        intervalo: 'monthly',
        activo: true,
        popular: true, // Este es el plan popular
        orden: 2,
        caracteristicas: [
          'Todo CORE',
          'Mensajería omnicanal',
          'Plantillas WhatsApp HSM',
          'Embudo de contactos y etapas',
          'Webhook de WhatsApp',
          'Gestión de citas desde el chat'
        ],
        limitaciones: {
          profesionales: 3,
          uam: 2000,
          extraProfesional: 15,
          extraUam: 0.25,
          almacenamiento: '2GB'
        }
      },
      {
        nombre: 'NEXUS',
        tagline: 'FLOW + IA + API + Builder',
        descripcion: 'Plan avanzado con IA, APIs y herramientas de construcción avanzadas',
        precio: 180.00,
        moneda: 'USD',
        intervalo: 'monthly',
        activo: true,
        popular: false,
        orden: 3,
        icono: 'robot', // Para el ícono de robot
        caracteristicas: [
          'Todo FLOW',
          'Asistente IA en chat',
          'API y webhooks para integraciones',
          'Creador de embudos avanzado',
          'Reportes y paneles avanzados'
        ],
        limitaciones: {
          profesionales: 3,
          uam: 3000,
          extraProfesional: 20,
          extraUam: 0.25,
          almacenamiento: '5GB'
        }
      }
    ];

    for (const planData of plans) {
      const plan = await prisma.plan.create({
        data: planData,
      });
      console.log(`✅ Plan ${plan.nombre} creado con ID: ${plan.id}`);
    }

    console.log('🎉 Plans seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding plans:', error);
    throw error;
  }
}

async function main() {
  await seedPlans();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
