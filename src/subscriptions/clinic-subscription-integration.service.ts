import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class ClinicSubscriptionIntegrationService {
  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async createClinicaWithTrialSubscription(clinicaData: {
    name: string;
    url: string;
    address?: string;
    phone?: string;
    email?: string;
    colorPrimario?: string;
    colorSecundario?: string;
    descripcion?: string;
    estado?: string;
    especialidades?: string[];
    horarios?: Array<{day: string, openTime: string, closeTime: string}>;
    admin?: {
      email: string;
      password: string;
      name: string;
    };
    planPreferido?: string; // 'CORE', 'FLOW', 'NEXUS'
  }) {
    try {
      // Buscar el plan por defecto o el preferido
      let planId: string;
      
      if (clinicaData.planPreferido) {
        const plan = await this.prisma.plan.findFirst({
          where: { 
            nombre: clinicaData.planPreferido,
            activo: true 
          },
        });
        
        if (!plan) {
          throw new BadRequestException(`Plan ${clinicaData.planPreferido} no encontrado`);
        }
        
        planId = plan.id;
      } else {
        // Por defecto, usar el plan CORE
        const defaultPlan = await this.prisma.plan.findFirst({
          where: { 
            nombre: 'CORE',
            activo: true 
          },
        });
        
        if (!defaultPlan) {
          throw new BadRequestException('Plan por defecto (CORE) no encontrado');
        }
        
        planId = defaultPlan.id;
      }

      // Crear la clínica
      const clinica = await this.prisma.clinica.create({
        data: {
          name: clinicaData.name,
          url: clinicaData.url.toLowerCase(),
          address: clinicaData.address || '',
          phone: clinicaData.phone || '',
          email: clinicaData.email,
          colorPrimario: clinicaData.colorPrimario || '#3B82F6',
          colorSecundario: clinicaData.colorSecundario || '#1E40AF',
          descripcion: clinicaData.descripcion || '',
          estado: clinicaData.estado || 'activo',
          estadoPago: 'trial', // Iniciar en trial
          fechaCreacion: new Date(),
        },
      });

      // Crear el usuario admin si se proporciona
      let adminUser: any = null;
      if (clinicaData.admin) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(clinicaData.admin.password, 10);

        adminUser = await this.prisma.user.create({
          data: {
            name: clinicaData.admin.name,
            email: clinicaData.admin.email,
            password: hashedPassword,
            role: 'ADMIN',
            clinicaId: clinica.id,
            estado: 'activo',
          },
        });
      }

      // Crear especialidades si se proporcionan
      if (clinicaData.especialidades?.length) {
        await this.prisma.especialidad.createMany({
          data: clinicaData.especialidades.map((name) => ({
            name,
            clinicaId: clinica.id,
          })),
        });
      }

      // Crear horarios si se proporcionan
      if (clinicaData.horarios?.length) {
        await this.prisma.horario.createMany({
          data: clinicaData.horarios.map((h) => ({
            day: h.day,
            openTime: h.openTime,
            closeTime: h.closeTime,
            clinicaId: clinica.id,
          })),
        });
      }

      // Crear la suscripción de prueba
      const suscripcionResult = await this.subscriptionsService.createTrialSubscription(
        clinica.id,
        planId
      );

      // Obtener la clínica completa con relaciones
      const clinicaCompleta = await this.prisma.clinica.findUnique({
        where: { id: clinica.id },
        include: {
          especialidades: true,
          horarios: true,
          suscripcion: {
            include: { plan: true }
          },
          users: true,
        },
      });

      return {
        success: true,
        message: 'Clínica creada exitosamente con período de prueba',
        clinica: {
          id: clinicaCompleta.id,
          nombre: clinicaCompleta.name,
          url: clinicaCompleta.url,
          email: clinicaCompleta.email,
          colorPrimario: clinicaCompleta.colorPrimario,
          colorSecundario: clinicaCompleta.colorSecundario,
          descripcion: clinicaCompleta.descripcion,
          direccion: clinicaCompleta.address,
          telefono: clinicaCompleta.phone,
          estado: clinicaCompleta.estado,
          estadoPago: clinicaCompleta.estadoPago,
          fechaCreacion: clinicaCompleta.fechaCreacion,
          especialidades: clinicaCompleta.especialidades,
          horarios: clinicaCompleta.horarios,
          admin: adminUser ? {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
          } : null,
          suscripcion: suscripcionResult.suscripcion,
        },
      };
    } catch (error) {
      console.error('Error al crear clínica con suscripción:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getClinicaWithSubscription(clinicaId: string) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: clinicaId },
        include: {
          especialidades: true,
          horarios: true,
          suscripcion: {
            include: {
              plan: true,
              historialPagos: {
                orderBy: { fechaPago: 'desc' },
                take: 5,
              },
            },
          },
          users: {
            where: { role: 'ADMIN' },
          },
        },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      return {
        success: true,
        clinica: {
          id: clinica.id,
          nombre: clinica.name,
          url: clinica.url,
          email: clinica.email,
          colorPrimario: clinica.colorPrimario,
          colorSecundario: clinica.colorSecundario,
          descripcion: clinica.descripcion,
          direccion: clinica.address,
          telefono: clinica.phone,
          estado: clinica.estado,
          estadoPago: clinica.estadoPago,
          fechaCreacion: clinica.fechaCreacion,
          ultimoPago: clinica.ultimoPago,
          proximoPago: clinica.proximoPago,
          especialidades: clinica.especialidades,
          horarios: clinica.horarios,
          admin: clinica.users[0] ? {
            id: clinica.users[0].id,
            email: clinica.users[0].email,
            name: clinica.users[0].name,
          } : null,
          suscripcion: clinica.suscripcion ? {
            id: clinica.suscripcion.id,
            estado: clinica.suscripcion.estado,
            fechaInicio: clinica.suscripcion.fechaInicio,
            fechaFin: clinica.suscripcion.fechaFin,
            fechaTrialFin: clinica.suscripcion.fechaTrialFin,
            ultimoPago: clinica.suscripcion.ultimoPago,
            proximoPago: clinica.suscripcion.proximoPago,
            trialDias: clinica.suscripcion.trialDias,
            autoRenovar: clinica.suscripcion.autoRenovar,
            canceladoEn: clinica.suscripcion.canceladoEn,
            motivoCancelacion: clinica.suscripcion.motivoCancelacion,
            metadata: clinica.suscripcion.metadata,
            plan: {
              id: clinica.suscripcion.plan.id,
              nombre: clinica.suscripcion.plan.nombre,
              tagline: clinica.suscripcion.plan.tagline,
              descripcion: clinica.suscripcion.plan.descripcion,
              precio: clinica.suscripcion.plan.precio,
              moneda: clinica.suscripcion.plan.moneda,
              caracteristicas: clinica.suscripcion.plan.caracteristicas,
              limitaciones: clinica.suscripcion.plan.limitaciones,
            },
            historialPagos: clinica.suscripcion.historialPagos.map(pago => ({
              id: pago.id,
              monto: pago.monto,
              moneda: pago.moneda,
              estado: pago.estado,
              metodoPago: pago.metodoPago,
              fechaPago: pago.fechaPago,
              fechaVencimiento: pago.fechaVencimiento,
              notas: pago.notas,
            })),
          } : null,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener clínica con suscripción:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async checkAndHandleExpiredTrials() {
    try {
      const today = new Date();
      
      // Buscar clínicas con trials expirados
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
        // Actualizar estado de la suscripción
        await this.prisma.suscripcion.update({
          where: { id: suscripcion.id },
          data: { estado: 'expired' },
        });

        // Actualizar estado de pago de la clínica
        await this.prisma.clinica.update({
          where: { id: suscripcion.clinicaId },
          data: { 
            estadoPago: 'vencido',
          },
        });

        // Crear notificación para el admin de la clínica
        const adminUser = await this.prisma.user.findFirst({
          where: {
            clinicaId: suscripcion.clinicaId,
            role: 'ADMIN',
          },
        });

        if (adminUser) {
          await this.prisma.notificacion.create({
            data: {
              titulo: 'Período de prueba expirado',
              mensaje: `Tu período de prueba del plan ${suscripcion.plan.nombre} ha expirado. Para continuar usando el servicio, por favor actualiza tu plan.`,
              tipo: 'warning',
              prioridad: 'alta',
              clinicaId: suscripcion.clinicaId,
              destinatarioId: adminUser.id,
              fechaVencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
            },
          });
        }

        results.push({
          clinicaId: suscripcion.clinicaId,
          clinicaNombre: suscripcion.clinica.name,
          planNombre: suscripcion.plan.nombre,
          fechaTrialFin: suscripcion.fechaTrialFin,
          adminNotificado: !!adminUser,
        });
      }

      return {
        success: true,
        message: `Se procesaron ${results.length} trials expirados`,
        expiredTrials: results,
      };
    } catch (error) {
      console.error('Error al procesar trials expirados:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }
}
