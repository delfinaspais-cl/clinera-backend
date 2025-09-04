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

@ApiTags('Ventas Globales')
@Controller('ventas')
export class GlobalVentasController {
  constructor(private readonly prisma: PrismaService) {}

  // Generar ID personalizado para la venta
  private generateVentaId(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return `V${timestamp}-${randomSuffix}`;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nueva venta' })
  @ApiResponse({ status: 201, description: 'Venta creada exitosamente' })
  async create(@Body() createVentaDto: any, @Request() req) {
    try {
      // Validar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: createVentaDto.clinicaId },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Generar ID personalizado
      const ventaId = this.generateVentaId();

      // Crear la venta con todos los campos del frontend
      const venta = await this.prisma.venta.create({
        data: {
          ventaId,
          comprador: createVentaDto.comprador,
          paciente: createVentaDto.paciente,
          email: createVentaDto.email,
          telefono: createVentaDto.telefono,
          tratamiento: createVentaDto.tratamiento,
          profesional: createVentaDto.profesional,
          profesionalId: createVentaDto.profesionalId || '',
          sucursal: createVentaDto.sucursal,
          montoTotal: createVentaDto.montoTotal,
          montoAbonado: createVentaDto.montoAbonado,
          montoPendiente: createVentaDto.montoPendiente,
          estado: createVentaDto.estado || 'activa',
          estadoPago: createVentaDto.estadoPago || 'pendiente',
          medioPago: createVentaDto.medioPago,
          origen: createVentaDto.origen,
          ate: createVentaDto.ate,
          sesiones: createVentaDto.sesiones || 1,
          sesionesUsadas: createVentaDto.sesionesUsadas || 0,
          fechaCreacion: new Date(),
          fechaVencimiento: createVentaDto.fechaVencimiento 
            ? new Date(createVentaDto.fechaVencimiento) 
            : null,
          notas: createVentaDto.notas || '',
          clinicaId: createVentaDto.clinicaId,
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
        data: venta,
        message: 'Nueva venta guardada exitosamente',
      };
    } catch (error) {
      console.error('Error creando venta:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la venta');
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas las ventas' })
  @ApiResponse({ status: 200, description: 'Lista de ventas obtenida exitosamente' })
  @ApiQuery({ name: 'clinicaId', required: false, description: 'Filtrar por clínica' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'estadoPago', required: false, description: 'Filtrar por estado de pago' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findAll(
    @Query('clinicaId') clinicaId?: string,
    @Query('estado') estado?: string,
    @Query('estadoPago') estadoPago?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const where: any = {};
      if (clinicaId) where.clinicaId = clinicaId;
      if (estado) where.estado = estado;
      if (estadoPago) where.estadoPago = estadoPago;

      const ventas = await this.prisma.venta.findMany({
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
          fechaCreacion: 'desc',
        },
      });

      return {
        success: true,
        data: ventas,
        message: 'Ventas obtenidas exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.venta.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo ventas:', error);
      throw new BadRequestException('Error al obtener las ventas');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener venta específica' })
  @ApiResponse({ status: 200, description: 'Venta obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async findOne(@Param('id') id: string) {
    try {
      const venta = await this.prisma.venta.findUnique({
        where: { id },
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

      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }

      return {
        success: true,
        data: venta,
        message: 'Venta obtenida exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo venta:', error);
      throw new BadRequestException('Error al obtener la venta');
    }
  }

  @Get('venta-id/:ventaId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener venta por ventaId personalizado' })
  @ApiResponse({ status: 200, description: 'Venta obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async findByVentaId(@Param('ventaId') ventaId: string) {
    try {
      const venta = await this.prisma.venta.findUnique({
        where: { ventaId },
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

      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }

      return {
        success: true,
        data: venta,
        message: 'Venta obtenida exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo venta:', error);
      throw new BadRequestException('Error al obtener la venta');
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar venta' })
  @ApiResponse({ status: 200, description: 'Venta actualizada exitosamente' })
  async update(@Param('id') id: string, @Body() updateVentaDto: any) {
    try {
      const venta = await this.prisma.venta.findUnique({
        where: { id },
      });

      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }

      // Preparar datos para actualización
      const updateData: any = { ...updateVentaDto };
      
      // Convertir fecha de vencimiento si se proporciona
      if (updateVentaDto.fechaVencimiento) {
        updateData.fechaVencimiento = new Date(updateVentaDto.fechaVencimiento);
      }

      const updatedVenta = await this.prisma.venta.update({
        where: { id },
        data: updateData,
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
        data: updatedVenta,
        message: 'Venta actualizada exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error actualizando venta:', error);
      throw new BadRequestException('Error al actualizar la venta');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar venta' })
  @ApiResponse({ status: 200, description: 'Venta eliminada exitosamente' })
  async remove(@Param('id') id: string) {
    try {
      const venta = await this.prisma.venta.findUnique({
        where: { id },
      });

      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }

      await this.prisma.venta.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Venta eliminada exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error eliminando venta:', error);
      throw new BadRequestException('Error al eliminar la venta');
    }
  }

  @Get('clinica/:clinicaId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener ventas de una clínica específica' })
  @ApiResponse({ status: 200, description: 'Ventas de la clínica obtenidas exitosamente' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'estadoPago', required: false, description: 'Filtrar por estado de pago' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findByClinica(
    @Param('clinicaId') clinicaId: string,
    @Query('estado') estado?: string,
    @Query('estadoPago') estadoPago?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const where: any = { clinicaId };
      if (estado) where.estado = estado;
      if (estadoPago) where.estadoPago = estadoPago;

      const ventas = await this.prisma.venta.findMany({
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
          fechaCreacion: 'desc',
        },
      });

      return {
        success: true,
        data: ventas,
        message: 'Ventas de la clínica obtenidas exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.venta.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo ventas de la clínica:', error);
      throw new BadRequestException('Error al obtener las ventas de la clínica');
    }
  }

  @Get('stats/:clinicaId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadísticas de ventas de una clínica' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async getStats(@Param('clinicaId') clinicaId: string) {
    try {
      const totalVentas = await this.prisma.venta.count({
        where: { clinicaId },
      });

      const ventasActivas = await this.prisma.venta.count({
        where: { clinicaId, estado: 'activa' },
      });

      const ventasPagadas = await this.prisma.venta.count({
        where: { clinicaId, estadoPago: 'pagado' },
      });

      const ventasParciales = await this.prisma.venta.count({
        where: { clinicaId, estadoPago: 'parcial' },
      });

      const ventasPendientes = await this.prisma.venta.count({
        where: { clinicaId, estadoPago: 'pendiente' },
      });

      // Calcular totales monetarios
      const ventasData = await this.prisma.venta.findMany({
        where: { clinicaId },
        select: {
          montoTotal: true,
          montoAbonado: true,
          montoPendiente: true,
        },
      });

      const totalMonto = ventasData.reduce((sum, venta) => {
        return sum + parseFloat(venta.montoTotal || '0');
      }, 0);

      const totalAbonado = ventasData.reduce((sum, venta) => {
        return sum + parseFloat(venta.montoAbonado || '0');
      }, 0);

      const totalPendiente = ventasData.reduce((sum, venta) => {
        return sum + parseFloat(venta.montoPendiente || '0');
      }, 0);

      return {
        success: true,
        data: {
          totalVentas,
          ventasActivas,
          ventasPagadas,
          ventasParciales,
          ventasPendientes,
          totalMonto: totalMonto.toFixed(2),
          totalAbonado: totalAbonado.toFixed(2),
          totalPendiente: totalPendiente.toFixed(2),
        },
        message: 'Estadísticas de ventas obtenidas exitosamente',
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de ventas:', error);
      throw new BadRequestException('Error al obtener las estadísticas de ventas');
    }
  }
}
