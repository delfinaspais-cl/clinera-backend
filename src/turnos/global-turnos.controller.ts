import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
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

@ApiTags('Turnos Globales')
@Controller('turnos')
export class GlobalTurnosController {
  constructor(private readonly prisma: PrismaService) {}

  // Función helper para procesar datos de pago de un turno
  private procesarDatosPago(turno: any) {
    const montoTotal = turno.montoTotal ? parseFloat(turno.montoTotal) : 0;
    const montoAbonado = turno.montoAbonado ? parseFloat(turno.montoAbonado) : 0;
    const montoPendiente = turno.montoPendiente ? parseFloat(turno.montoPendiente) : (montoTotal - montoAbonado);

    // Determinar estado de pago automáticamente si no está definido o es inconsistente
    let estadoPago = turno.estadoPago;
    if (!estadoPago || estadoPago === 'pendiente') {
      if (montoAbonado >= montoTotal && montoTotal > 0) {
        estadoPago = 'pagado';
      } else if (montoAbonado > 0) {
        estadoPago = 'parcial';
      } else {
        estadoPago = 'pendiente';
      }
    }

    return {
      ...turno,
      montoTotal,
      montoAbonado,
      montoPendiente,
      estadoPago,
      // Agregar campos calculados para el frontend
      porcentajePagado: montoTotal > 0 ? Math.round((montoAbonado / montoTotal) * 100) : 0,
      porcentajePendiente: montoTotal > 0 ? Math.round((montoPendiente / montoTotal) * 100) : 0,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los turnos' })
  @ApiResponse({ status: 200, description: 'Lista de turnos obtenida exitosamente' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'clinicaId', required: false, description: 'Filtrar por clínica' })
  @ApiQuery({ name: 'fecha', required: false, description: 'Filtrar por fecha (YYYY-MM-DD)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findAll(
    @Query('estado') estado?: string,
    @Query('clinicaId') clinicaId?: string,
    @Query('fecha') fecha?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const where: any = {};
      if (estado) where.estado = estado;
      if (clinicaId) where.clinicaId = clinicaId;
      if (fecha) {
        const fechaInicio = new Date(fecha);
        const fechaFin = new Date(fecha);
        fechaFin.setDate(fechaFin.getDate() + 1);
        where.fecha = {
          gte: fechaInicio,
          lt: fechaFin,
        };
      }

      const turnos = await this.prisma.turno.findMany({
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
        },
        orderBy: {
          fecha: 'desc',
        },
      });

      // Procesar datos de pago para cada turno
      const turnosProcesados = turnos.map(turno => {
        const montoTotal = turno.montoTotal ? parseFloat(turno.montoTotal) : 0;
        const montoAbonado = turno.montoAbonado ? parseFloat(turno.montoAbonado) : 0;
        const montoPendiente = turno.montoPendiente ? parseFloat(turno.montoPendiente) : (montoTotal - montoAbonado);

        // Determinar estado de pago automáticamente si no está definido o es inconsistente
        let estadoPago = turno.estadoPago;
        if (!estadoPago || estadoPago === 'pendiente') {
          if (montoAbonado >= montoTotal && montoTotal > 0) {
            estadoPago = 'pagado';
          } else if (montoAbonado > 0) {
            estadoPago = 'parcial';
          } else {
            estadoPago = 'pendiente';
          }
        }

        return {
          ...turno,
          montoTotal,
          montoAbonado,
          montoPendiente,
          estadoPago,
          // Agregar campos calculados para el frontend
          porcentajePagado: montoTotal > 0 ? Math.round((montoAbonado / montoTotal) * 100) : 0,
          porcentajePendiente: montoTotal > 0 ? Math.round((montoPendiente / montoTotal) * 100) : 0,
        };
      });

      return {
        success: true,
        data: turnosProcesados,
        message: 'Turnos obtenidos exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.turno.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo turnos:', error);
      throw new BadRequestException('Error al obtener los turnos');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener turno específico' })
  @ApiResponse({ status: 200, description: 'Turno obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  async findOne(@Param('id') id: string) {
    try {
      const turno = await this.prisma.turno.findUnique({
        where: { id },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
              phone: true,
              email: true,
            },
          },
        },
      });

      if (!turno) {
        throw new NotFoundException('Turno no encontrado');
      }

      // Procesar datos de pago usando la función helper
      const turnoProcesado = this.procesarDatosPago(turno);

      return {
        success: true,
        data: turnoProcesado,
        message: 'Turno obtenido exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo turno:', error);
      throw new BadRequestException('Error al obtener el turno');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo turno' })
  @ApiResponse({ status: 201, description: 'Turno creado exitosamente' })
  async create(@Body() createTurnoDto: any, @Request() req) {
    try {
      // Validar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: createTurnoDto.clinicaId },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      const turno = await this.prisma.turno.create({
        data: {
          paciente: createTurnoDto.paciente,
          email: createTurnoDto.email,
          telefono: createTurnoDto.telefono,
          doctor: createTurnoDto.doctor,
          fecha: new Date(createTurnoDto.fecha),
          hora: createTurnoDto.hora,
          motivo: createTurnoDto.motivo,
          clinicaId: createTurnoDto.clinicaId,
          // Nuevos campos para datos de pago
          montoTotal: createTurnoDto.montoTotal,
          estadoPago: createTurnoDto.estadoPago || 'pendiente',
          medioPago: createTurnoDto.medioPago,
          // Nuevos campos adicionales
          origen: createTurnoDto.origen,
          ate: createTurnoDto.ate,
        },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
      });

      return {
        success: true,
        data: turno,
        message: 'Turno creado exitosamente',
      };
    } catch (error) {
      console.error('Error creando turno:', error);
      throw new BadRequestException('Error al crear el turno');
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar turno' })
  @ApiResponse({ status: 200, description: 'Turno actualizado exitosamente' })
  async update(@Param('id') id: string, @Body() updateTurnoDto: any) {
    try {
      const turno = await this.prisma.turno.findUnique({
        where: { id },
      });

      if (!turno) {
        throw new NotFoundException('Turno no encontrado');
      }

      // Calcular montos de pago si se proporcionan
      let montoAbonado = turno.montoAbonado;
      let montoPendiente = turno.montoPendiente;
      let estadoPago = updateTurnoDto.estadoPago;

      if (updateTurnoDto.montoAbonado !== undefined) {
        const montoTotal = updateTurnoDto.montoTotal ? parseFloat(updateTurnoDto.montoTotal) : parseFloat(turno.montoTotal || '0');
        montoAbonado = updateTurnoDto.montoAbonado.toString();
        montoPendiente = (montoTotal - updateTurnoDto.montoAbonado).toString();
        
        // Determinar estado de pago automáticamente
        if (updateTurnoDto.montoAbonado >= montoTotal && montoTotal > 0) {
          estadoPago = 'pagado';
        } else if (updateTurnoDto.montoAbonado > 0) {
          estadoPago = 'parcial';
        } else {
          estadoPago = 'pendiente';
        }
      }

      const updatedTurno = await this.prisma.turno.update({
        where: { id },
        data: {
          paciente: updateTurnoDto.paciente,
          email: updateTurnoDto.email,
          telefono: updateTurnoDto.telefono,
          doctor: updateTurnoDto.doctor,
          fecha: updateTurnoDto.fecha ? new Date(updateTurnoDto.fecha) : undefined,
          hora: updateTurnoDto.hora,
          motivo: updateTurnoDto.motivo,
          estado: updateTurnoDto.estado,
          // Nuevos campos para datos de pago
          montoTotal: updateTurnoDto.montoTotal,
          montoAbonado,
          montoPendiente,
          estadoPago,
          medioPago: updateTurnoDto.medioPago,
          // Nuevos campos adicionales
          origen: updateTurnoDto.origen,
          ate: updateTurnoDto.ate,
        },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
      });

      // Procesar datos de pago usando la función helper
      const turnoProcesado = this.procesarDatosPago(updatedTurno);

      return {
        success: true,
        data: turnoProcesado,
        message: 'Turno actualizado exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error actualizando turno:', error);
      throw new BadRequestException('Error al actualizar el turno');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar turno' })
  @ApiResponse({ status: 200, description: 'Turno cancelado exitosamente' })
  async cancel(@Param('id') id: string) {
    try {
      const turno = await this.prisma.turno.findUnique({
        where: { id },
      });

      if (!turno) {
        throw new NotFoundException('Turno no encontrado');
      }

      const updatedTurno = await this.prisma.turno.update({
        where: { id },
        data: {
          estado: 'cancelado',
        },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
      });

      return {
        success: true,
        data: updatedTurno,
        message: 'Turno cancelado exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error cancelando turno:', error);
      throw new BadRequestException('Error al cancelar el turno');
    }
  }

  @Get('clinica/:clinicaId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener turnos de una clínica específica' })
  @ApiResponse({ status: 200, description: 'Turnos de la clínica obtenidos exitosamente' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'fecha', required: false, description: 'Filtrar por fecha (YYYY-MM-DD)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findByClinica(
    @Param('clinicaId') clinicaId: string,
    @Query('estado') estado?: string,
    @Query('fecha') fecha?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const where: any = { clinicaId };
      if (estado) where.estado = estado;
      if (fecha) {
        const fechaInicio = new Date(fecha);
        const fechaFin = new Date(fecha);
        fechaFin.setDate(fechaFin.getDate() + 1);
        where.fecha = {
          gte: fechaInicio,
          lt: fechaFin,
        };
      }

      const turnos = await this.prisma.turno.findMany({
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
        },
        orderBy: {
          fecha: 'desc',
        },
      });

      // Procesar datos de pago para cada turno
      const turnosProcesados = turnos.map(turno => {
        const montoTotal = turno.montoTotal ? parseFloat(turno.montoTotal) : 0;
        const montoAbonado = turno.montoAbonado ? parseFloat(turno.montoAbonado) : 0;
        const montoPendiente = turno.montoPendiente ? parseFloat(turno.montoPendiente) : (montoTotal - montoAbonado);

        // Determinar estado de pago automáticamente si no está definido o es inconsistente
        let estadoPago = turno.estadoPago;
        if (!estadoPago || estadoPago === 'pendiente') {
          if (montoAbonado >= montoTotal && montoTotal > 0) {
            estadoPago = 'pagado';
          } else if (montoAbonado > 0) {
            estadoPago = 'parcial';
          } else {
            estadoPago = 'pendiente';
          }
        }

        return {
          ...turno,
          montoTotal,
          montoAbonado,
          montoPendiente,
          estadoPago,
          // Agregar campos calculados para el frontend
          porcentajePagado: montoTotal > 0 ? Math.round((montoAbonado / montoTotal) * 100) : 0,
          porcentajePendiente: montoTotal > 0 ? Math.round((montoPendiente / montoTotal) * 100) : 0,
        };
      });

      return {
        success: true,
        data: turnosProcesados,
        message: 'Turnos de la clínica obtenidos exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.turno.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo turnos de la clínica:', error);
      throw new BadRequestException('Error al obtener los turnos de la clínica');
    }
  }

  @Post('public')
  @ApiOperation({ summary: 'Crear turno público (sin autenticación)' })
  @ApiResponse({ status: 201, description: 'Turno público creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o clínica no encontrada' })
  async createPublic(@Body() createTurnoDto: any) {
    try {
      // Validar campos requeridos según schema esperado por frontend
      const requiredFields = ['clinicaUrl', 'nombre', 'email', 'fecha', 'hora'];
      const missingFields = requiredFields.filter(field => !createTurnoDto[field]);
      
      if (missingFields.length > 0) {
        throw new BadRequestException(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
      }

      // Buscar clínica por URL en lugar de ID
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: createTurnoDto.clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Crear el turno con el schema correcto
      const turno = await this.prisma.turno.create({
        data: {
          paciente: createTurnoDto.nombre,
          email: createTurnoDto.email,
          telefono: createTurnoDto.telefono || '',
          doctor: createTurnoDto.profesional || 'Por asignar',
          fecha: new Date(createTurnoDto.fecha),
          hora: createTurnoDto.hora,
          motivo: createTurnoDto.motivo || 'Consulta',
          clinicaId: clinica.id,
          estado: 'pendiente',
        },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
      });

      // Crear notificación para la clínica
      await this.prisma.notificacion.create({
        data: {
          titulo: 'Nuevo turno solicitado',
          mensaje: `Se ha solicitado un nuevo turno para ${createTurnoDto.nombre} el ${createTurnoDto.fecha} a las ${createTurnoDto.hora}`,
          tipo: 'info',
          prioridad: 'media',
          clinicaId: clinica.id,
        },
      });

      return {
        success: true,
        data: turno,
        message: 'Turno público creado exitosamente. Nos pondremos en contacto contigo pronto.',
      };
    } catch (error) {
      console.error('Error creando turno público:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear el turno público');
    }
  }





  @Get('paciente/:email')
  @ApiOperation({ summary: 'Obtener turnos de un paciente por email (sin autenticación)' })
  @ApiResponse({ status: 200, description: 'Turnos del paciente obtenidos exitosamente' })
  async getTurnosByPaciente(
    @Param('email') email: string,
    @Query('clinicaId') clinicaId?: string,
    @Query('estado') estado?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const where: any = { email };
      if (clinicaId) where.clinicaId = clinicaId;
      if (estado) where.estado = estado;

      const turnos = await this.prisma.turno.findMany({
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
        },
        orderBy: {
          fecha: 'desc',
        },
      });

      // Procesar datos de pago para cada turno
      const turnosProcesados = turnos.map(turno => {
        const montoTotal = turno.montoTotal ? parseFloat(turno.montoTotal) : 0;
        const montoAbonado = turno.montoAbonado ? parseFloat(turno.montoAbonado) : 0;
        const montoPendiente = turno.montoPendiente ? parseFloat(turno.montoPendiente) : (montoTotal - montoAbonado);

        // Determinar estado de pago automáticamente si no está definido o es inconsistente
        let estadoPago = turno.estadoPago;
        if (!estadoPago || estadoPago === 'pendiente') {
          if (montoAbonado >= montoTotal && montoTotal > 0) {
            estadoPago = 'pagado';
          } else if (montoAbonado > 0) {
            estadoPago = 'parcial';
          } else {
            estadoPago = 'pendiente';
          }
        }

        return {
          ...turno,
          montoTotal,
          montoAbonado,
          montoPendiente,
          estadoPago,
          // Agregar campos calculados para el frontend
          porcentajePagado: montoTotal > 0 ? Math.round((montoAbonado / montoTotal) * 100) : 0,
          porcentajePendiente: montoTotal > 0 ? Math.round((montoPendiente / montoTotal) * 100) : 0,
        };
      });

      return {
        success: true,
        data: turnosProcesados,
        message: 'Turnos del paciente obtenidos exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.turno.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo turnos del paciente:', error);
      throw new BadRequestException('Error al obtener los turnos del paciente');
    }
  }
} 