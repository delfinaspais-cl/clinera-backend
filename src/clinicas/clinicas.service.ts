import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioClinicaDto } from './dto/create-usuario-clinica.dto';
import { UpdateUsuarioEstadoDto } from './dto/update-usuario-estado.dto';
import { GetTurnosFiltersDto } from './dto/get-turnos-filters.dto';
import { GetUsuariosFiltersDto } from './dto/get-usuarios-filters.dto';
import { UpdateTurnoEstadoDto } from './dto/update-turno-estado.dto';
import { UpdateClinicaConfiguracionDto } from './dto/update-clinica-configuracion.dto';
import { CreateTurnoLandingDto } from '../public/dto/create-turno-landing.dto';
import * as bcrypt from 'bcrypt';
import { CreateTurnoDto } from './dto/create-turno.dto';

@Injectable()
export class ClinicasService {
  constructor(private prisma: PrismaService) {}

  async getUsuariosByClinicaUrl(clinicaUrl: string, filters: GetUsuariosFiltersDto = {}) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Construir filtros
      const where: any = {
        clinicaId: clinica.id
      };

      if (filters.role) {
        where.role = filters.role;
      }

      if (filters.estado) {
        where.estado = filters.estado;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Construir ordenamiento
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortOrder || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      // Calcular paginación
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      // Obtener usuarios con paginación
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            professional: true,
            patient: true
          }
        }),
        this.prisma.user.count({ where })
      ]);

      // Transformar los datos para el formato requerido
      const usuariosFormateados = users.map(user => {
        let especialidad = '';
        if (user.professional && user.professional.specialties) {
          especialidad = user.professional.specialties.join(', ');
        }

        return {
          id: user.id,
          nombre: user.name || 'Sin nombre',
          email: user.email,
          rol: user.role.toLowerCase(),
          especialidad,
          estado: user.estado || 'activo',
          fechaCreacion: user.createdAt.toISOString().split('T')[0],
          ultimoAcceso: user.updatedAt.toISOString().split('T')[0],
          turnos: 0, // Se puede calcular después si es necesario
          pacientes: 0  // Se puede calcular después si es necesario
        };
      });

      return {
        success: true,
        usuarios: usuariosFormateados,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener usuarios de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async createUsuarioClinica(clinicaUrl: string, dto: CreateUsuarioClinicaDto) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Verificar si el email ya existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email }
      });

      if (existingUser) {
        throw new BadRequestException('El email ya está registrado');
      }

      // Mapear el rol del DTO al enum de Prisma
      let role: any;
      switch (dto.rol) {
        case 'profesional':
          role = 'PROFESSIONAL';
          break;
        case 'secretario':
          role = 'SECRETARY';
          break;
        case 'administrador':
          role = 'ADMIN';
          break;
        default:
          throw new BadRequestException('Rol inválido');
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Crear el usuario
      const usuario = await this.prisma.user.create({
        data: {
          name: dto.nombre,
          email: dto.email,
          password: hashedPassword,
          role: role,
          clinicaId: clinica.id
        }
      });

      return {
        success: true,
        usuario: {
          id: usuario.id,
          nombre: usuario.name,
          email: usuario.email,
          rol: dto.rol,
          especialidad: dto.especialidad || null,
          estado: 'activo',
          fechaCreacion: usuario.createdAt.toISOString().split('T')[0],
          ultimoAcceso: usuario.updatedAt.toISOString().split('T')[0],
          turnos: 0,
          pacientes: 0
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al crear usuario de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async updateUsuarioEstado(clinicaUrl: string, userId: string, dto: UpdateUsuarioEstadoDto) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Verificar que el usuario existe y pertenece a la clínica
      const usuario = await this.prisma.user.findFirst({
        where: {
          id: userId,
          clinicaId: clinica.id
        }
      });

      if (!usuario) {
        throw new BadRequestException('Usuario no encontrado en esta clínica');
      }

      // Actualizar el estado del usuario
      await this.prisma.user.update({
        where: { id: userId },
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
      console.error('Error al actualizar estado de usuario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getTurnosByClinicaUrl(clinicaUrl: string, filters: GetTurnosFiltersDto = {}) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Construir filtros para la consulta
      const whereClause: any = {
        clinicaId: clinica.id
      };

      // Filtro por rango de fechas
      if (filters.fechaDesde || filters.fechaHasta) {
        whereClause.fecha = {};
        if (filters.fechaDesde) {
          whereClause.fecha.gte = new Date(filters.fechaDesde);
        }
        if (filters.fechaHasta) {
          whereClause.fecha.lte = new Date(filters.fechaHasta);
        }
      }

      if (filters.estado) {
        whereClause.estado = filters.estado;
      }

      if (filters.especialidad) {
        whereClause.especialidad = filters.especialidad;
      }

      if (filters.doctor) {
        whereClause.doctor = { contains: filters.doctor, mode: 'insensitive' };
      }

      if (filters.paciente) {
        whereClause.paciente = { contains: filters.paciente, mode: 'insensitive' };
      }

      if (filters.email) {
        whereClause.email = { contains: filters.email, mode: 'insensitive' };
      }

      if (filters.search) {
        whereClause.OR = [
          { paciente: { contains: filters.search, mode: 'insensitive' } },
          { doctor: { contains: filters.search, mode: 'insensitive' } },
          { especialidad: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Construir ordenamiento
      const orderBy: any = {};
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortOrder || 'desc';
      } else {
        orderBy.fecha = 'desc';
        orderBy.hora = 'asc';
      }

      // Calcular paginación
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      // Obtener turnos con paginación
      const [turnos, total] = await Promise.all([
        this.prisma.turno.findMany({
          where: whereClause,
          orderBy,
          skip,
          take: limit
        }),
        this.prisma.turno.count({ where: whereClause })
      ]);

      // Obtener estadísticas
      const stats = await this.prisma.turno.groupBy({
        by: ['estado'],
        where: { clinicaId: clinica.id },
        _count: {
          estado: true
        }
      });

      // Transformar estadísticas
      const statsFormateadas = {
        total: turnos.length,
        confirmados: stats.find(s => s.estado === 'confirmado')?._count.estado || 0,
        pendientes: stats.find(s => s.estado === 'pendiente')?._count.estado || 0,
        cancelados: stats.find(s => s.estado === 'cancelado')?._count.estado || 0
      };

      // Transformar los datos para el formato requerido
      const turnosFormateados = turnos.map(turno => ({
        id: turno.id,
        paciente: turno.paciente,
        email: turno.email,
        telefono: turno.telefono,
        especialidad: turno.especialidad,
        doctor: turno.doctor,
        fecha: turno.fecha.toISOString().split('T')[0],
        hora: turno.hora,
        estado: turno.estado,
        motivo: turno.motivo
      }));

      return {
        success: true,
        turnos: turnosFormateados,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        stats: statsFormateadas
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener turnos de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async updateTurnoEstado(clinicaUrl: string, turnoId: string, dto: UpdateTurnoEstadoDto) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar el turno y verificar que pertenece a la clínica
      const turno = await this.prisma.turno.findFirst({
        where: {
          id: turnoId,
          clinicaId: clinica.id
        }
      });

      if (!turno) {
        throw new BadRequestException('Turno no encontrado');
      }

      // Actualizar el estado del turno
      const turnoActualizado = await this.prisma.turno.update({
        where: { id: turnoId },
        data: {
          estado: dto.estado,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        turno: {
          id: turnoActualizado.id,
          paciente: turnoActualizado.paciente,
          email: turnoActualizado.email,
          telefono: turnoActualizado.telefono,
          especialidad: turnoActualizado.especialidad,
          doctor: turnoActualizado.doctor,
          fecha: turnoActualizado.fecha.toISOString().split('T')[0],
          hora: turnoActualizado.hora,
          estado: turnoActualizado.estado,
          motivo: turnoActualizado.motivo
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al actualizar estado de turno:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async deleteTurno(clinicaUrl: string, turnoId: string) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar el turno y verificar que pertenece a la clínica
      const turno = await this.prisma.turno.findFirst({
        where: {
          id: turnoId,
          clinicaId: clinica.id
        }
      });

      if (!turno) {
        throw new BadRequestException('Turno no encontrado');
      }

      // Eliminar el turno
      await this.prisma.turno.delete({
        where: { id: turnoId }
      });

      return {
        success: true,
        message: 'Turno eliminado exitosamente'
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al eliminar turno:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getClinicaConfiguracion(clinicaUrl: string) {
  try {
    // Buscar la clínica por URL incluyendo relaciones
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
      include: {
        horarios: true,
        especialidades: true,
      },
    });

    if (!clinica) {
      throw new BadRequestException('Clínica no encontrada');
    }

    // Transformar los datos para el formato requerido
    const clinicaFormateada = {
      id: clinica.id,
      nombre: clinica.name,
      url: clinica.url,
      colorPrimario: clinica.colorPrimario,
      colorSecundario: clinica.colorSecundario,
      direccion: clinica.address,
      telefono: clinica.phone,
      email: clinica.email,
      horarios: clinica.horarios,
      especialidades: clinica.especialidades,
      descripcion: clinica.descripcion,
      contacto: clinica.contacto ? JSON.parse(clinica.contacto) : {}
    };

    return {
      success: true,
      clinica: clinicaFormateada
    };
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    console.error('Error al obtener configuración de clínica:', error);
    throw new BadRequestException('Error interno del servidor');
  }
}


  async updateClinicaConfiguracion(clinicaUrl: string, dto: UpdateClinicaConfiguracionDto) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Preparar los datos para actualizar
      const updateData: any = {};

      if (dto.nombre) {
        updateData.name = dto.nombre;
      }

      if (dto.colorPrimario) {
        updateData.colorPrimario = dto.colorPrimario;
      }

      if (dto.colorSecundario) {
        updateData.colorSecundario = dto.colorSecundario;
      }

      if (dto.descripcion) {
        updateData.descripcion = dto.descripcion;
      }

      if (dto.contacto) {
        // Obtener el contacto actual y actualizarlo
        const contactoActual = clinica.contacto ? JSON.parse(clinica.contacto) : {};
        const contactoActualizado = { ...contactoActual, ...dto.contacto };
        updateData.contacto = JSON.stringify(contactoActualizado);
      }

      // Actualizar la clínica
      await this.prisma.clinica.update({
        where: { url: clinicaUrl },
        data: updateData
      });

      return {
        success: true,
        message: 'Configuración de clínica actualizada exitosamente'
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al actualizar configuración de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getClinicaLanding(clinicaUrl: string) {
  try {
    // Buscar la clínica por URL incluyendo relaciones
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
      include: {
        horarios: true,
        especialidades: true,
      },
    });

    if (!clinica) {
      throw new BadRequestException('Clínica no encontrada');
    }

    // Obtener turnos disponibles (confirmados) para los próximos 7 días
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setDate(fechaFin.getDate() + 7);

    const turnosDisponibles = await this.prisma.turno.findMany({
      where: {
        clinicaId: clinica.id,
        estado: 'confirmado',
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      orderBy: [
        { fecha: 'asc' },
        { hora: 'asc' }
      ],
      take: 10 // Limitar a 10 turnos
    });

    // Transformar los datos para el formato requerido
    const clinicaFormateada = {
      id: clinica.id,
      nombre: clinica.name,
      url: clinica.url,
      logo: clinica.logo,
      colorPrimario: clinica.colorPrimario,
      colorSecundario: clinica.colorSecundario,
      descripcion: clinica.descripcion,
      direccion: clinica.address,
      telefono: clinica.phone,
      email: clinica.email,
      horarios: clinica.horarios,
      especialidades: clinica.especialidades,
      rating: clinica.rating,
      stats: clinica.stats ? JSON.parse(clinica.stats) : {}
    };

    const turnosFormateados = turnosDisponibles.map(turno => ({
      fecha: turno.fecha.toISOString().split('T')[0],
      hora: turno.hora,
      especialidad: turno.especialidad,
      doctor: turno.doctor
    }));

    return {
      success: true,
      clinica: clinicaFormateada,
      turnosDisponibles: turnosFormateados
    };
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    console.error('Error al obtener datos de landing de clínica:', error);
    throw new BadRequestException('Error interno del servidor');
  }
}


  async createTurnoFromLanding(clinicaUrl: string, dto: CreateTurnoLandingDto) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Validar que la fecha no sea en el pasado
      const fechaTurno = new Date(dto.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaTurno < hoy) {
        throw new BadRequestException('No se pueden crear turnos para fechas pasadas');
      }

      // Verificar si ya existe un turno para la misma fecha, hora y doctor
      const turnoExistente = await this.prisma.turno.findFirst({
        where: {
          clinicaId: clinica.id,
          fecha: fechaTurno,
          hora: dto.hora,
          doctor: dto.doctor,
          estado: {
            in: ['confirmado', 'pendiente']
          }
        }
      });

      if (turnoExistente) {
        throw new BadRequestException('Ya existe un turno para esta fecha, hora y doctor');
      }

      // Crear el turno
      const turnoCreado = await this.prisma.turno.create({
        data: {
          paciente: dto.nombre,
          email: dto.email,
          telefono: dto.telefono,
          especialidad: dto.especialidad,
          doctor: dto.doctor,
          fecha: fechaTurno,
          hora: dto.hora,
          estado: 'confirmado', // Los turnos desde landing se crean confirmados
          motivo: dto.motivo,
          clinicaId: clinica.id
        }
      });

      // Formatear la fecha para el mensaje
      const fechaFormateada = fechaTurno.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      return {
        success: true,
        turno: {
          id: turnoCreado.id,
          paciente: turnoCreado.paciente,
          email: turnoCreado.email,
          telefono: turnoCreado.telefono,
          especialidad: turnoCreado.especialidad,
          doctor: turnoCreado.doctor,
          fecha: turnoCreado.fecha.toISOString().split('T')[0],
          hora: turnoCreado.hora,
          estado: turnoCreado.estado,
          motivo: turnoCreado.motivo
        },
        mensaje: `Turno confirmado para ${fechaFormateada} a las ${dto.hora} con ${dto.doctor}`
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al crear turno desde landing:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getClinicaStats(clinicaUrl: string) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Obtener estadísticas de usuarios
      const totalUsuarios = await this.prisma.user.count({
        where: {
          clinicaId: clinica.id,
          role: {
            in: ['ADMIN', 'PROFESSIONAL', 'SECRETARY']
          }
        }
      });

      const profesionales = await this.prisma.user.count({
        where: {
          clinicaId: clinica.id,
          role: 'PROFESSIONAL'
        }
      });

      // Obtener estadísticas de turnos del mes actual
      const fechaInicio = new Date();
      fechaInicio.setDate(1); // Primer día del mes
      fechaInicio.setHours(0, 0, 0, 0);

      const fechaFin = new Date();
      fechaFin.setMonth(fechaFin.getMonth() + 1);
      fechaFin.setDate(0); // Último día del mes
      fechaFin.setHours(23, 59, 59, 999);

      const turnosMes = await this.prisma.turno.count({
        where: {
          clinicaId: clinica.id,
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      });

      // Obtener estadísticas por estado de turnos
      const turnosConfirmados = await this.prisma.turno.count({
        where: {
          clinicaId: clinica.id,
          estado: 'confirmado',
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      });

      const turnosPendientes = await this.prisma.turno.count({
        where: {
          clinicaId: clinica.id,
          estado: 'pendiente',
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      });

      const turnosCancelados = await this.prisma.turno.count({
        where: {
          clinicaId: clinica.id,
          estado: 'cancelado',
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      });

      // Calcular pacientes únicos (basado en emails únicos de turnos)
      const pacientesUnicos = await this.prisma.turno.groupBy({
        by: ['email'],
        where: {
          clinicaId: clinica.id,
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        _count: {
          email: true
        }
      });

      const pacientes = pacientesUnicos.length;

      // Calcular ingresos mensuales (simulado basado en turnos confirmados)
      // En un sistema real, esto vendría de un sistema de pagos
      const ingresosMes = turnosConfirmados * 180; // $180 por turno confirmado

      return {
        success: true,
        stats: {
          totalUsuarios,
          profesionales,
          turnosMes,
          pacientes,
          ingresosMes,
          turnosConfirmados,
          turnosPendientes,
          turnosCancelados
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener estadísticas de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async createTurno(clinicaUrl: string, dto: CreateTurnoDto) {
  const clinica = await this.prisma.clinica.findUnique({
    where: { url: clinicaUrl },
  });

  if (!clinica) {
    throw new BadRequestException('Clínica no encontrada');
  }

  const turno = await this.prisma.turno.create({
    data: {
      paciente: dto.paciente,
      email: dto.email,
      telefono: dto.telefono,
      especialidad: dto.especialidad,
      doctor: dto.doctor,
      fecha: new Date(dto.fecha),
      hora: dto.hora,
      motivo: dto.motivo,
      clinicaId: clinica.id,
    },
  });

  return {
    success: true,
    turno,
  };
}  

// async getTurnosByClinicaUrl(clinicaUrl: string, filters: GetTurnosFiltersDto) {
//   const clinica = await this.prisma.clinica.findUnique({
//     where: { url: clinicaUrl },
//     select: { id: true }
//   });

//   if (!clinica) {
//     throw new Error('Clínica no encontrada');
//   }

//   const { fecha, estado, especialidad } = filters;

//   return this.prisma.turno.findMany({
//     where: {
//       clinicaId: clinica.id,
//       ...(fecha && { fecha: new Date(fecha) }),
//       ...(estado && { estado }),
//       ...(especialidad && { especialidad }),
//     },
//     orderBy: { fecha: 'asc' }
//   });
// }

} 