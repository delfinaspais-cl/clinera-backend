import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedioPagoDto } from './dto/create-medio-pago.dto';
import { UpdateMedioPagoDto } from './dto/update-medio-pago.dto';

@Injectable()
export class MediosPagoService {
  constructor(private readonly prisma: PrismaService) {}

  // Crear nuevo medio de pago
  async create(createMedioPagoDto: CreateMedioPagoDto) {
    try {
      // Validar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: createMedioPagoDto.clinicaId },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Verificar que no existe un medio de pago con el mismo nombre en la clínica
      const existingMedioPago = await this.prisma.medioPago.findFirst({
        where: {
          nombre: createMedioPagoDto.nombre,
          clinicaId: createMedioPagoDto.clinicaId,
        },
      });

      if (existingMedioPago) {
        throw new ConflictException('Ya existe un medio de pago con este nombre en la clínica');
      }

      // Crear el medio de pago
      const medioPago = await this.prisma.medioPago.create({
        data: {
          ...createMedioPagoDto,
          activo: createMedioPagoDto.activo ?? true,
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
        data: medioPago,
        message: 'Medio de pago creado exitosamente',
      };
    } catch (error) {
      console.error('Error creando medio de pago:', error);
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Error al crear el medio de pago');
    }
  }

  // Obtener todos los medios de pago de una clínica
  async findAll(clinicaId: string, activo?: boolean) {
    try {
      const where: any = { clinicaId };
      if (activo !== undefined) {
        where.activo = activo;
      }

      const mediosPago = await this.prisma.medioPago.findMany({
        where,
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
          _count: {
            select: {
              ventas: true,
            },
          },
        },
        orderBy: {
          nombre: 'asc',
        },
      });

      return {
        success: true,
        data: mediosPago,
        message: 'Medios de pago obtenidos exitosamente',
      };
    } catch (error) {
      console.error('Error obteniendo medios de pago:', error);
      throw new BadRequestException('Error al obtener los medios de pago');
    }
  }

  // Obtener medio de pago por ID
  async findOne(id: string) {
    try {
      const medioPago = await this.prisma.medioPago.findUnique({
        where: { id },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
          _count: {
            select: {
              ventas: true,
            },
          },
        },
      });

      if (!medioPago) {
        throw new NotFoundException('Medio de pago no encontrado');
      }

      return {
        success: true,
        data: medioPago,
        message: 'Medio de pago obtenido exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo medio de pago:', error);
      throw new BadRequestException('Error al obtener el medio de pago');
    }
  }

  // Actualizar medio de pago
  async update(id: string, updateMedioPagoDto: UpdateMedioPagoDto) {
    try {
      const medioPago = await this.prisma.medioPago.findUnique({
        where: { id },
      });

      if (!medioPago) {
        throw new NotFoundException('Medio de pago no encontrado');
      }

      // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
      if (updateMedioPagoDto.nombre && updateMedioPagoDto.nombre !== medioPago.nombre) {
        const existingMedioPago = await this.prisma.medioPago.findFirst({
          where: {
            nombre: updateMedioPagoDto.nombre,
            clinicaId: medioPago.clinicaId,
            id: { not: id },
          },
        });

        if (existingMedioPago) {
          throw new ConflictException('Ya existe un medio de pago con este nombre en la clínica');
        }
      }

      const updatedMedioPago = await this.prisma.medioPago.update({
        where: { id },
        data: updateMedioPagoDto,
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
          _count: {
            select: {
              ventas: true,
            },
          },
        },
      });

      return {
        success: true,
        data: updatedMedioPago,
        message: 'Medio de pago actualizado exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      console.error('Error actualizando medio de pago:', error);
      throw new BadRequestException('Error al actualizar el medio de pago');
    }
  }

  // Eliminar medio de pago
  async remove(id: string) {
    try {
      const medioPago = await this.prisma.medioPago.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              ventas: true,
            },
          },
        },
      });

      if (!medioPago) {
        throw new NotFoundException('Medio de pago no encontrado');
      }

      // Verificar si tiene ventas asociadas
      if (medioPago._count.ventas > 0) {
        throw new BadRequestException(
          'No se puede eliminar el medio de pago porque tiene ventas asociadas. Desactívalo en su lugar.'
        );
      }

      await this.prisma.medioPago.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Medio de pago eliminado exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error eliminando medio de pago:', error);
      throw new BadRequestException('Error al eliminar el medio de pago');
    }
  }

  // Desactivar/activar medio de pago
  async toggleStatus(id: string) {
    try {
      const medioPago = await this.prisma.medioPago.findUnique({
        where: { id },
      });

      if (!medioPago) {
        throw new NotFoundException('Medio de pago no encontrado');
      }

      const updatedMedioPago = await this.prisma.medioPago.update({
        where: { id },
        data: {
          activo: !medioPago.activo,
        },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
          _count: {
            select: {
              ventas: true,
            },
          },
        },
      });

      return {
        success: true,
        data: updatedMedioPago,
        message: `Medio de pago ${updatedMedioPago.activo ? 'activado' : 'desactivado'} exitosamente`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error cambiando estado del medio de pago:', error);
      throw new BadRequestException('Error al cambiar el estado del medio de pago');
    }
  }

  // Obtener estadísticas de uso de medios de pago
  async getStats(clinicaId: string) {
    try {
      const mediosPago = await this.prisma.medioPago.findMany({
        where: { clinicaId },
        include: {
          _count: {
            select: {
              ventas: true,
            },
          },
        },
      });

      const totalMediosPago = mediosPago.length;
      const mediosPagoActivos = mediosPago.filter(mp => mp.activo).length;
      const mediosPagoInactivos = totalMediosPago - mediosPagoActivos;

      // Calcular el medio de pago más usado
      const medioPagoMasUsado = mediosPago.reduce((prev, current) => 
        (prev._count.ventas > current._count.ventas) ? prev : current
      );

      return {
        success: true,
        data: {
          totalMediosPago,
          mediosPagoActivos,
          mediosPagoInactivos,
          medioPagoMasUsado: medioPagoMasUsado._count.ventas > 0 ? {
            id: medioPagoMasUsado.id,
            nombre: medioPagoMasUsado.nombre,
            ventas: medioPagoMasUsado._count.ventas,
          } : null,
          mediosPago: mediosPago.map(mp => ({
            id: mp.id,
            nombre: mp.nombre,
            activo: mp.activo,
            ventas: mp._count.ventas,
          })),
        },
        message: 'Estadísticas de medios de pago obtenidas exitosamente',
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de medios de pago:', error);
      throw new BadRequestException('Error al obtener las estadísticas de medios de pago');
    }
  }
}
