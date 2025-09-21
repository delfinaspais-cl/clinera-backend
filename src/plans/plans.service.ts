import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async getAllPlans() {
    try {
      const plans = await this.prisma.plan.findMany({
        where: { activo: true },
        orderBy: { orden: 'asc' },
      });

      return {
        success: true,
        plans: plans.map(plan => ({
          id: plan.id,
          nombre: plan.nombre,
          tagline: plan.tagline,
          descripcion: plan.descripcion,
          precio: plan.precio,
          moneda: plan.moneda,
          intervalo: plan.intervalo,
          popular: plan.popular,
          icono: plan.icono,
          caracteristicas: plan.caracteristicas,
          limitaciones: plan.limitaciones,
          orden: plan.orden,
        })),
      };
    } catch (error) {
      console.error('Error al obtener planes:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getPlanById(planId: string) {
    try {
      const plan = await this.prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        throw new NotFoundException('Plan no encontrado');
      }

      if (!plan.activo) {
        throw new BadRequestException('El plan no está disponible');
      }

      return {
        success: true,
        plan: {
          id: plan.id,
          nombre: plan.nombre,
          tagline: plan.tagline,
          descripcion: plan.descripcion,
          precio: plan.precio,
          moneda: plan.moneda,
          intervalo: plan.intervalo,
          popular: plan.popular,
          icono: plan.icono,
          caracteristicas: plan.caracteristicas,
          limitaciones: plan.limitaciones,
          orden: plan.orden,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener plan:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getPlanByName(planName: string) {
    try {
      const plan = await this.prisma.plan.findFirst({
        where: { 
          nombre: planName,
          activo: true 
        },
      });

      if (!plan) {
        throw new NotFoundException('Plan no encontrado');
      }

      return {
        success: true,
        plan: {
          id: plan.id,
          nombre: plan.nombre,
          tagline: plan.tagline,
          descripcion: plan.descripcion,
          precio: plan.precio,
          moneda: plan.moneda,
          intervalo: plan.intervalo,
          popular: plan.popular,
          icono: plan.icono,
          caracteristicas: plan.caracteristicas,
          limitaciones: plan.limitaciones,
          orden: plan.orden,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error al obtener plan por nombre:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async createPlan(planData: {
    nombre: string;
    tagline?: string;
    descripcion: string;
    precio: number;
    moneda?: string;
    intervalo?: string;
    popular?: boolean;
    icono?: string;
    caracteristicas: string[];
    limitaciones: any;
    orden?: number;
  }) {
    try {
      // Verificar que no existe un plan con el mismo nombre
      const existingPlan = await this.prisma.plan.findFirst({
        where: { nombre: planData.nombre },
      });

      if (existingPlan) {
        throw new BadRequestException('Ya existe un plan con ese nombre');
      }

      const plan = await this.prisma.plan.create({
        data: {
          nombre: planData.nombre,
          tagline: planData.tagline,
          descripcion: planData.descripcion,
          precio: planData.precio,
          moneda: planData.moneda || 'USD',
          intervalo: planData.intervalo || 'monthly',
          popular: planData.popular || false,
          icono: planData.icono,
          caracteristicas: planData.caracteristicas,
          limitaciones: planData.limitaciones,
          orden: planData.orden || 0,
          activo: true,
        },
      });

      return {
        success: true,
        message: 'Plan creado exitosamente',
        plan: {
          id: plan.id,
          nombre: plan.nombre,
          tagline: plan.tagline,
          descripcion: plan.descripcion,
          precio: plan.precio,
          moneda: plan.moneda,
          intervalo: plan.intervalo,
          popular: plan.popular,
          icono: plan.icono,
          caracteristicas: plan.caracteristicas,
          limitaciones: plan.limitaciones,
          orden: plan.orden,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al crear plan:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async updatePlan(planId: string, planData: Partial<{
    nombre: string;
    tagline: string;
    descripcion: string;
    precio: number;
    moneda: string;
    intervalo: string;
    popular: boolean;
    icono: string;
    caracteristicas: string[];
    limitaciones: any;
    orden: number;
    activo: boolean;
  }>) {
    try {
      // Verificar que el plan existe
      const existingPlan = await this.prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!existingPlan) {
        throw new NotFoundException('Plan no encontrado');
      }

      // Si se está cambiando el nombre, verificar que no existe otro plan con ese nombre
      if (planData.nombre && planData.nombre !== existingPlan.nombre) {
        const duplicatePlan = await this.prisma.plan.findFirst({
          where: { 
            nombre: planData.nombre,
            id: { not: planId }
          },
        });

        if (duplicatePlan) {
          throw new BadRequestException('Ya existe un plan con ese nombre');
        }
      }

      const updatedPlan = await this.prisma.plan.update({
        where: { id: planId },
        data: planData,
      });

      return {
        success: true,
        message: 'Plan actualizado exitosamente',
        plan: {
          id: updatedPlan.id,
          nombre: updatedPlan.nombre,
          tagline: updatedPlan.tagline,
          descripcion: updatedPlan.descripcion,
          precio: updatedPlan.precio,
          moneda: updatedPlan.moneda,
          intervalo: updatedPlan.intervalo,
          popular: updatedPlan.popular,
          icono: updatedPlan.icono,
          caracteristicas: updatedPlan.caracteristicas,
          limitaciones: updatedPlan.limitaciones,
          orden: updatedPlan.orden,
          activo: updatedPlan.activo,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al actualizar plan:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async deletePlan(planId: string) {
    try {
      // Verificar que el plan existe
      const existingPlan = await this.prisma.plan.findUnique({
        where: { id: planId },
        include: {
          suscripciones: true,
        },
      });

      if (!existingPlan) {
        throw new NotFoundException('Plan no encontrado');
      }

      // Verificar que no hay suscripciones activas
      const activeSubscriptions = existingPlan.suscripciones.filter(
        sub => ['trial', 'active'].includes(sub.estado)
      );

      if (activeSubscriptions.length > 0) {
        throw new BadRequestException(
          'No se puede eliminar el plan porque tiene suscripciones activas'
        );
      }

      // Marcar como inactivo en lugar de eliminar
      const updatedPlan = await this.prisma.plan.update({
        where: { id: planId },
        data: { activo: false },
      });

      return {
        success: true,
        message: 'Plan desactivado exitosamente',
        plan: {
          id: updatedPlan.id,
          nombre: updatedPlan.nombre,
          activo: updatedPlan.activo,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al eliminar plan:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getPopularPlan() {
    try {
      const popularPlan = await this.prisma.plan.findFirst({
        where: { 
          popular: true,
          activo: true 
        },
      });

      if (!popularPlan) {
        // Si no hay plan popular, devolver el plan del medio (FLOW)
        const middlePlan = await this.prisma.plan.findFirst({
          where: { 
            nombre: 'FLOW',
            activo: true 
          },
        });

        if (!middlePlan) {
          throw new NotFoundException('No se encontró un plan popular');
        }

        return {
          success: true,
          plan: {
            id: middlePlan.id,
            nombre: middlePlan.nombre,
            tagline: middlePlan.tagline,
            descripcion: middlePlan.descripcion,
            precio: middlePlan.precio,
            moneda: middlePlan.moneda,
            intervalo: middlePlan.intervalo,
            popular: middlePlan.popular,
            icono: middlePlan.icono,
            caracteristicas: middlePlan.caracteristicas,
            limitaciones: middlePlan.limitaciones,
            orden: middlePlan.orden,
          },
        };
      }

      return {
        success: true,
        plan: {
          id: popularPlan.id,
          nombre: popularPlan.nombre,
          tagline: popularPlan.tagline,
          descripcion: popularPlan.descripcion,
          precio: popularPlan.precio,
          moneda: popularPlan.moneda,
          intervalo: popularPlan.intervalo,
          popular: popularPlan.popular,
          icono: popularPlan.icono,
          caracteristicas: popularPlan.caracteristicas,
          limitaciones: popularPlan.limitaciones,
          orden: popularPlan.orden,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error al obtener plan popular:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }
}
