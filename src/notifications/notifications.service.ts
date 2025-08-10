import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(clinicaUrl: string, userId?: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const whereClause: any = {
      clinicaId: clinica.id,
      OR: [
        { destinatarioId: null }, // Notificaciones para todos
        { destinatarioId: userId }, // Notificaciones específicas del usuario
      ],
    };

    // Filtrar notificaciones vencidas
    whereClause.OR.push({
      fechaVencimiento: {
        gte: new Date(),
      },
    });

    return this.prisma.notificacion.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        destinatario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async create(clinicaUrl: string, dto: CreateNotificationDto) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Si se especifica un destinatario, verificar que existe
    if (dto.destinatarioId) {
      const destinatario = await this.prisma.user.findFirst({
        where: {
          id: dto.destinatarioId,
          clinicaId: clinica.id,
        },
      });

      if (!destinatario) {
        throw new BadRequestException('Destinatario no encontrado en esta clínica');
      }
    }

    const notificacion = await this.prisma.notificacion.create({
      data: {
        titulo: dto.titulo,
        mensaje: dto.mensaje,
        tipo: dto.tipo,
        prioridad: dto.prioridad,
        clinicaId: clinica.id,
        destinatarioId: dto.destinatarioId || null,
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
      },
      include: {
        destinatario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      notificacion,
    };
  }

  async findOne(clinicaUrl: string, id: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const notificacion = await this.prisma.notificacion.findFirst({
      where: {
        id,
        clinicaId: clinica.id,
      },
      include: {
        destinatario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return notificacion;
  }

  async update(clinicaUrl: string, id: string, dto: UpdateNotificationDto) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const notificacion = await this.prisma.notificacion.findFirst({
      where: {
        id,
        clinicaId: clinica.id,
      },
    });

    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }

    const notificacionActualizada = await this.prisma.notificacion.update({
      where: { id },
      data: {
        ...(dto.titulo && { titulo: dto.titulo }),
        ...(dto.mensaje && { mensaje: dto.mensaje }),
        ...(dto.tipo && { tipo: dto.tipo }),
        ...(dto.prioridad && { prioridad: dto.prioridad }),
        ...(dto.leida !== undefined && { leida: dto.leida }),
        ...(dto.fechaVencimiento && { fechaVencimiento: new Date(dto.fechaVencimiento) }),
        updatedAt: new Date(),
      },
      include: {
        destinatario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      notificacion: notificacionActualizada,
    };
  }

  async markAsRead(clinicaUrl: string, id: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const notificacion = await this.prisma.notificacion.findFirst({
      where: {
        id,
        clinicaId: clinica.id,
      },
    });

    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }

    const notificacionActualizada = await this.prisma.notificacion.update({
      where: { id },
      data: {
        leida: true,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      notificacion: notificacionActualizada,
    };
  }

  async remove(clinicaUrl: string, id: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const notificacion = await this.prisma.notificacion.findFirst({
      where: {
        id,
        clinicaId: clinica.id,
      },
    });

    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }

    await this.prisma.notificacion.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Notificación eliminada correctamente',
    };
  }

  async getStats(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Obtener estadísticas por tipo
    const statsPorTipo = await this.prisma.notificacion.groupBy({
      by: ['tipo'],
      where: { clinicaId: clinica.id },
      _count: {
        tipo: true,
      },
    });

    // Obtener estadísticas por prioridad
    const statsPorPrioridad = await this.prisma.notificacion.groupBy({
      by: ['prioridad'],
      where: { clinicaId: clinica.id },
      _count: {
        prioridad: true,
      },
    });

    // Obtener estadísticas de lectura
    const [totalNotificaciones, notificacionesLeidas] = await Promise.all([
      this.prisma.notificacion.count({
        where: { clinicaId: clinica.id },
      }),
      this.prisma.notificacion.count({
        where: {
          clinicaId: clinica.id,
          leida: true,
        },
      }),
    ]);

    const notificacionesNoLeidas = totalNotificaciones - notificacionesLeidas;
    const porcentajeLeidas = totalNotificaciones > 0 ? (notificacionesLeidas / totalNotificaciones) * 100 : 0;

    return {
      success: true,
      stats: {
        total: totalNotificaciones,
        leidas: notificacionesLeidas,
        noLeidas: notificacionesNoLeidas,
        porcentajeLeidas: Math.round(porcentajeLeidas * 100) / 100,
        porTipo: statsPorTipo.map((stat) => ({
          tipo: stat.tipo,
          cantidad: stat._count.tipo,
        })),
        porPrioridad: statsPorPrioridad.map((stat) => ({
          prioridad: stat.prioridad,
          cantidad: stat._count.prioridad,
        })),
      },
    };
  }
}
