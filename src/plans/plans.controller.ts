import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Planes y Configuración')
@Controller('plans')
export class PlansController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los planes disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de planes obtenida exitosamente' })
  async findAll() {
    try {
      // Definir los planes disponibles
      const planes = [
        {
          id: 'core',
          nombre: 'Core',
          descripcion: 'Plan básico para clínicas pequeñas',
          precio: 29.99,
          caracteristicas: [
            'Hasta 5 profesionales',
            'Gestión básica de turnos',
            'Notificaciones por email',
            'Soporte por email',
          ],
          limitaciones: {
            profesionales: 5,
            turnosPorMes: 100,
            almacenamiento: '1GB',
          },
        },
        {
          id: 'flow',
          nombre: 'Flow',
          descripcion: 'Plan profesional para clínicas medianas',
          precio: 59.99,
          caracteristicas: [
            'Hasta 15 profesionales',
            'Gestión avanzada de turnos',
            'Notificaciones por email y SMS',
            'Reportes básicos',
            'Soporte prioritario',
          ],
          limitaciones: {
            profesionales: 15,
            turnosPorMes: 500,
            almacenamiento: '5GB',
          },
        },
        {
          id: 'nexus',
          nombre: 'Nexus',
          descripcion: 'Plan empresarial para clínicas grandes',
          precio: 99.99,
          caracteristicas: [
            'Profesionales ilimitados',
            'Gestión completa de turnos',
            'Notificaciones por email, SMS y WhatsApp',
            'Reportes avanzados',
            'Integración con sistemas externos',
            'Soporte 24/7',
          ],
          limitaciones: {
            profesionales: -1, // Ilimitado
            turnosPorMes: -1, // Ilimitado
            almacenamiento: '20GB',
          },
        },
      ];

      return {
        success: true,
        data: planes,
        message: 'Planes obtenidos exitosamente',
      };
    } catch (error) {
      console.error('Error obteniendo planes:', error);
      throw new BadRequestException('Error al obtener los planes');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plan específico' })
  @ApiResponse({ status: 200, description: 'Plan obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  async findOne(@Param('id') id: string) {
    try {
      const planes = [
        {
          id: 'core',
          nombre: 'Core',
          descripcion: 'Plan básico para clínicas pequeñas',
          precio: 29.99,
          caracteristicas: [
            'Hasta 5 profesionales',
            'Gestión básica de turnos',
            'Notificaciones por email',
            'Soporte por email',
          ],
          limitaciones: {
            profesionales: 5,
            turnosPorMes: 100,
            almacenamiento: '1GB',
          },
        },
        {
          id: 'flow',
          nombre: 'Flow',
          descripcion: 'Plan profesional para clínicas medianas',
          precio: 59.99,
          caracteristicas: [
            'Hasta 15 profesionales',
            'Gestión avanzada de turnos',
            'Notificaciones por email y SMS',
            'Reportes básicos',
            'Soporte prioritario',
          ],
          limitaciones: {
            profesionales: 15,
            turnosPorMes: 500,
            almacenamiento: '5GB',
          },
        },
        {
          id: 'nexus',
          nombre: 'Nexus',
          descripcion: 'Plan empresarial para clínicas grandes',
          precio: 99.99,
          caracteristicas: [
            'Profesionales ilimitados',
            'Gestión completa de turnos',
            'Notificaciones por email, SMS y WhatsApp',
            'Reportes avanzados',
            'Integración con sistemas externos',
            'Soporte 24/7',
          ],
          limitaciones: {
            profesionales: -1,
            turnosPorMes: -1,
            almacenamiento: '20GB',
          },
        },
      ];

      const plan = planes.find(p => p.id === id);

      if (!plan) {
        throw new NotFoundException('Plan no encontrado');
      }

      return {
        success: true,
        data: plan,
        message: 'Plan obtenido exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo plan:', error);
      throw new BadRequestException('Error al obtener el plan');
    }
  }

  @Get('clinica/:clinicaId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener plan de una clínica específica' })
  @ApiResponse({ status: 200, description: 'Plan de la clínica obtenido exitosamente' })
  async getClinicaPlan(@Param('clinicaId') clinicaId: string) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: clinicaId },
        select: {
          id: true,
          name: true,
          estadoPago: true,
          ultimoPago: true,
          proximoPago: true,
        },
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Obtener estadísticas de uso
      const totalUsuarios = await this.prisma.user.count({
        where: { clinicaId },
      });

      const totalTurnos = await this.prisma.turno.count({
        where: { clinicaId },
      });

      // Determinar el plan actual basado en estadoPago
      const planActual = clinica.estadoPago || 'core';

      // Obtener detalles del plan
      const planes = [
        {
          id: 'core',
          nombre: 'Core',
          precio: 29.99,
          limitaciones: { profesionales: 5, turnosPorMes: 100 },
        },
        {
          id: 'flow',
          nombre: 'Flow',
          precio: 59.99,
          limitaciones: { profesionales: 15, turnosPorMes: 500 },
        },
        {
          id: 'nexus',
          nombre: 'Nexus',
          precio: 99.99,
          limitaciones: { profesionales: -1, turnosPorMes: -1 },
        },
      ];

      const plan = planes.find(p => p.id === planActual);

      return {
        success: true,
        data: {
          clinica: {
            id: clinica.id,
            name: clinica.name,
            planActual: planActual,
            ultimoPago: clinica.ultimoPago,
            proximoPago: clinica.proximoPago,
          },
          plan: plan,
          uso: {
            usuarios: totalUsuarios,
            turnos: totalTurnos,
            limiteUsuarios: plan?.limitaciones.profesionales || 5,
            limiteTurnos: plan?.limitaciones.turnosPorMes || 100,
          },
        },
        message: 'Plan de la clínica obtenido exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo plan de la clínica:', error);
      throw new BadRequestException('Error al obtener el plan de la clínica');
    }
  }

  @Put('clinica/:clinicaId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar plan de clínica' })
  @ApiResponse({ status: 200, description: 'Plan de clínica actualizado exitosamente' })
  async updateClinicaPlan(
    @Param('clinicaId') clinicaId: string,
    @Body() updatePlanDto: { plan: string; simularPago?: boolean },
  ) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: clinicaId },
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Validar que el plan existe
      const planesValidos = ['core', 'flow', 'nexus'];
      if (!planesValidos.includes(updatePlanDto.plan)) {
        throw new BadRequestException('Plan no válido');
      }

      // Actualizar el plan de la clínica
      const updatedClinica = await this.prisma.clinica.update({
        where: { id: clinicaId },
        data: {
          estadoPago: updatePlanDto.plan,
          ultimoPago: updatePlanDto.simularPago ? new Date() : clinica.ultimoPago,
          proximoPago: updatePlanDto.simularPago 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
            : clinica.proximoPago,
        },
      });

      // Crear notificación sobre el cambio de plan
      await this.prisma.notificacion.create({
        data: {
          titulo: 'Plan actualizado',
          mensaje: `El plan de la clínica ha sido actualizado a ${updatePlanDto.plan.toUpperCase()}`,
          tipo: 'info',
          prioridad: 'media',
          clinicaId: clinicaId,
        },
      });

      return {
        success: true,
        data: {
          clinica: updatedClinica,
          plan: updatePlanDto.plan,
          mensaje: updatePlanDto.simularPago 
            ? 'Plan actualizado y pago simulado exitosamente'
            : 'Plan actualizado exitosamente',
        },
        message: 'Plan de clínica actualizado exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error actualizando plan de la clínica:', error);
      throw new BadRequestException('Error al actualizar el plan de la clínica');
    }
  }
} 