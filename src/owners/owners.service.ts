import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClinicaDto } from './dto/create-clinica.dto';
import { UpdateClinicaEstadoDto } from './dto/update-clinica-estado.dto';
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
    try {
      // Verificar si la URL ya existe
      const existingClinica = await this.prisma.clinica.findUnique({
        where: { url: dto.url }
      });

      if (existingClinica) {
        throw new BadRequestException('La URL de la clínica ya existe');
      }

      // Crear la clínica
      const clinica = await this.prisma.clinica.create({
        data: {
          name: dto.nombre,
          url: dto.url,
          address: dto.direccion,
          phone: dto.telefono,
          email: dto.email,
          colorPrimario: dto.colorPrimario || '#3B82F6',
          colorSecundario: dto.colorSecundario || '#1E40AF',
          horarios: dto.horarios,
          especialidades: dto.especialidades ? JSON.stringify(dto.especialidades) : null,
          estado: 'activa',
          estadoPago: 'pagado',
          fechaCreacion: new Date(),
          ultimoPago: new Date(),
          proximoPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
        }
      });

      return {
        success: true,
        clinica: {
          id: clinica.id,
          nombre: clinica.name,
          url: clinica.url,
          logo: clinica.logo,
          colorPrimario: clinica.colorPrimario,
          colorSecundario: clinica.colorSecundario,
          estado: clinica.estado,
          estadoPago: clinica.estadoPago,
          fechaCreacion: clinica.fechaCreacion.toISOString().split('T')[0],
          ultimoPago: clinica.ultimoPago ? clinica.ultimoPago.toISOString().split('T')[0] : null,
          proximoPago: clinica.proximoPago ? clinica.proximoPago.toISOString().split('T')[0] : null,
          direccion: clinica.address,
          telefono: clinica.phone,
          email: clinica.email,
          horarios: clinica.horarios,
          especialidades: clinica.especialidades ? JSON.parse(clinica.especialidades) : []
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al crear clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async updateClinicaEstado(clinicaId: string, dto: UpdateClinicaEstadoDto) {
    try {
      // Verificar si la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: clinicaId }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Actualizar el estado de la clínica
      await this.prisma.clinica.update({
        where: { id: clinicaId },
        data: {
          estado: dto.estado
        }
      });

      return {
        success: true
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al actualizar estado de clínica:', error);
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