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
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { SearchTurnosDto } from './dto/search-turnos.dto';

@Injectable()
export class ClinicasService {
  constructor(private prisma: PrismaService) {}

  async getUsuariosByClinicaUrl(
    clinicaUrl: string,
    filters: GetUsuariosFiltersDto = {},
  ) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Construir filtros
      const where: any = {
        clinicaId: clinica.id,
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
          { email: { contains: filters.search, mode: 'insensitive' } },
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
            patient: true,
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      // Transformar los datos para el formato requerido
      const usuariosFormateados = users.map((user) => {
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
          pacientes: 0, // Se puede calcular después si es necesario
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
          hasPrev: page > 1,
        },
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
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Verificar si el email ya existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
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
          clinicaId: clinica.id,
        },
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
          pacientes: 0,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al crear usuario de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async updateUsuarioEstado(
    clinicaUrl: string,
    userId: string,
    dto: UpdateUsuarioEstadoDto,
  ) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Verificar que el usuario existe y pertenece a la clínica
      const usuario = await this.prisma.user.findFirst({
        where: {
          id: userId,
          clinicaId: clinica.id,
        },
      });

      if (!usuario) {
        throw new BadRequestException('Usuario no encontrado en esta clínica');
      }

      // Actualizar el estado del usuario
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          estado: dto.estado,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al actualizar estado de usuario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getTurnosByClinicaUrl(clinicaUrl: string, filters: any = {}) {
    try {
      console.log('=== GET TURNOS BY CLINICA URL ===');
      console.log('clinicaUrl:', clinicaUrl);
      console.log('filters:', filters);

      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      console.log('Clínica encontrada:', clinica.id);

      // Construir filtros para la consulta
      const whereClause: any = {
        clinicaId: clinica.id,
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



      if (filters.doctor) {
        whereClause.doctor = { contains: filters.doctor, mode: 'insensitive' };
      }

      if (filters.paciente) {
        whereClause.paciente = {
          contains: filters.paciente,
          mode: 'insensitive',
        };
      }

      if (filters.email) {
        whereClause.email = { contains: filters.email, mode: 'insensitive' };
      }

      if (filters.search) {
        whereClause.OR = [
          { paciente: { contains: filters.search, mode: 'insensitive' } },
          { doctor: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      console.log('Where clause:', whereClause);

      // Construir ordenamiento
      let orderBy: any;
      if (filters.sortBy) {
        orderBy = { [filters.sortBy]: filters.sortOrder || 'desc' };
      } else {
        orderBy = [{ fecha: 'desc' }, { hora: 'asc' }];
      }

      // Calcular paginación
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      console.log('Paginación:', { page, limit, skip });

      // Obtener turnos con paginación
      console.log('Ejecutando consulta de turnos...');
      let turnos, total;
      try {
        [turnos, total] = await Promise.all([
          this.prisma.turno.findMany({
            where: whereClause,
            orderBy,
            skip,
            take: limit,
            include: {
              professional: {
                include: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    }
                  }
                }
              }
            },
          }),
          this.prisma.turno.count({ where: whereClause }),
        ]);

        console.log('Turnos encontrados:', turnos.length);
        console.log('Total de turnos:', total);
        console.log('Primer turno (si existe):', turnos[0] || 'No hay turnos');
      } catch (dbError) {
        console.error('Error en consulta de base de datos:', dbError);
        throw new BadRequestException(
          'Error en consulta de base de datos: ' + dbError.message,
        );
      }

      // Obtener estadísticas de forma simplificada (sin groupBy)
      console.log('Ejecutando consultas de estadísticas...');
      let confirmados, pendientes, cancelados, completados;
      try {
        [confirmados, pendientes, cancelados, completados] = await Promise.all([
          this.prisma.turno.count({
            where: {
              clinicaId: clinica.id,
              estado: 'confirmado',
            },
          }),
          this.prisma.turno.count({
            where: {
              clinicaId: clinica.id,
              estado: 'pendiente',
            },
          }),
          this.prisma.turno.count({
            where: {
              clinicaId: clinica.id,
              estado: 'cancelado',
            },
          }),
          this.prisma.turno.count({
            where: {
              clinicaId: clinica.id,
              estado: 'completado',
            },
          }),
        ]);

        console.log('Stats obtenidas:', {
          confirmados,
          pendientes,
          cancelados,
          completados,
        });
      } catch (statsError) {
        console.error('Error en consultas de estadísticas:', statsError);
        throw new BadRequestException(
          'Error en consultas de estadísticas: ' + statsError.message,
        );
      }

      // Transformar estadísticas
      const statsFormateadas = {
        total: total,
        confirmados: confirmados,
        pendientes: pendientes,
        cancelados: cancelados,
        completados: completados,
      };

      // Transformar los datos para el formato requerido
      console.log('Transformando datos de turnos...');
      let turnosFormateados;
      try {
        turnosFormateados = turnos.map((turno) => {
          // Calcular hora de fin basada en la duración
          const horaInicio = new Date(`2000-01-01T${turno.hora}`);
          const horaFin = new Date(horaInicio.getTime() + (turno.duracionMin || 30) * 60000);
          const horaFinStr = horaFin.toTimeString().slice(0, 5);
          
          return {
            id: turno.id,
            paciente: turno.paciente,
            email: turno.email,
            telefono: turno.telefono,
            doctor: turno.doctor,
            fecha: turno.fecha.toISOString().split('T')[0],
            hora: turno.hora,
            horaFin: horaFinStr,
            duracionMin: turno.duracionMin || 30,
            estado: turno.estado,
            motivo: turno.motivo,
            notas: turno.notas,
            servicio: turno.servicio,
            professionalId: turno.professionalId,
            clinicaId: turno.clinicaId,
            montoTotal: turno.montoTotal,
            estadoPago: turno.estadoPago,
            medioPago: turno.medioPago,
            origen: turno.origen,
            ate: turno.ate,
            sucursal: turno.sucursal,
            createdAt: turno.createdAt,
            updatedAt: turno.updatedAt,
            professional: turno.professional ? {
              id: turno.professional.id,
              name: turno.professional.name,
              specialties: turno.professional.specialties,
              user: turno.professional.user,
            } : null,
          };
        });
        console.log('Datos transformados exitosamente');
      } catch (transformError) {
        console.error('Error transformando datos:', transformError);
        throw new BadRequestException(
          'Error transformando datos: ' + transformError.message,
        );
      }

      const result = {
        success: true,
        turnos: turnosFormateados,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        stats: statsFormateadas,
      };

      console.log('Resultado final:', result);
      return result;
    } catch (error) {
      console.error('Error al obtener turnos de clínica:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getTurnosHoy(clinicaUrl: string) {
    try {
      console.log('=== GET TURNOS HOY ===');
      console.log('clinicaUrl:', clinicaUrl);

      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Obtener la fecha de hoy
      const hoy = new Date();
      const fechaHoy = hoy.toISOString().split('T')[0];

      console.log('Fecha de hoy:', fechaHoy);

      // Obtener turnos de hoy
      const turnosHoy = await this.prisma.turno.findMany({
        where: {
          clinicaId: clinica.id,
          fecha: {
            gte: new Date(fechaHoy),
            lt: new Date(new Date(fechaHoy).getTime() + 24 * 60 * 60 * 1000),
          },
        },
        orderBy: [
          { hora: 'asc' },
        ],
        include: {
          professional: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          }
        },
      });

      console.log('Turnos de hoy encontrados:', turnosHoy.length);

      // Transformar los datos para el formato requerido
      const turnosFormateados = turnosHoy.map((turno) => {
        // Calcular hora de fin basada en la duración
        const horaInicio = new Date(`2000-01-01T${turno.hora}`);
        const horaFin = new Date(horaInicio.getTime() + (turno.duracionMin || 30) * 60000);
        const horaFinStr = horaFin.toTimeString().slice(0, 5);
        
        return {
          id: turno.id,
          paciente: turno.paciente,
          email: turno.email,
          telefono: turno.telefono,
          doctor: turno.doctor,
          fecha: turno.fecha.toISOString().split('T')[0],
          hora: turno.hora,
          horaFin: horaFinStr,
          duracionMin: turno.duracionMin || 30,
          estado: turno.estado,
          motivo: turno.motivo,
          notas: turno.notas,
          servicio: turno.servicio,
          professionalId: turno.professionalId,
          professional: turno.professional ? {
            id: turno.professional.id,
            name: turno.professional.name,
            specialties: turno.professional.specialties,
            user: turno.professional.user,
          } : null,
        };
      });

      const result = {
        success: true,
        turnos: turnosFormateados,
        total: turnosFormateados.length,
        fecha: fechaHoy,
      };

      console.log('Resultado final:', result);
      return result;
    } catch (error) {
      console.error('Error al obtener turnos de hoy:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getCalendarioStats(clinicaUrl: string, fechaDesde?: string, fechaHasta?: string) {
    try {
      console.log('=== GET CALENDARIO STATS ===');
      console.log('clinicaUrl:', clinicaUrl);
      console.log('fechaDesde:', fechaDesde);
      console.log('fechaHasta:', fechaHasta);

      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Construir filtros de fecha
      const whereClause: any = {
        clinicaId: clinica.id,
      };

      if (fechaDesde || fechaHasta) {
        whereClause.fecha = {};
        if (fechaDesde) {
          whereClause.fecha.gte = new Date(fechaDesde);
        }
        if (fechaHasta) {
          whereClause.fecha.lte = new Date(fechaHasta);
        }
      }

      // Obtener turnos agrupados por fecha
      const turnosPorFecha = await this.prisma.turno.groupBy({
        by: ['fecha', 'estado'],
        where: whereClause,
        _count: {
          id: true,
        },
      });

      // Transformar datos para el formato requerido
      const calendarioData = turnosPorFecha.reduce((acc, item) => {
        const fecha = item.fecha.toISOString().split('T')[0];
        const estado = item.estado;
        const count = item._count.id;

        if (!acc[fecha]) {
          acc[fecha] = {
            fecha,
            total: 0,
            confirmados: 0,
            pendientes: 0,
            cancelados: 0,
            completados: 0,
          };
        }

        acc[fecha].total += count;
        acc[fecha][estado + 's'] += count; // confirmados, pendientes, etc.

        return acc;
      }, {});

      const result = {
        success: true,
        calendario: Object.values(calendarioData),
        totalDias: Object.keys(calendarioData).length,
      };

      console.log('Resultado final:', result);
      return result;
    } catch (error) {
      console.error('Error al obtener estadísticas del calendario:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async updateTurnoEstado(
    clinicaUrl: string,
    turnoId: string,
    dto: UpdateTurnoEstadoDto,
  ) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar el turno y verificar que pertenece a la clínica
      const turno = await this.prisma.turno.findFirst({
        where: {
          id: turnoId,
          clinicaId: clinica.id,
        },
      });

      if (!turno) {
        throw new BadRequestException('Turno no encontrado');
      }

      // Actualizar el estado del turno
      const turnoActualizado = await this.prisma.turno.update({
        where: { id: turnoId },
        data: {
          estado: dto.estado,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        turno: {
          id: turnoActualizado.id,
          paciente: turnoActualizado.paciente,
          email: turnoActualizado.email,
          telefono: turnoActualizado.telefono,

          doctor: turnoActualizado.doctor,
          fecha: turnoActualizado.fecha.toISOString().split('T')[0],
          hora: turnoActualizado.hora,
          estado: turnoActualizado.estado,
          motivo: turnoActualizado.motivo,
        },
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
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar el turno y verificar que pertenece a la clínica
      const turno = await this.prisma.turno.findFirst({
        where: {
          id: turnoId,
          clinicaId: clinica.id,
        },
      });

      if (!turno) {
        throw new BadRequestException('Turno no encontrado');
      }

      // Eliminar el turno
      await this.prisma.turno.delete({
        where: { id: turnoId },
      });

      return {
        success: true,
        message: 'Turno eliminado exitosamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al eliminar turno:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getClinicaInfo(clinicaUrl: string) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Transformar los datos para el formato requerido
      const clinicaFormateada = {
        id: clinica.id,
        nombre: clinica.name,
        url: clinica.url,
        colorPrimario: clinica.colorPrimario || '#3B82F6',
        colorSecundario: clinica.colorSecundario || '#1E40AF',
        direccion: clinica.address,
        telefono: clinica.phone,
        email: clinica.email,
        logo: clinica.logo,
        estado: clinica.estado || 'activa',
        estadoPago: clinica.estadoPago || 'pagado',
        fechaCreacion: clinica.fechaCreacion.toISOString(),
        createdAt: clinica.createdAt.toISOString(),
        updatedAt: clinica.updatedAt.toISOString(),
      };

      return {
        success: true,
        clinica: clinicaFormateada,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener información de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getTurnosCount(clinicaUrl: string) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        return 0;
      }

      const count = await this.prisma.turno.count({
        where: { clinicaId: clinica.id },
      });

      return count;
    } catch (error) {
      console.error('Error contando turnos:', error);
      return 0;
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
        contacto: clinica.contacto ? JSON.parse(clinica.contacto) : {},
      };

      return {
        success: true,
        clinica: clinicaFormateada,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener configuración de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async updateClinicaConfiguracion(
    clinicaUrl: string,
    dto: UpdateClinicaConfiguracionDto,
  ) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
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
        const contactoActual = clinica.contacto
          ? JSON.parse(clinica.contacto)
          : {};
        const contactoActualizado = { ...contactoActual, ...dto.contacto };
        updateData.contacto = JSON.stringify(contactoActualizado);
      }

      // Actualizar la clínica
      await this.prisma.clinica.update({
        where: { url: clinicaUrl },
        data: updateData,
      });

      return {
        success: true,
        message: 'Configuración de clínica actualizada exitosamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al actualizar configuración de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async checkClinicaExists(clinicaUrl: string) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
        select: {
          id: true,
          name: true,
          url: true,
          estado: true,
        },
      });

      if (!clinica) {
        return {
          success: false,
          exists: false,
          message: 'Clínica no encontrada',
        };
      }

      return {
        success: true,
        exists: true,
        clinica: {
          id: clinica.id,
          nombre: clinica.name,
          url: clinica.url,
          estado: clinica.estado,
        },
      };
    } catch (error) {
      console.error('Error al verificar existencia de clínica:', error);
      return {
        success: false,
        exists: false,
        message: 'Error interno del servidor',
      };
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
            lte: fechaFin,
          },
        },
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
        take: 10, // Limitar a 10 turnos
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
        stats: clinica.stats ? JSON.parse(clinica.stats) : {},
      };

      const turnosFormateados = turnosDisponibles.map((turno) => ({
        fecha: turno.fecha.toISOString().split('T')[0],
        hora: turno.hora,
        doctor: turno.doctor,
      }));

      return {
        success: true,
        clinica: clinicaFormateada,
        turnosDisponibles: turnosFormateados,
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
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Validar que la fecha no sea en el pasado
      const fechaTurno = new Date(dto.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaTurno < hoy) {
        throw new BadRequestException(
          'No se pueden crear turnos para fechas pasadas',
        );
      }

      // Verificar si ya existe un turno para la misma fecha, hora y doctor
      const turnoExistente = await this.prisma.turno.findFirst({
        where: {
          clinicaId: clinica.id,
          fecha: fechaTurno,
          hora: dto.hora,
          doctor: dto.doctor,
          estado: {
            in: ['confirmado', 'pendiente'],
          },
        },
      });

      if (turnoExistente) {
        throw new BadRequestException(
          'Ya existe un turno para esta fecha, hora y doctor',
        );
      }

      // Crear el turno
      const turnoCreado = await this.prisma.turno.create({
        data: {
          paciente: dto.nombre,
          email: dto.email,
          telefono: dto.telefono,
          doctor: dto.doctor,
          fecha: fechaTurno,
          hora: dto.hora,
          estado: 'confirmado', // Los turnos desde landing se crean confirmados
          motivo: dto.motivo,
          clinicaId: clinica.id,
        },
      });

      // Formatear la fecha para el mensaje
      const fechaFormateada = fechaTurno.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      return {
        success: true,
        turno: {
          id: turnoCreado.id,
          paciente: turnoCreado.paciente,
          email: turnoCreado.email,
          telefono: turnoCreado.telefono,

          doctor: turnoCreado.doctor,
          fecha: turnoCreado.fecha.toISOString().split('T')[0],
          hora: turnoCreado.hora,
          estado: turnoCreado.estado,
          motivo: turnoCreado.motivo,
        },
        mensaje: `Turno confirmado para ${fechaFormateada} a las ${dto.hora} con ${dto.doctor}`,
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
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Obtener estadísticas de usuarios
      const totalUsuarios = await this.prisma.user.count({
        where: {
          clinicaId: clinica.id,
          role: {
            in: ['ADMIN', 'PROFESSIONAL', 'SECRETARY'],
          },
        },
      });

      const profesionales = await this.prisma.user.count({
        where: {
          clinicaId: clinica.id,
          role: 'PROFESSIONAL',
        },
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
            lte: fechaFin,
          },
        },
      });

      // Obtener estadísticas por estado de turnos
      const turnosConfirmados = await this.prisma.turno.count({
        where: {
          clinicaId: clinica.id,
          estado: 'confirmado',
          fecha: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
      });

      const turnosPendientes = await this.prisma.turno.count({
        where: {
          clinicaId: clinica.id,
          estado: 'pendiente',
          fecha: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
      });

      const turnosCancelados = await this.prisma.turno.count({
        where: {
          clinicaId: clinica.id,
          estado: 'cancelado',
          fecha: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
      });

      // Calcular pacientes únicos (basado en emails únicos de turnos)
      const pacientesUnicos = await this.prisma.turno.groupBy({
        by: ['email'],
        where: {
          clinicaId: clinica.id,
          fecha: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
        _count: {
          email: true,
        },
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
          turnosCancelados,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener estadísticas de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getTurnoById(clinicaUrl: string, turnoId: string) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar el turno específico
      const turno = await this.prisma.turno.findFirst({
        where: {
          id: turnoId,
          clinicaId: clinica.id,
        },
        include: {
          professional: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          }
        },
      });

      if (!turno) {
        throw new BadRequestException('Turno no encontrado');
      }

      // Calcular hora de fin basada en la duración
      const horaInicio = new Date(`2000-01-01T${turno.hora}`);
      const horaFin = new Date(horaInicio.getTime() + (turno.duracionMin || 30) * 60000);
      const horaFinStr = horaFin.toTimeString().slice(0, 5);

      // Transformar los datos para el formato requerido
      const turnoFormateado = {
        id: turno.id,
        paciente: turno.paciente,
        email: turno.email,
        telefono: turno.telefono,
        doctor: turno.doctor,
        fecha: turno.fecha.toISOString().split('T')[0],
        hora: turno.hora,
        horaFin: horaFinStr,
        duracionMin: turno.duracionMin || 30,
        estado: turno.estado,
        motivo: turno.motivo,
        notas: turno.notas,
        servicio: turno.servicio,
        professionalId: turno.professionalId,
        professional: turno.professional ? {
          id: turno.professional.id,
          name: turno.professional.name,
          specialties: turno.professional.specialties,
          user: turno.professional.user,
        } : null,
        clinicaId: turno.clinicaId,
        createdAt: turno.createdAt,
        updatedAt: turno.updatedAt,
      };

      return {
        success: true,
        turno: turnoFormateado,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener turno por ID:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async createTurno(clinicaUrl: string, dto: CreateTurnoDto) {
    try {
      console.log('=== DEBUG CREATE TURNO ===');
      console.log('clinicaUrl:', clinicaUrl);
      console.log('dto:', JSON.stringify(dto, null, 2));
      console.log('========================');

      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        console.log('Clínica no encontrada:', clinicaUrl);
        throw new BadRequestException('Clínica no encontrada');
      }

      console.log('Clínica encontrada:', clinica.id);

      const turnoData = {
        paciente: dto.paciente,
        email: dto.email || `${dto.paciente.toLowerCase().replace(/\s+/g, '.')}@email.com`,
        telefono: dto.telefono,
        doctor: dto.profesional,
        fecha: new Date(dto.fecha),
        hora: dto.hora,
        duracionMin: dto.duracion || 30,
        motivo: dto.motivo,
        notas: dto.notas,
        servicio: dto.tratamiento,
        professionalId: dto.professionalId,
        clinicaId: clinica.id,
        // Nuevos campos para datos de pago
        montoTotal: dto.montoTotal,
        estadoPago: dto.estadoPago || 'pendiente',
        medioPago: dto.medioPago,
        // Nuevos campos adicionales
        origen: dto.origen,
        ate: dto.ate,
        sucursal: dto.sucursal,
        updatedAt: new Date(),
      };

      console.log('Datos del turno a crear:', JSON.stringify(turnoData, null, 2));

      const turno = await this.prisma.turno.create({
        data: turnoData,
      });

      console.log('Turno creado exitosamente:', turno.id);

      return {
        success: true,
        turno,
      };
    } catch (error) {
      console.error('=== ERROR CREATE TURNO ===');
      console.error('Error completo:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error meta:', error.meta);
      console.error('========================');

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error interno del servidor al crear el turno: ${error.message}`);
    }
  }

  async updateTurno(clinicaUrl: string, turnoId: string, dto: UpdateTurnoDto) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar el turno y verificar que pertenece a la clínica
      const turnoExistente = await this.prisma.turno.findFirst({
        where: {
          id: turnoId,
          clinicaId: clinica.id,
        },
      });

      if (!turnoExistente) {
        throw new BadRequestException('Turno no encontrado');
      }

      // Actualizar el turno
      const turnoActualizado = await this.prisma.turno.update({
        where: { id: turnoId },
        data: {
          paciente: dto.paciente,
          email: dto.email || `${dto.paciente.toLowerCase().replace(/\s+/g, '.')}@email.com`,
          telefono: dto.telefono,
          doctor: dto.profesional,
          fecha: new Date(dto.fecha),
          hora: dto.hora,
          duracionMin: dto.duracion || 30,
          motivo: dto.motivo,
          notas: dto.notas,
          servicio: dto.tratamiento,
          professionalId: dto.professionalId,
          estado: dto.estado || 'pendiente',
          // Nuevos campos para datos de pago
          montoTotal: dto.montoTotal,
          estadoPago: dto.estadoPago,
          medioPago: dto.medioPago,
          // Nuevos campos adicionales
          origen: dto.origen,
          ate: dto.ate,
          sucursal: dto.sucursal,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        turno: {
          id: turnoActualizado.id,
          paciente: turnoActualizado.paciente,
          email: turnoActualizado.email,
          telefono: turnoActualizado.telefono,

          doctor: turnoActualizado.doctor,
          fecha: turnoActualizado.fecha.toISOString().split('T')[0],
          hora: turnoActualizado.hora,
          duracionMin: turnoActualizado.duracionMin,
          estado: turnoActualizado.estado,
          motivo: turnoActualizado.motivo,
          notas: turnoActualizado.notas,
          servicio: turnoActualizado.servicio,
          professionalId: turnoActualizado.professionalId,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al actualizar turno:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getTurnosStats(clinicaUrl: string) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Obtener estadísticas por estado
      const statsPorEstado = await this.prisma.turno.groupBy({
        by: ['estado'],
        where: { clinicaId: clinica.id },
        _count: {
          estado: true,
        },
      });



      // Obtener estadísticas por mes (últimos 6 meses)
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 6);

      const statsPorMes = await this.prisma.turno.groupBy({
        by: ['estado'],
        where: {
          clinicaId: clinica.id,
          fecha: {
            gte: fechaInicio,
          },
        },
        _count: {
          estado: true,
        },
      });

      // Calcular totales
      const totalTurnos = statsPorEstado.reduce(
        (acc, stat) => acc + stat._count.estado,
        0,
      );
      const turnosConfirmados =
        statsPorEstado.find((s) => s.estado === 'confirmado')?._count.estado ||
        0;
      const turnosPendientes =
        statsPorEstado.find((s) => s.estado === 'pendiente')?._count.estado ||
        0;
      const turnosCancelados =
        statsPorEstado.find((s) => s.estado === 'cancelado')?._count.estado ||
        0;

      // Calcular porcentajes
      const porcentajeConfirmados =
        totalTurnos > 0 ? (turnosConfirmados / totalTurnos) * 100 : 0;
      const porcentajePendientes =
        totalTurnos > 0 ? (turnosPendientes / totalTurnos) * 100 : 0;
      const porcentajeCancelados =
        totalTurnos > 0 ? (turnosCancelados / totalTurnos) * 100 : 0;

      return {
        success: true,
        stats: {
          total: totalTurnos,
          confirmados: turnosConfirmados,
          pendientes: turnosPendientes,
          cancelados: turnosCancelados,
          porcentajes: {
            confirmados: Math.round(porcentajeConfirmados * 100) / 100,
            pendientes: Math.round(porcentajePendientes * 100) / 100,
            cancelados: Math.round(porcentajeCancelados * 100) / 100,
          },

          ultimos6Meses: statsPorMes.map((stat) => ({
            estado: stat.estado,
            cantidad: stat._count.estado,
          })),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener estadísticas de turnos:', error);
      throw new BadRequestException('Error interno del servidor');
    }
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

  async getClinicaAnalytics(clinicaUrl: string) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Obtener datos de los últimos 12 meses
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 12);

      // Analytics de turnos por mes
      const turnosPorMes = await this.prisma.turno.groupBy({
        by: ['estado'],
        where: {
          clinicaId: clinica.id,
          fecha: {
            gte: fechaInicio,
          },
        },
        _count: {
          estado: true,
        },
      });

      // Analytics de pacientes únicos por mes
      const pacientesPorMes = await this.prisma.turno.groupBy({
        by: ['email'],
        where: {
          clinicaId: clinica.id,
          fecha: {
            gte: fechaInicio,
          },
        },
        _count: {
          email: true,
        },
      });



      // Analytics de doctores más solicitados
      const doctoresPopulares = await this.prisma.turno.groupBy({
        by: ['doctor'],
        where: {
          clinicaId: clinica.id,
        },
        _count: {
          doctor: true,
        },
        orderBy: {
          _count: {
            doctor: 'desc',
          },
        },
        take: 5,
      });

      // Analytics de tendencias de crecimiento
      const ultimos6Meses: Array<{
        mes: string;
        turnos: number;
        pacientesUnicos: number;
      }> = [];
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const mes = fecha.getMonth();
        const año = fecha.getFullYear();

        const turnosMes = await this.prisma.turno.count({
          where: {
            clinicaId: clinica.id,
            fecha: {
              gte: new Date(año, mes, 1),
              lt: new Date(año, mes + 1, 1),
            },
          },
        });

        const pacientesMes = await this.prisma.turno.groupBy({
          by: ['email'],
          where: {
            clinicaId: clinica.id,
            fecha: {
              gte: new Date(año, mes, 1),
              lt: new Date(año, mes + 1, 1),
            },
          },
          _count: {
            email: true,
          },
        });

        ultimos6Meses.push({
          mes: fecha.toLocaleString('es-ES', {
            month: 'long',
            year: 'numeric',
          }),
          turnos: turnosMes,
          pacientesUnicos: pacientesMes.length,
        });
      }

      // Analytics de rendimiento por día de la semana
      const rendimientoPorDia = await this.prisma.turno.groupBy({
        by: ['fecha'],
        where: {
          clinicaId: clinica.id,
          fecha: {
            gte: fechaInicio,
          },
        },
        _count: {
          fecha: true,
        },
      });

      // Calcular días más ocupados
      const diasOcupados = {};
      rendimientoPorDia.forEach((item) => {
        const dia = new Date(item.fecha).toLocaleDateString('es-ES', {
          weekday: 'long',
        });
        diasOcupados[dia] = (diasOcupados[dia] || 0) + item._count.fecha;
      });

      // Analytics de tasa de confirmación
      const totalTurnos = turnosPorMes.reduce(
        (acc, stat) => acc + stat._count.estado,
        0,
      );
      const turnosConfirmados =
        turnosPorMes.find((s) => s.estado === 'confirmado')?._count.estado || 0;
      const tasaConfirmacion =
        totalTurnos > 0 ? (turnosConfirmados / totalTurnos) * 100 : 0;

      // Analytics de ingresos estimados
      const ingresosEstimados = turnosConfirmados * 180; // $180 por turno confirmado

      return {
        success: true,
        analytics: {
          resumen: {
            totalTurnos,
            turnosConfirmados,
            tasaConfirmacion: Math.round(tasaConfirmacion * 100) / 100,
            pacientesUnicos: pacientesPorMes.length,
            ingresosEstimados,
          },

          doctoresPopulares: doctoresPopulares.map((stat) => ({
            doctor: stat.doctor,
            cantidad: stat._count.doctor,
          })),
          tendencias: {
            ultimos6Meses,
            diasOcupados: Object.entries(diasOcupados).map(
              ([dia, cantidad]) => ({
                dia,
                cantidad,
              }),
            ),
          },
          rendimiento: {
            promedioTurnosPorMes: Math.round(totalTurnos / 12),
            promedioPacientesPorMes: Math.round(pacientesPorMes.length / 12),
            tasaCrecimiento:
              ultimos6Meses.length > 1
                ? ((ultimos6Meses[ultimos6Meses.length - 1].turnos -
                    ultimos6Meses[0].turnos) /
                    ultimos6Meses[0].turnos) *
                  100
                : 0,
          },
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener analytics de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  // Método de búsqueda avanzada de turnos
  async searchTurnos(clinicaUrl: string, searchDto: SearchTurnosDto) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Construir filtros de búsqueda
      const where: any = {
        clinicaId: clinica.id,
      };

      // Filtro por paciente
      if (searchDto.paciente) {
        where.OR = [
          { paciente: { contains: searchDto.paciente, mode: 'insensitive' } },
          { email: { contains: searchDto.paciente, mode: 'insensitive' } },
        ];
      }

      // Filtro por profesional
      if (searchDto.profesional) {
        where.doctor = { contains: searchDto.profesional, mode: 'insensitive' };
      }



      // Filtro por estado
      if (searchDto.estado) {
        where.estado = searchDto.estado;
      }

      // Filtro por fecha
      if (searchDto.fechaDesde || searchDto.fechaHasta) {
        where.fecha = {};
        if (searchDto.fechaDesde) {
          where.fecha.gte = new Date(searchDto.fechaDesde);
        }
        if (searchDto.fechaHasta) {
          where.fecha.lte = new Date(searchDto.fechaHasta);
        }
      }

      // Construir ordenamiento
      const orderBy: any = {};
      if (searchDto.sortBy) {
        orderBy[searchDto.sortBy] = searchDto.sortOrder || 'asc';
      } else {
        orderBy.fecha = 'asc';
      }

      // Calcular paginación
      const page = searchDto.page || 1;
      const limit = searchDto.limit || 10;
      const skip = (page - 1) * limit;

      // Obtener turnos con paginación
      const [turnos, total] = await Promise.all([
        this.prisma.turno.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.turno.count({ where }),
      ]);

      // Transformar los datos para el formato requerido
      const turnosFormateados = turnos.map((turno) => ({
        id: turno.id,
        paciente: turno.paciente,
        email: turno.email,
        telefono: turno.telefono,
        doctor: turno.doctor,
        fecha: turno.fecha.toISOString().split('T')[0],
        hora: turno.hora,
        duracionMin: turno.duracionMin,
        estado: turno.estado,
        motivo: turno.motivo || '',
        notas: turno.notas,
        servicio: turno.servicio,
        professionalId: turno.professionalId,
        clinicaId: turno.clinicaId,
        montoTotal: turno.montoTotal,
        estadoPago: turno.estadoPago,
        medioPago: turno.medioPago,
        origen: turno.origen,
        ate: turno.ate,
        sucursal: turno.sucursal,
        createdAt: turno.createdAt.toISOString(),
        updatedAt: turno.updatedAt,
      }));

      return {
        success: true,
        turnos: turnosFormateados,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          paciente: searchDto.paciente,
          profesional: searchDto.profesional,
          estado: searchDto.estado,
          fechaDesde: searchDto.fechaDesde,
          fechaHasta: searchDto.fechaHasta,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al buscar turnos:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getClinicaPlan(clinicaUrl: string) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Definir planes disponibles
      const planes = {
        basic: {
          id: 'basic',
          nombre: 'basic',
          descripcion: 'Plan básico para clínicas pequeñas',
          precio: 29.99,
          moneda: 'USD',
          periodo: 'monthly',
          caracteristicas: [
            'Hasta 3 profesionales',
            'Hasta 50 pacientes',
            'Soporte por email',
            'Reportes básicos'
          ],
          limites: {
            profesionales: 3,
            pacientes: 50,
            turnosPorMes: 200,
            almacenamiento: '500MB',
            notificaciones: true,
            reportes: true,
            integraciones: false
          }
        },
        professional: {
          id: 'professional',
          nombre: 'professional',
          descripcion: 'Plan profesional para clínicas medianas',
          precio: 79.99,
          moneda: 'USD',
          periodo: 'monthly',
          caracteristicas: [
            'Hasta 10 profesionales',
            'Hasta 200 pacientes',
            'Soporte prioritario',
            'Reportes avanzados',
            'Integraciones básicas'
          ],
          limites: {
            profesionales: 10,
            pacientes: 200,
            turnosPorMes: 1000,
            almacenamiento: '2GB',
            notificaciones: true,
            reportes: true,
            integraciones: true
          }
        },
        enterprise: {
          id: 'enterprise',
          nombre: 'enterprise',
          descripcion: 'Plan empresarial para clínicas grandes',
          precio: 199.99,
          moneda: 'USD',
          periodo: 'monthly',
          caracteristicas: [
            'Profesionales ilimitados',
            'Pacientes ilimitados',
            'Soporte 24/7',
            'Reportes personalizados',
            'Integraciones avanzadas',
            'API personalizada'
          ],
          limites: {
            profesionales: -1, // ilimitado
            pacientes: -1, // ilimitado
            turnosPorMes: -1, // ilimitado
            almacenamiento: '10GB',
            notificaciones: true,
            reportes: true,
            integraciones: true
          }
        }
      };

      const planActual = planes[clinica.estadoPago === 'pagado' ? 'professional' : 'basic'] || planes.basic;

      return {
        success: true,
        plan: {
          ...planActual,
          estado: clinica.estadoPago === 'pagado' ? 'activo' : 'pendiente',
          fechaInicio: clinica.fechaCreacion,
          fechaVencimiento: clinica.proximoPago,
          proximoPago: clinica.proximoPago,
          historial: [
            {
              plan: planActual.nombre,
              fecha: clinica.fechaCreacion,
              accion: 'activacion'
            }
          ]
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener plan de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getTurnos(clinicaUrl: string, filters: any) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Construir filtros
      const where: any = {
        clinicaId: clinica.id,
      };

      if (filters.fecha) {
        where.fecha = {
          gte: new Date(filters.fecha),
          lt: new Date(new Date(filters.fecha).getTime() + 24 * 60 * 60 * 1000),
        };
      }

      if (filters.estado) {
        where.estado = filters.estado;
      }

      if (filters.doctor) {
        where.doctor = { contains: filters.doctor, mode: 'insensitive' };
      }



      // Paginación
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Obtener turnos
      const [turnos, total] = await Promise.all([
        this.prisma.turno.findMany({
          where,
          orderBy: { fecha: 'asc' },
          skip,
          take: limit,
        }),
        this.prisma.turno.count({ where }),
      ]);

      return {
        success: true,
        turnos: turnos.map(turno => ({
          id: turno.id,
          paciente: turno.paciente,
          email: turno.email,
          telefono: turno.telefono,
          doctor: turno.doctor,
          fecha: turno.fecha.toISOString().split('T')[0],
          hora: turno.hora,
          duracionMin: turno.duracionMin,
          estado: turno.estado,
          motivo: turno.motivo,
          notas: turno.notas,
          servicio: turno.servicio,
          professionalId: turno.professionalId,
          clinicaId: turno.clinicaId,
          montoTotal: turno.montoTotal,
          estadoPago: turno.estadoPago,
          medioPago: turno.medioPago,
          origen: turno.origen,
          ate: turno.ate,
          sucursal: turno.sucursal,
          createdAt: turno.createdAt,
          updatedAt: turno.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener turnos:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }



  async getNotificaciones(clinicaUrl: string, filters: any) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Construir filtros
      const where: any = {
        clinicaId: clinica.id,
      };

      if (filters.leida !== undefined) {
        where.leida = filters.leida;
      }

      if (filters.categoria) {
        where.tipo = filters.categoria;
      }

      if (filters.usuarioId) {
        where.destinatarioId = filters.usuarioId;
      }

      // Paginación
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Obtener notificaciones
      const [notificaciones, total] = await Promise.all([
        this.prisma.notificacion.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.notificacion.count({ where }),
      ]);

      // Obtener estadísticas
      const [totalNotificaciones, noLeidas] = await Promise.all([
        this.prisma.notificacion.count({ where: { clinicaId: clinica.id } }),
        this.prisma.notificacion.count({ 
          where: { clinicaId: clinica.id, leida: false } 
        }),
      ]);

      // Obtener estadísticas por categoría
      const statsPorCategoria = await this.prisma.notificacion.groupBy({
        by: ['tipo'],
        where: { clinicaId: clinica.id },
        _count: { tipo: true },
      });

      const porCategoria = {};
      statsPorCategoria.forEach(stat => {
        porCategoria[stat.tipo] = stat._count.tipo;
      });

      return {
        success: true,
        notificaciones: notificaciones.map(notif => ({
          id: notif.id,
          clinicaId: notif.clinicaId,
          usuarioId: notif.destinatarioId,
          titulo: notif.titulo,
          mensaje: notif.mensaje,
          categoria: notif.tipo,
          leida: notif.leida,
          datos: {}, // Por ahora vacío, se puede expandir
          createdAt: notif.createdAt,
          updatedAt: notif.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total: totalNotificaciones,
          noLeidas,
          porCategoria,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener notificaciones:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async createNotificacion(clinicaUrl: string, dto: any) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Validaciones
      if (!dto.titulo || dto.titulo.length > 255) {
        throw new BadRequestException('Título es requerido y debe tener máximo 255 caracteres');
      }

      if (!dto.mensaje || dto.mensaje.length > 1000) {
        throw new BadRequestException('Mensaje es requerido y debe tener máximo 1000 caracteres');
      }

      const categoriasValidas = ['turno', 'recordatorio', 'sistema', 'pago', 'emergencia'];
      if (!dto.categoria || !categoriasValidas.includes(dto.categoria)) {
        throw new BadRequestException('Categoría inválida');
      }

      // Verificar usuario si se especifica
      if (dto.usuarioId) {
        const usuario = await this.prisma.user.findUnique({
          where: { id: dto.usuarioId },
        });
        if (!usuario) {
          throw new BadRequestException('Usuario especificado no encontrado');
        }
      }

      // Crear notificación
      const notificacion = await this.prisma.notificacion.create({
        data: {
          titulo: dto.titulo,
          mensaje: dto.mensaje,
          tipo: dto.categoria,
          clinicaId: clinica.id,
          destinatarioId: dto.usuarioId,
        },
      });

      return {
        success: true,
        message: 'Notificación creada exitosamente',
        notificacion: {
          id: notificacion.id,
          clinicaId: notificacion.clinicaId,
          usuarioId: notificacion.destinatarioId,
          titulo: notificacion.titulo,
          mensaje: notificacion.mensaje,
          categoria: notificacion.tipo,
          leida: notificacion.leida,
          datos: {},
          createdAt: notificacion.createdAt,
          updatedAt: notificacion.updatedAt,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al crear notificación:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getVentas(clinicaUrl: string, filters: any) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Construir filtros
      const where: any = {
        clinicaId: clinica.id,
      };

      if (filters.fecha) {
        where.fecha = {
          gte: new Date(filters.fecha),
          lt: new Date(new Date(filters.fecha).getTime() + 24 * 60 * 60 * 1000),
        };
      }

      if (filters.estado) {
        where.estado = filters.estado;
      }

      if (filters.doctor) {
        where.doctor = { contains: filters.doctor, mode: 'insensitive' };
      }



      // Paginación
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Obtener turnos con información completa
      const [turnos, total] = await Promise.all([
        this.prisma.turno.findMany({
          where,
          orderBy: { fecha: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.turno.count({ where }),
      ]);

      // Calcular estadísticas básicas
      const totalIngresos = turnos.reduce((sum, turno) => {
        const monto = parseFloat(turno.montoTotal || '0');
        return sum + monto;
      }, 0);

      const turnosPagados = turnos.filter(turno => turno.estadoPago === 'pagado').length;
      const turnosPendientes = turnos.filter(turno => turno.estadoPago === 'pendiente').length;

      return {
        success: true,
        ventas: turnos.map(turno => ({
          id: turno.id,
          paciente: turno.paciente,
          email: turno.email,
          telefono: turno.telefono,
          doctor: turno.doctor,
          fecha: turno.fecha.toISOString().split('T')[0],
          hora: turno.hora,
          duracionMin: turno.duracionMin,
          estado: turno.estado,
          motivo: turno.motivo,
          notas: turno.notas,
          servicio: turno.servicio,
          professionalId: turno.professionalId,
          clinicaId: turno.clinicaId,
          montoTotal: turno.montoTotal,
          estadoPago: turno.estadoPago,
          medioPago: turno.medioPago,
          origen: turno.origen,
          ate: turno.ate,
          sucursal: turno.sucursal,
          createdAt: turno.createdAt,
          updatedAt: turno.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          totalIngresos,
          totalTurnos: total,
          turnosPagados,
          turnosPendientes,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener ventas:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
