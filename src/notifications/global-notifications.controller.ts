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

@ApiTags('Notificaciones Globales')
@Controller('notifications')
export class GlobalNotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas las notificaciones' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones obtenida exitosamente' })
  @ApiQuery({ name: 'clinicaId', required: false, description: 'Filtrar por clínica' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Filtrar por tipo' })
  @ApiQuery({ name: 'leida', required: false, description: 'Filtrar por estado de lectura' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findAll(
    @Query('clinicaId') clinicaId?: string,
    @Query('tipo') tipo?: string,
    @Query('leida') leida?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const where: any = {};
      if (clinicaId) where.clinicaId = clinicaId;
      if (tipo) where.tipo = tipo;
      if (leida !== undefined) where.leida = leida === 'true';

      const notificaciones = await this.prisma.notificacion.findMany({
        where,
        take: limitNum,
        skip: offsetNum,
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
          destinatario: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: notificaciones,
        message: 'Notificaciones obtenidas exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.notificacion.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      throw new BadRequestException('Error al obtener las notificaciones');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener notificación específica' })
  @ApiResponse({ status: 200, description: 'Notificación obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async findOne(@Param('id') id: string) {
    try {
      const notificacion = await this.prisma.notificacion.findUnique({
        where: { id },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
          destinatario: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      if (!notificacion) {
        throw new NotFoundException('Notificación no encontrada');
      }

      return {
        success: true,
        data: notificacion,
        message: 'Notificación obtenida exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo notificación:', error);
      throw new BadRequestException('Error al obtener la notificación');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nueva notificación' })
  @ApiResponse({ status: 201, description: 'Notificación creada exitosamente' })
  async create(@Body() createNotificacionDto: any) {
    try {
      // Validar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: createNotificacionDto.clinicaId },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Validar que el destinatario existe si se especifica
      if (createNotificacionDto.destinatarioId) {
        const destinatario = await this.prisma.user.findUnique({
          where: { id: createNotificacionDto.destinatarioId },
        });

        if (!destinatario) {
          throw new BadRequestException('Destinatario no encontrado');
        }
      }

      const notificacion = await this.prisma.notificacion.create({
        data: {
          titulo: createNotificacionDto.titulo,
          mensaje: createNotificacionDto.mensaje,
          tipo: createNotificacionDto.tipo || 'info',
          prioridad: createNotificacionDto.prioridad || 'media',
          leida: false,
          clinicaId: createNotificacionDto.clinicaId,
          destinatarioId: createNotificacionDto.destinatarioId,
          fechaVencimiento: createNotificacionDto.fechaVencimiento 
            ? new Date(createNotificacionDto.fechaVencimiento) 
            : null,
        },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
          destinatario: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return {
        success: true,
        data: notificacion,
        message: 'Notificación creada exitosamente',
      };
    } catch (error) {
      console.error('Error creando notificación:', error);
      throw new BadRequestException('Error al crear la notificación');
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída exitosamente' })
  async markAsRead(@Param('id') id: string) {
    try {
      const notificacion = await this.prisma.notificacion.findUnique({
        where: { id },
      });

      if (!notificacion) {
        throw new NotFoundException('Notificación no encontrada');
      }

      const updatedNotificacion = await this.prisma.notificacion.update({
        where: { id },
        data: {
          leida: true,
        },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
          destinatario: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return {
        success: true,
        data: updatedNotificacion,
        message: 'Notificación marcada como leída exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error marcando notificación como leída:', error);
      throw new BadRequestException('Error al marcar la notificación como leída');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar notificación' })
  @ApiResponse({ status: 200, description: 'Notificación eliminada exitosamente' })
  async remove(@Param('id') id: string) {
    try {
      const notificacion = await this.prisma.notificacion.findUnique({
        where: { id },
      });

      if (!notificacion) {
        throw new NotFoundException('Notificación no encontrada');
      }

      await this.prisma.notificacion.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Notificación eliminada exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error eliminando notificación:', error);
      throw new BadRequestException('Error al eliminar la notificación');
    }
  }

  @Get('clinica/:clinicaId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener notificaciones de una clínica específica' })
  @ApiResponse({ status: 200, description: 'Notificaciones de la clínica obtenidas exitosamente' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Filtrar por tipo' })
  @ApiQuery({ name: 'leida', required: false, description: 'Filtrar por estado de lectura' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findByClinica(
    @Param('clinicaId') clinicaId: string,
    @Query('tipo') tipo?: string,
    @Query('leida') leida?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const where: any = { clinicaId };
      if (tipo) where.tipo = tipo;
      if (leida !== undefined) where.leida = leida === 'true';

      const notificaciones = await this.prisma.notificacion.findMany({
        where,
        take: limitNum,
        skip: offsetNum,
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
          destinatario: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: notificaciones,
        message: 'Notificaciones de la clínica obtenidas exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.notificacion.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo notificaciones de la clínica:', error);
      throw new BadRequestException('Error al obtener las notificaciones de la clínica');
    }
  }
} 