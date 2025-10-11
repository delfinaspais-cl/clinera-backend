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

  @Get('check-url/:url')
  @ApiOperation({ summary: 'Verificar disponibilidad de URL de clínica (PÚBLICO)' })
  @ApiResponse({ status: 200, description: 'Verificación completada' })
  async checkUrlAvailability(@Param('url') url: string) {
    try {
      // Normalizar URL a minúsculas
      const urlNormalizada = url.toLowerCase().trim();
      
      // Validar formato de URL (solo letras, números, guiones)
      const urlRegex = /^[a-zA-Z0-9-]+$/;
      if (!urlRegex.test(urlNormalizada)) {
        return {
          success: true,
          available: false,
          message: 'La URL solo puede contener letras, números y guiones',
        };
      }

      // Verificar si la URL ya existe
      const existingClinica = await this.prisma.clinica.findFirst({
        where: { url: urlNormalizada },
      });

      return {
        success: true,
        available: !existingClinica,
        message: existingClinica
          ? 'La URL ya está en uso'
          : 'La URL está disponible',
      };
    } catch (error) {
      console.error('Error verificando URL:', error);
      throw new BadRequestException('Error al verificar disponibilidad de URL');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva clínica (PÚBLICO)' })
  @ApiResponse({ status: 201, description: 'Clínica creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createClinicaDto: any) {
    try {
      // Validar schema esperado por frontend
      const requiredFields = ['name', 'url', 'email', 'colorPrimario', 'colorSecundario'];
      const missingFields = requiredFields.filter(field => !createClinicaDto[field]);
      
      if (missingFields.length > 0) {
        throw new BadRequestException(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
      }

      // Ya no validamos que el usuario sea OWNER - endpoint público

      // Convertir URL a minúsculas para consistencia
      const urlNormalizada = createClinicaDto.url.toLowerCase().trim();
      
      // Verificar que la URL no exista
      const existingClinica = await this.prisma.clinica.findFirst({
        where: { url: urlNormalizada },
      });

      if (existingClinica) {
        throw new BadRequestException('La URL de clínica ya está en uso. Por favor, elige otra.');
      }

      // Crear la clínica
      const clinica = await this.prisma.clinica.create({
        data: {
          name: createClinicaDto.name,
          url: urlNormalizada,
          address: createClinicaDto.address || '',
          phone: createClinicaDto.phone || '',
          email: createClinicaDto.email,
          colorPrimario: createClinicaDto.colorPrimario,
          colorSecundario: createClinicaDto.colorSecundario,
          descripcion: createClinicaDto.descripcion || '',
          contacto: createClinicaDto.contacto || '',
          estado: 'activa', // Consistente: femenino
          estadoPago: createClinicaDto.plan || 'pendiente',
          fechaCreacion: new Date(),
          ultimoPago: null,
          proximoPago: null,
          rating: 4.5,
          stats: null,
        },
      });

      return {
        success: true,
        data: clinica,
        message: 'Clínica creada exitosamente',
      };
    } catch (error) {
      console.error('Error creando clínica:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la clínica');
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

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar clínica (PÚBLICO)' })
  @ApiResponse({ status: 200, description: 'Clínica actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async update(@Param('id') id: string, @Body() updateClinicaDto: any) {
    try {
      // Verificar que la clínica existe
      const clinicaExistente = await this.prisma.clinica.findUnique({
        where: { id },
      });

      if (!clinicaExistente) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Preparar datos de actualización (solo campos que se envían)
      const dataToUpdate: any = {};

      if (updateClinicaDto.name !== undefined) dataToUpdate.name = updateClinicaDto.name;
      
      // Validar URL única si se está actualizando
      if (updateClinicaDto.url !== undefined) {
        const urlNormalizada = updateClinicaDto.url.toLowerCase().trim();
        
        // Verificar que la URL no exista en otra clínica
        const existingClinica = await this.prisma.clinica.findFirst({
          where: { 
            url: urlNormalizada,
            id: { not: id } // Excluir la clínica actual
          },
        });

        if (existingClinica) {
          throw new BadRequestException('La URL de clínica ya está en uso. Por favor, elige otra.');
        }
        
        dataToUpdate.url = urlNormalizada;
      }
      
      if (updateClinicaDto.address !== undefined) dataToUpdate.address = updateClinicaDto.address;
      if (updateClinicaDto.phone !== undefined) dataToUpdate.phone = updateClinicaDto.phone;
      if (updateClinicaDto.email !== undefined) dataToUpdate.email = updateClinicaDto.email;
      if (updateClinicaDto.colorPrimario !== undefined) dataToUpdate.colorPrimario = updateClinicaDto.colorPrimario;
      if (updateClinicaDto.colorSecundario !== undefined) dataToUpdate.colorSecundario = updateClinicaDto.colorSecundario;
      if (updateClinicaDto.descripcion !== undefined) dataToUpdate.descripcion = updateClinicaDto.descripcion;
      if (updateClinicaDto.contacto !== undefined) dataToUpdate.contacto = updateClinicaDto.contacto;
      if (updateClinicaDto.estado !== undefined) dataToUpdate.estado = updateClinicaDto.estado;
      if (updateClinicaDto.estadoPago !== undefined) dataToUpdate.estadoPago = updateClinicaDto.estadoPago;
      if (updateClinicaDto.plan !== undefined) dataToUpdate.estadoPago = updateClinicaDto.plan;

      // Actualizar la clínica
      const clinicaActualizada = await this.prisma.clinica.update({
        where: { id },
        data: dataToUpdate,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
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
      });

      return {
        success: true,
        data: clinicaActualizada,
        message: 'Clínica actualizada exitosamente',
      };
    } catch (error) {
      console.error('Error actualizando clínica:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar la clínica');
    }
  }
} 