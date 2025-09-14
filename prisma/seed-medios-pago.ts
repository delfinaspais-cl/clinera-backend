import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMediosPago() {
  console.log('🌱 Iniciando seed de medios de pago...');

  try {
    // Obtener todas las clínicas
    const clinicas = await prisma.clinica.findMany({
      select: { id: true, name: true },
    });

    if (clinicas.length === 0) {
      console.log('⚠️  No se encontraron clínicas. Ejecuta primero el seed principal.');
      return;
    }

    // Medios de pago comunes
    const mediosPagoComunes = [
      { nombre: 'Efectivo', descripcion: 'Pago en efectivo' },
      { nombre: 'Tarjeta de Débito', descripcion: 'Pago con tarjeta de débito' },
      { nombre: 'Tarjeta de Crédito', descripcion: 'Pago con tarjeta de crédito' },
      { nombre: 'Transferencia Bancaria', descripcion: 'Transferencia bancaria' },
      { nombre: 'Mercado Pago', descripcion: 'Pago a través de Mercado Pago' },
      { nombre: 'PayPal', descripcion: 'Pago a través de PayPal' },
      { nombre: 'Cheque', descripcion: 'Pago con cheque' },
      { nombre: 'Cuenta Corriente', descripcion: 'Pago a cuenta corriente' },
    ];

    let totalCreados = 0;

    for (const clinica of clinicas) {
      console.log(`📋 Creando medios de pago para clínica: ${clinica.name}`);

      for (const medioPago of mediosPagoComunes) {
        try {
          await prisma.medioPago.create({
            data: {
              nombre: medioPago.nombre,
              descripcion: medioPago.descripcion,
              activo: true,
              clinicaId: clinica.id,
            },
          });
          totalCreados++;
        } catch (error) {
          // Si ya existe, no hacer nada
          if (error.code === 'P2002') {
            console.log(`   ⚠️  Medio de pago "${medioPago.nombre}" ya existe en ${clinica.name}`);
          } else {
            console.error(`   ❌ Error creando medio de pago "${medioPago.nombre}":`, error);
          }
        }
      }
    }

    console.log(`✅ Seed de medios de pago completado. ${totalCreados} medios de pago creados.`);
  } catch (error) {
    console.error('❌ Error durante el seed de medios de pago:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  seedMediosPago()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export { seedMediosPago };
