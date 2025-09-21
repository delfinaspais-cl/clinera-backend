import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async createTrialSubscription(clinicaId: string, planId: string) {
    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: clinicaId },
        include: { suscripcion: true },
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Verificar que no tiene una suscripción activa
      if (clinica.suscripcion) {
        throw new BadRequestException('La clínica ya tiene una suscripción');
      }

      // Verificar que el plan existe
      const plan = await this.prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan || !plan.activo) {
        throw new NotFoundException('Plan no encontrado o inactivo');
      }

      // Calcular fecha de fin del trial (7 días)
      const fechaInicio = new Date();
      const fechaTrialFin = new Date();
      fechaTrialFin.setDate(fechaTrialFin.getDate() + 7);

      // Crear la suscripción en estado trial
      const suscripcion = await this.prisma.suscripcion.create({
        data: {
          clinicaId,
          planId,
          estado: 'trial',
          fechaInicio,
          fechaTrialFin,
          trialDias: 7,
          autoRenovar: true,
          metadata: {
            limiteProfesionales: plan.limitaciones?.profesionales || 3,
            limiteUam: plan.limitaciones?.uam || 1000,
            profesionalesUsados: 0,
            uamUsadas: 0,
          },
        },
        include: {
          plan: true,
          clinica: true,
        },
      });

      // Actualizar el estado de pago de la clínica
      await this.prisma.clinica.update({
        where: { id: clinicaId },
        data: { estadoPago: 'trial' },
      });

      return {
        success: true,
        message: 'Período de prueba iniciado exitosamente',
        suscripcion: {
          id: suscripcion.id,
          estado: suscripcion.estado,
          fechaInicio: suscripcion.fechaInicio,
          fechaTrialFin: suscripcion.fechaTrialFin,
          trialDias: suscripcion.trialDias,
          plan: {
            id: suscripcion.plan.id,
            nombre: suscripcion.plan.nombre,
            tagline: suscripcion.plan.tagline,
            precio: suscripcion.plan.precio,
            caracteristicas: suscripcion.plan.caracteristicas,
          },
          metadata: suscripcion.metadata,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al crear suscripción de prueba:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async upgradeSubscription(clinicaId: string, planId: string, metodoPago?: string) {
    try {
      // Verificar que la clínica existe y tiene suscripción
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: clinicaId },
        include: { 
          suscripcion: {
            include: { plan: true }
          }
        },
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      if (!clinica.suscripcion) {
        throw new BadRequestException('La clínica no tiene una suscripción');
      }

      // Verificar que el plan existe
      const newPlan = await this.prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!newPlan || !newPlan.activo) {
        throw new NotFoundException('Plan no encontrado o inactivo');
      }

      // Calcular fechas
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setMonth(fechaFin.getMonth() + 1); // Próximo mes

      // Actualizar la suscripción
      const updatedSuscripcion = await this.prisma.suscripcion.update({
        where: { clinicaId },
        data: {
          planId,
          estado: 'active',
          fechaInicio,
          fechaFin,
          proximoPago: fechaFin,
          metodoPago: metodoPago || 'manual',
          metadata: {
            limiteProfesionales: newPlan.limitaciones?.profesionales || 3,
            limiteUam: newPlan.limitaciones?.uam || 1000,
            profesionalesUsados: clinica.suscripcion.metadata?.profesionalesUsados || 0,
            uamUsadas: clinica.suscripcion.metadata?.uamUsadas || 0,
          },
        },
        include: {
          plan: true,
        },
      });

      // Crear registro de pago
      await this.prisma.historialPago.create({
        data: {
          suscripcionId: updatedSuscripcion.id,
          planId,
          monto: newPlan.precio,
          moneda: newPlan.moneda,
          estado: 'completed',
          metodoPago: metodoPago || 'manual',
          fechaPago: fechaInicio,
          fechaVencimiento: fechaFin,
          notas: `Upgrade a plan ${newPlan.nombre}`,
        },
      });

      // Actualizar el estado de pago de la clínica
      await this.prisma.clinica.update({
        where: { id: clinicaId },
        data: { 
          estadoPago: 'pagado',
          ultimoPago: fechaInicio,
          proximoPago: fechaFin,
        },
      });

      return {
        success: true,
        message: 'Suscripción actualizada exitosamente',
        suscripcion: {
          id: updatedSuscripcion.id,
          estado: updatedSuscripcion.estado,
          fechaInicio: updatedSuscripcion.fechaInicio,
          fechaFin: updatedSuscripcion.fechaFin,
          proximoPago: updatedSuscripcion.proximoPago,
          plan: {
            id: updatedSuscripcion.plan.id,
            nombre: updatedSuscripcion.plan.nombre,
            tagline: updatedSuscripcion.plan.tagline,
            precio: updatedSuscripcion.plan.precio,
            caracteristicas: updatedSuscripcion.plan.caracteristicas,
          },
          metadata: updatedSuscripcion.metadata,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al actualizar suscripción:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getSubscriptionByClinicaId(clinicaId: string) {
    try {
      const suscripcion = await this.prisma.suscripcion.findUnique({
        where: { clinicaId },
        include: {
          plan: true,
          historialPagos: {
            orderBy: { fechaPago: 'desc' },
            take: 5,
          },
        },
      });

      if (!suscripcion) {
        throw new NotFoundException('Suscripción no encontrada');
      }

      return {
        success: true,
        suscripcion: {
          id: suscripcion.id,
          estado: suscripcion.estado,
          fechaInicio: suscripcion.fechaInicio,
          fechaFin: suscripcion.fechaFin,
          fechaTrialFin: suscripcion.fechaTrialFin,
          ultimoPago: suscripcion.ultimoPago,
          proximoPago: suscripcion.proximoPago,
          trialDias: suscripcion.trialDias,
          autoRenovar: suscripcion.autoRenovar,
          canceladoEn: suscripcion.canceladoEn,
          motivoCancelacion: suscripcion.motivoCancelacion,
          metadata: suscripcion.metadata,
          plan: {
            id: suscripcion.plan.id,
            nombre: suscripcion.plan.nombre,
            tagline: suscripcion.plan.tagline,
            descripcion: suscripcion.plan.descripcion,
            precio: suscripcion.plan.precio,
            moneda: suscripcion.plan.moneda,
            caracteristicas: suscripcion.plan.caracteristicas,
            limitaciones: suscripcion.plan.limitaciones,
          },
          historialPagos: suscripcion.historialPagos.map(pago => ({
            id: pago.id,
            monto: pago.monto,
            moneda: pago.moneda,
            estado: pago.estado,
            metodoPago: pago.metodoPago,
            fechaPago: pago.fechaPago,
            fechaVencimiento: pago.fechaVencimiento,
            notas: pago.notas,
          })),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error al obtener suscripción:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async cancelSubscription(clinicaId: string, motivo?: string) {
    try {
      const suscripcion = await this.prisma.suscripcion.findUnique({
        where: { clinicaId },
        include: { plan: true },
      });

      if (!suscripcion) {
        throw new NotFoundException('Suscripción no encontrada');
      }

      if (suscripcion.estado === 'cancelled') {
        throw new BadRequestException('La suscripción ya está cancelada');
      }

      // Actualizar la suscripción
      const updatedSuscripcion = await this.prisma.suscripcion.update({
        where: { clinicaId },
        data: {
          estado: 'cancelled',
          canceladoEn: new Date(),
          motivoCancelacion: motivo || 'Cancelado por el usuario',
          autoRenovar: false,
        },
      });

      // Actualizar el estado de pago de la clínica
      await this.prisma.clinica.update({
        where: { id: clinicaId },
        data: { 
          estadoPago: 'cancelado',
        },
      });

      return {
        success: true,
        message: 'Suscripción cancelada exitosamente',
        suscripcion: {
          id: updatedSuscripcion.id,
          estado: updatedSuscripcion.estado,
          canceladoEn: updatedSuscripcion.canceladoEn,
          motivoCancelacion: updatedSuscripcion.motivoCancelacion,
          autoRenovar: updatedSuscripcion.autoRenovar,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al cancelar suscripción:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async checkTrialExpiration() {
    try {
      const today = new Date();
      
      // Buscar suscripciones en trial que expiran hoy
      const expiredTrials = await this.prisma.suscripcion.findMany({
        where: {
          estado: 'trial',
          fechaTrialFin: {
            lte: today,
          },
        },
        include: {
          clinica: true,
          plan: true,
        },
      });

      const results = [];

      for (const suscripcion of expiredTrials) {
        // Actualizar estado a expired
        await this.prisma.suscripcion.update({
          where: { id: suscripcion.id },
          data: { estado: 'expired' },
        });

        // Actualizar estado de pago de la clínica
        await this.prisma.clinica.update({
          where: { id: suscripcion.clinicaId },
          data: { estadoPago: 'vencido' },
        });

        results.push({
          clinicaId: suscripcion.clinicaId,
          clinicaNombre: suscripcion.clinica.name,
          planNombre: suscripcion.plan.nombre,
          fechaTrialFin: suscripcion.fechaTrialFin,
        });
      }

      return {
        success: true,
        message: `Se procesaron ${results.length} suscripciones expiradas`,
        expiredTrials: results,
      };
    } catch (error) {
      console.error('Error al verificar expiración de trials:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getSubscriptionUsage(clinicaId: string) {
    try {
      const suscripcion = await this.prisma.suscripcion.findUnique({
        where: { clinicaId },
        include: {
          plan: true,
          clinica: {
            include: {
              users: {
                where: { role: 'PROFESSIONAL' },
              },
            },
          },
        },
      });

      if (!suscripcion) {
        throw new NotFoundException('Suscripción no encontrada');
      }

      // Contar profesionales actuales
      const profesionalesUsados = suscripcion.clinica.users.length;

      // Calcular UAM usadas (esto se puede personalizar según tu lógica de negocio)
      const uamUsadas = await this.calculateUAMUsage(clinicaId);

      // Actualizar metadata con uso actual
      const updatedMetadata = {
        ...suscripcion.metadata,
        profesionalesUsados,
        uamUsadas,
      };

      await this.prisma.suscripcion.update({
        where: { id: suscripcion.id },
        data: { metadata: updatedMetadata },
      });

      const plan = suscripcion.plan;
      const limitaciones = plan.limitaciones as any;

      return {
        success: true,
        usage: {
          profesionales: {
            usados: profesionalesUsados,
            limite: limitaciones?.profesionales || 3,
            extraDisponibles: limitaciones?.profesionales ? 
              Math.max(0, profesionalesUsados - limitaciones.profesionales) : 0,
            costoExtra: limitaciones?.extraProfesional || 10,
          },
          uam: {
            usadas: uamUsadas,
            limite: limitaciones?.uam || 1000,
            extraDisponibles: limitaciones?.uam ? 
              Math.max(0, uamUsadas - limitaciones.uam) : 0,
            costoExtra: limitaciones?.extraUam || 0.25,
          },
          almacenamiento: {
            limite: limitaciones?.almacenamiento || '1GB',
          },
        },
        suscripcion: {
          estado: suscripcion.estado,
          plan: plan.nombre,
          fechaFin: suscripcion.fechaFin,
          fechaTrialFin: suscripcion.fechaTrialFin,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error al obtener uso de suscripción:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  private async calculateUAMUsage(clinicaId: string): Promise<number> {
    try {
      // Esta es una implementación básica de UAM (Unidades de Actividad Mensual)
      // Puedes personalizarla según tu lógica de negocio
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Contar turnos creados este mes
      const turnosCount = await this.prisma.turno.count({
        where: {
          clinicaId,
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      // Contar mensajes enviados este mes
      const mensajesCount = await this.prisma.mensaje.count({
        where: {
          clinicaId,
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      // Contar conversaciones activas este mes
      const conversacionesCount = await this.prisma.conversation.count({
        where: {
          clinicaId,
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      // Calcular UAM total (puedes ajustar estos pesos)
      const uamTotal = (turnosCount * 1) + (mensajesCount * 0.1) + (conversacionesCount * 0.5);
      
      return Math.round(uamTotal);
    } catch (error) {
      console.error('Error al calcular UAM:', error);
      return 0;
    }
  }
}
