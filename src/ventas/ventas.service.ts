import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';

@Injectable()
export class VentasService {
  constructor(private readonly prisma: PrismaService) {}

  // Generar ID personalizado para la venta
  private generateVentaId(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return `V${timestamp}-${randomSuffix}`;
  }

  // Crear nueva venta
  async create(createVentaDto: CreateVentaDto) {
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

      // Crear la venta
      const venta = await this.prisma.venta.create({
        data: {
          ...createVentaDto,
          ventaId,
          fechaCreacion: new Date(),
          fechaVencimiento: createVentaDto.fechaVencimiento 
            ? new Date(createVentaDto.fechaVencimiento) 
            : null,
          sesiones: createVentaDto.sesiones || 1,
          sesionesUsadas: createVentaDto.sesionesUsadas || 0,
          estado: createVentaDto.estado || 'activa',
          estadoPago: createVentaDto.estadoPago || 'pendiente',
        },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
          medioPagoRel: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              activo: true,
            },
          },
        },
      });

      return {
        success: true,
        data: venta,
        message: 'Venta creada exitosamente',
      };
    } catch (error) {
      console.error('Error creando venta:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la venta');
    }
  }

  // Obtener todas las ventas
  async findAll(
    clinicaId?: string,
    estado?: string,
    estadoPago?: string,
    limit?: number,
    offset?: number,
  ) {
    try {
      const where: any = {};
      if (clinicaId) where.clinicaId = clinicaId;
      if (estado) where.estado = estado;
      if (estadoPago) where.estadoPago = estadoPago;

      const ventas = await this.prisma.venta.findMany({
        where,
        take: limit || 50,
        skip: offset || 0,
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
          medioPagoRel: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              activo: true,
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
          limit: limit || 50,
          offset: offset || 0,
          total: await this.prisma.venta.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo ventas:', error);
      throw new BadRequestException('Error al obtener las ventas');
    }
  }

  // Obtener venta por ID
  async findOne(id: string) {
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
          medioPagoRel: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              activo: true,
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

  // Obtener venta por ventaId personalizado
  async findByVentaId(ventaId: string) {
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
          medioPagoRel: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              activo: true,
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

  // Actualizar venta
  async update(id: string, updateVentaDto: UpdateVentaDto) {
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
          medioPagoRel: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              activo: true,
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

  // Eliminar venta
  async remove(id: string) {
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

  // Obtener ventas por clínica
  async findByClinica(
    clinicaId: string,
    estado?: string,
    estadoPago?: string,
    limit?: number,
    offset?: number,
  ) {
    try {
      const where: any = { clinicaId };
      if (estado) where.estado = estado;
      if (estadoPago) where.estadoPago = estadoPago;

      const ventas = await this.prisma.venta.findMany({
        where,
        take: limit || 50,
        skip: offset || 0,
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
          medioPagoRel: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              activo: true,
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
          limit: limit || 50,
          offset: offset || 0,
          total: await this.prisma.venta.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo ventas de la clínica:', error);
      throw new BadRequestException('Error al obtener las ventas de la clínica');
    }
  }

  // Obtener estadísticas de ventas
  async getStats(clinicaId: string) {
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
