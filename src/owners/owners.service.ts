import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClinicaDto } from './dto/create-clinica.dto';
import { UpdateClinicaDto } from './dto/update-clinica.dto';
import { SendMensajeDto } from './dto/send-mensaje.dto';

@Injectable()
export class OwnersService {
  constructor(private prisma: PrismaService) {}

  async getAllClinicas() {
    try {
      const clinicas = await this.prisma.clinica.findMany({
        include: {
          _count: {
            select: {
              users: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Transformar los datos para el formato requerido
      const clinicasFormateadas = clinicas.map(clinica => ({
        id: clinica.id,
        nombre: clinica.name,
        url: clinica.url,
        logo: clinica.logo || null,
        colorPrimario: clinica.colorPrimario || "#3B82F6",
        colorSecundario: clinica.colorSecundario || "#1E40AF",
        estado: clinica.estado || "activa",
        estadoPago: clinica.estadoPago || "pagado",
        fechaCreacion: clinica.fechaCreacion.toISOString().split('T')[0],
        ultimoPago: clinica.ultimoPago ? clinica.ultimoPago.toISOString().split('T')[0] : null,
        proximoPago: clinica.proximoPago ? clinica.proximoPago.toISOString().split('T')[0] : null,
        usuarios: clinica._count.users,
        turnos: 0, // Por ahora hardcodeado, se puede calcular después
        ingresos: 0  // Por ahora hardcodeado, se puede calcular después
      }));

      return {
        success: true,
        clinicas: clinicasFormateadas
      };
    } catch (error) {
      console.error('Error al obtener clínicas:', error);
      throw new Error('Error interno del servidor');
    }
  }

  async createClinica(dto: CreateClinicaDto) {
  const existingClinica = await this.prisma.clinica.findUnique({
    where: { url: dto.url }
  });

  if (existingClinica) {
    throw new BadRequestException('La URL de la clínica ya existe');
  }

  const clinica = await this.prisma.clinica.create({
    data: {
      name: dto.nombre,
      url: dto.url,
      address: dto.direccion,
      phone: dto.telefono,
      email: dto.email,
      colorPrimario: dto.colorPrimario || '#3B82F6',
      colorSecundario: dto.colorSecundario || '#1E40AF',
      estado: 'activa',
      estadoPago: 'pagado',
      fechaCreacion: new Date(),
      ultimoPago: new Date(),
      proximoPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  if (dto.especialidades?.length) {
    await this.prisma.especialidad.createMany({
      data: dto.especialidades.map(name => ({ name, clinicaId: clinica.id }))
    });
  }

  if (dto.horarios?.length) {
    await this.prisma.horario.createMany({
      data: dto.horarios.map(h => ({
        day: h.day,
        openTime: h.openTime,
        closeTime: h.closeTime,
        clinicaId: clinica.id
      }))
    });
  }

  const clinicaConRelaciones = await this.prisma.clinica.findUnique({
    where: { id: clinica.id },
    include: { especialidades: true, horarios: true }
  });

  return {
    success: true,
    clinica: clinicaConRelaciones
  };
}


  async updateClinica(clinicaId: string, dto: UpdateClinicaDto) {
  try {
    // Verificar si la clínica existe
    const clinica = await this.prisma.clinica.findUnique({
      where: { id: clinicaId },
    });

    if (!clinica) {
      throw new BadRequestException('Clínica no encontrada');
    }

    // Actualizar campos simples
    await this.prisma.clinica.update({
      where: { id: clinicaId },
      data: {
        name: dto.nombre,
        address: dto.direccion,
        phone: dto.telefono,
        email: dto.email,
        colorPrimario: dto.colorPrimario,
        colorSecundario: dto.colorSecundario,
      },
    });

    // Reemplazar especialidades si se envían
    if (dto.especialidades) {
      await this.prisma.especialidad.deleteMany({
        where: { clinicaId },
      });

      if (dto.especialidades.length > 0) {
        await this.prisma.especialidad.createMany({
          data: dto.especialidades.map((nombre) => ({
            name: nombre,
            clinicaId: clinicaId,
          })),
        });
      }
    }

    // Reemplazar horarios si se envían
    if (dto.horarios) {
      await this.prisma.horario.deleteMany({
        where: { clinicaId },
      });

      if (dto.horarios.length > 0) {
        await this.prisma.horario.createMany({
  data: dto.horarios.map((h) => ({
    day: h.day,
    openTime: h.openTime,
    closeTime: h.closeTime,
    clinicaId: clinicaId,
  })),
});

      }
    }

    // Devolver clínica actualizada con relaciones
    const clinicaActualizada = await this.prisma.clinica.findUnique({
      where: { id: clinicaId },
      include: {
        especialidades: true,
        horarios: true,
      },
    });

    return {
      success: true,
      clinica: clinicaActualizada,
    };
  } catch (error) {
    console.error('Error al actualizar clínica:', error);
    throw new BadRequestException('Error interno del servidor');
  }
}


  async sendMensaje(clinicaId: string, dto: SendMensajeDto) {
    try {
      // Verificar si la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: clinicaId }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Crear el mensaje
      await this.prisma.mensaje.create({
        data: {
          asunto: dto.asunto,
          mensaje: dto.mensaje,
          tipo: dto.tipo,
          clinicaId: clinicaId
        }
      });

      return {
        success: true
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al enviar mensaje:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getOwnerStats() {
    try {
      // Obtener estadísticas de clínicas
      const totalClinicas = await this.prisma.clinica.count();
      const clinicasActivas = await this.prisma.clinica.count({
        where: { estado: 'activa' }
      });

      // Obtener estadísticas de usuarios
      const totalUsuarios = await this.prisma.user.count({
        where: {
          role: {
            in: ['ADMIN', 'PROFESSIONAL', 'SECRETARY']
          }
        }
      });

      // Obtener estadísticas de turnos
      const totalTurnos = await this.prisma.turno.count();

      // Calcular clínicas nuevas (creadas en el último mes)
      const unMesAtras = new Date();
      unMesAtras.setMonth(unMesAtras.getMonth() - 1);
      
      const clinicasNuevas = await this.prisma.clinica.count({
        where: {
          createdAt: {
            gte: unMesAtras
          }
        }
      });

      // Calcular ingresos mensuales (simulado basado en clínicas activas)
      // En un sistema real, esto vendría de un sistema de pagos
      const ingresosMensuales = clinicasActivas * 12500; // $12,500 por clínica activa

      return {
        success: true,
        stats: {
          totalClinicas,
          clinicasActivas,
          totalUsuarios,
          totalTurnos,
          ingresosMensuales,
          clinicasNuevas
        }
      };
    } catch (error) {
      console.error('Error al obtener estadísticas del propietario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }
} 