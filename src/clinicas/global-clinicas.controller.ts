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
import { ClinicasService } from './clinicas.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Clínicas Globales')
@Controller('clinicas')
export class GlobalClinicasController {
  constructor(
    private readonly clinicasService: ClinicasService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las clínicas' })
  @ApiResponse({ status: 200, description: 'Lista de clínicas obtenida exitosamente' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'plan', required: false, description: 'Filtrar por plan' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findAll(
    @Query('estado') estado?: string,
    @Query('plan') plan?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const where: any = {};
      if (estado) where.estado = estado;
      if (plan) where.estadoPago = plan;

      const clinicas = await this.prisma.clinica.findMany({
        where,
        take: limitNum,
        skip: offsetNum,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              role: true,
              estado: true,
            },
          },
          turnos: {
            select: {
              id: true,
              estado: true,
              fecha: true,
            },
          },
          _count: {
            select: {
              users: true,
              turnos: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calcular estadísticas para cada clínica
      const clinicasConStats = clinicas.map((clinica) => {
        const turnosPendientes = clinica.turnos.filter(t => t.estado === 'pendiente').length;
        const turnosConfirmados = clinica.turnos.filter(t => t.estado === 'confirmado').length;
        const turnosCancelados = clinica.turnos.filter(t => t.estado === 'cancelado').length;

        return {
          ...clinica,
          estadisticas: {
            totalUsuarios: clinica._count.users,
            totalTurnos: clinica._count.turnos,
            turnosPendientes,
            turnosConfirmados,
            turnosCancelados,
          },
        };
      });

      return {
        success: true,
        data: clinicasConStats,
        message: 'Clínicas obtenidas exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.clinica.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo clínicas:', error);
      throw new BadRequestException('Error al obtener las clínicas');
    }
  }

  @Get('owner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener clínicas del propietario' })
  @ApiResponse({ status: 200, description: 'Clínicas del propietario obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'Token requerido o inválido' })
  @ApiResponse({ status: 403, description: 'Acceso denegado. Se requieren permisos de OWNER' })
  async findOwnerClinicas(@Request() req) {
    try {
      if (req.user.role !== 'OWNER') {
        throw new BadRequestException('Solo los propietarios pueden acceder a este endpoint');
      }

      const clinicas = await this.prisma.clinica.findMany({
        include: {
          users: {
            select: {
              id: true,
              name: true,
              role: true,
              estado: true,
            },
          },
          turnos: {
            select: {
              id: true,
              estado: true,
            },
          },
          _count: {
            select: {
              users: true,
              turnos: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calcular estadísticas para cada clínica
      const clinicasConStats = clinicas.map((clinica) => {
        const turnosPendientes = clinica.turnos.filter(t => t.estado === 'pendiente').length;
        const turnosConfirmados = clinica.turnos.filter(t => t.estado === 'confirmado').length;
        const turnosCancelados = clinica.turnos.filter(t => t.estado === 'cancelado').length;

        return {
          ...clinica,
          estadisticas: {
            totalUsuarios: clinica._count.users,
            totalTurnos: clinica._count.turnos,
            turnosPendientes,
            turnosConfirmados,
            turnosCancelados,
          },
        };
      });

      return {
        success: true,
        data: clinicasConStats,
        message: 'Clínicas del propietario obtenidas exitosamente',
      };
    } catch (error) {
      console.error('Error obteniendo clínicas del owner:', error);
      throw new BadRequestException('Error al obtener las clínicas del propietario');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener clínica específica' })
  @ApiResponse({ status: 200, description: 'Clínica obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async findOne(@Param('id') id: string) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              estado: true,
              createdAt: true,
            },
          },
          turnos: {
            select: {
              id: true,
              paciente: true,
              especialidad: true,
              doctor: true,
              fecha: true,
              estado: true,
            },
            orderBy: {
              fecha: 'desc',
            },
            take: 10, // Solo los últimos 10 turnos
          },
          horarios: true,
          especialidades: true,
          _count: {
            select: {
              users: true,
              turnos: true,
              notificaciones: true,
            },
          },
        },
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Calcular estadísticas
      const turnosPendientes = clinica.turnos.filter(t => t.estado === 'pendiente').length;
      const turnosConfirmados = clinica.turnos.filter(t => t.estado === 'confirmado').length;
      const turnosCancelados = clinica.turnos.filter(t => t.estado === 'cancelado').length;

      const clinicaConStats = {
        ...clinica,
        estadisticas: {
          totalUsuarios: clinica._count.users,
          totalTurnos: clinica._count.turnos,
          turnosPendientes,
          turnosConfirmados,
          turnosCancelados,
          totalNotificaciones: clinica._count.notificaciones,
        },
      };

      return {
        success: true,
        data: clinicaConStats,
        message: 'Clínica obtenida exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo clínica:', error);
      throw new BadRequestException('Error al obtener la clínica');
    }
  }
} 