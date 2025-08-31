import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface Payment {
  id: string;
  turnoId: string;
  monto: number;
  metodo: string;
  estado: string;
  fechaPago: string;
  referencia?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getTurnoPaymentDetails(turnoId: string) {
    try {
      const turno = await this.prisma.turno.findUnique({
        where: { id: turnoId },
        select: {
          id: true,
          montoTotal: true,
          montoAbonado: true,
          montoPendiente: true,
          estadoPago: true,
          medioPago: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!turno) {
        throw new Error('Turno no encontrado');
      }

      // Convertir strings a números
      const montoTotal = turno.montoTotal ? parseFloat(turno.montoTotal) : 0;
      const montoAbonado = turno.montoAbonado ? parseFloat(turno.montoAbonado) : 0;
      const montoPendiente = turno.montoPendiente ? parseFloat(turno.montoPendiente) : montoTotal;

      return {
        turnoId: turno.id,
        montoTotal,
        montoAbonado,
        montoPendiente,
        estadoPago: turno.estadoPago,
        medioPago: turno.medioPago,
        fechaCreacion: turno.createdAt,
        ultimaActualizacion: turno.updatedAt,
        // Por ahora, no hay pagos separados, toda la información está en el turno
        pagos: [],
        ultimoPago: null,
      };
    } catch (error) {
      console.error('Error obteniendo detalles de pago:', error);
      throw error;
    }
  }

  async updateTurnoPayment(
    turnoId: string,
    paymentData: {
      montoAbonado?: number;
      montoPendiente?: number;
      estadoPago?: string;
      medioPago?: string;
    },
  ) {
    try {
      const turno = await this.prisma.turno.findUnique({
        where: { id: turnoId },
      });

      if (!turno) {
        throw new Error('Turno no encontrado');
      }

      // Calcular montos
      const montoTotal = turno.montoTotal ? parseFloat(turno.montoTotal) : 0;
      const montoAbonado = paymentData.montoAbonado || 0;
      const montoPendiente = paymentData.montoPendiente || (montoTotal - montoAbonado);

      // Determinar estado de pago automáticamente si no se proporciona
      let estadoPago = paymentData.estadoPago;
      if (!estadoPago) {
        if (montoAbonado >= montoTotal) {
          estadoPago = 'pagado';
        } else if (montoAbonado > 0) {
          estadoPago = 'parcial';
        } else {
          estadoPago = 'pendiente';
        }
      }

      const updatedTurno = await this.prisma.turno.update({
        where: { id: turnoId },
        data: {
          montoAbonado: montoAbonado.toString(),
          montoPendiente: montoPendiente.toString(),
          estadoPago,
          medioPago: paymentData.medioPago,
        },
      });

      return {
        turnoId: updatedTurno.id,
        montoTotal: parseFloat(updatedTurno.montoTotal || '0'),
        montoAbonado: parseFloat(updatedTurno.montoAbonado || '0'),
        montoPendiente: parseFloat(updatedTurno.montoPendiente || '0'),
        estadoPago: updatedTurno.estadoPago,
        medioPago: updatedTurno.medioPago,
      };
    } catch (error) {
      console.error('Error actualizando pago:', error);
      throw error;
    }
  }

  async getInvoicePayments(clinicaUrl: string, turnoId: string): Promise<Payment[]> {
    try {
      // Por ahora, como no hay una tabla separada de pagos,
      // devolvemos un array vacío
      // En el futuro, esto podría consultar una tabla de pagos separada
      return [];
    } catch (error) {
      console.error('Error obteniendo pagos de factura:', error);
      throw error;
    }
  }
}
