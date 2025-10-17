import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateClinicaDto } from '../owners/dto/create-clinica.dto';
import { CreateUsuarioClinicaDto } from './dto/create-usuario-clinica.dto';
import { UpdateUsuarioEstadoDto } from './dto/update-usuario-estado.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { GetTurnosFiltersDto } from './dto/get-turnos-filters.dto';
import { GetUsuariosFiltersDto } from './dto/get-usuarios-filters.dto';
import { UpdateTurnoEstadoDto } from './dto/update-turno-estado.dto';
import { UpdateClinicaConfiguracionDto } from './dto/update-clinica-configuracion.dto';
import { UpdateClinicaLanguageDto } from './dto/update-clinica-language.dto';
import { CreateTurnoLandingDto } from '../public/dto/create-turno-landing.dto';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { UpdateTurnoFechaHoraDto } from './dto/update-turno-fecha-hora.dto';
import { SearchTurnosDto } from './dto/search-turnos.dto';
import { CreatePatientDto } from '../patients/dto/create-patient.dto';
import { EmailService } from '../email/email.service';
import { PasswordGenerator } from '../common/utils/password-generator';
import { AppointmentWebhookService } from '../webhooks/appointment-webhook.service';

@Injectable()
export class ClinicasService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private appointmentWebhookService: AppointmentWebhookService,
  ) {}

  // Función para generar contraseña automática
  private generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Función para generar token de confirmación de turno
  private generateConfirmationToken(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${random}`;
  }

  // Método para confirmar turno manualmente desde el frontend
  async confirmarTurnoManual(clinicaUrl: string, turnoId: string) {
    try {
      // Buscar la clínica
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar y actualizar el turno
      const turno = await this.prisma.turno.findFirst({
        where: {
          id: turnoId,
          clinicaId: clinica.id,
        },
      });

      if (!turno) {
        throw new BadRequestException('Turno no encontrado');
      }

      // Actualizar estado
      const turnoActualizado = await this.prisma.turno.update({
        where: { id: turnoId },
        data: { estado: 'confirmado' },
      });

      // Enviar email al paciente
      try {
        const emailData = {
          paciente: turno.paciente,
          doctor: turno.doctor,
          fecha: turno.fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          hora: turno.hora,
          motivo: turno.motivo || 'Consulta médica',
          clinica: clinica.name,
          telefonoClinica: clinica.phone,
          emailClinica: clinica.email,
        };

        await this.emailService.sendEmail({
          to: turno.email,
          subject: `Cita confirmada - ${clinica.name}`,
          template: 'turno-confirmation',
          data: emailData
        });

        console.log('✅ Email de confirmación enviado al paciente');
      } catch (emailError) {
        console.error('❌ Error enviando email:', emailError);
        // No fallar la operación si el email falla
      }

      return {
        success: true,
        turno: turnoActualizado,
        message: 'Turno confirmado exitosamente. Se ha enviado un email al paciente.',
      };
    } catch (error) {
      console.error('Error confirmando turno manualmente:', error);
      throw error;
    }
  }

  // Método para cancelar turno manualmente desde el frontend
  async cancelarTurnoManual(clinicaUrl: string, turnoId: string) {
    try {
      // Buscar la clínica
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar y actualizar el turno
      const turno = await this.prisma.turno.findFirst({
        where: {
          id: turnoId,
          clinicaId: clinica.id,
        },
      });

      if (!turno) {
        throw new BadRequestException('Turno no encontrado');
      }

      // Actualizar estado
      const turnoActualizado = await this.prisma.turno.update({
        where: { id: turnoId },
        data: { estado: 'cancelado' },
      });

      // Enviar email al paciente
      try {
        const emailData = {
          paciente: turno.paciente,
          doctor: turno.doctor,
          fecha: turno.fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          hora: turno.hora,
          clinica: clinica.name,
          telefonoClinica: clinica.phone,
          emailClinica: clinica.email,
        };

        await this.emailService.sendEmail({
          to: turno.email,
          subject: `Cita cancelada - ${clinica.name}`,
          template: 'turno-cancelado',
          data: emailData
        });

        console.log('✅ Email de cancelación enviado al paciente');
      } catch (emailError) {
        console.error('❌ Error enviando email:', emailError);
        // No fallar la operación si el email falla
      }

      return {
        success: true,
        turno: turnoActualizado,
        message: 'Turno cancelado exitosamente. Se ha enviado un email al paciente.',
      };
    } catch (error) {
      console.error('Error cancelando turno manualmente:', error);
      throw error;
    }
  }

  async getClinicaByUserId(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true
            }
          }
        }
      });

      return user?.clinica || null;
    } catch (error) {
      console.error('Error al obtener clínica del usuario:', error);
      return null;
    }
  }

  async getUsuariosByClinicaUrl(
    clinicaUrl: string,
    filters: GetUsuariosFiltersDto = {},
  ) {
    try {
      console.log('🔍 getUsuariosByClinicaUrl - Iniciando con:', { clinicaUrl, filters });
      
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      console.log('🔍 Clínica encontrada:', clinica ? { id: clinica.id, name: clinica.name } : 'No encontrada');

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

      console.log('🔍 Construyendo consulta con where:', where);
      console.log('🔍 OrderBy:', orderBy);
      console.log('🔍 Paginación:', { page, limit, skip });

      // Obtener usuarios con paginación
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            estado: true,
            permisos: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      console.log('🔍 Usuarios encontrados:', users.length);
      console.log('🔍 Total usuarios:', total);

      // Mapear usuarios a formato de respuesta
      const usuariosFormateados = users.map((user) => {
        return {
          id: user.id,
          nombre: user.name || 'Sin nombre',
          email: user.email,
          telefono: user.phone || null,
          rol: user.role.toLowerCase(),
          estado: user.estado || 'activo',
          permisos: user.permisos || null,
          fechaCreacion: user.createdAt.toISOString().split('T')[0],
          ultimoAcceso: user.updatedAt.toISOString().split('T')[0],
        };
      });

      return {
        success: true,
        message: "Usuarios de la clínica obtenidos exitosamente",
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

      // La verificación de email duplicado se maneja más abajo en la lógica

      // Mapear el rol del DTO al enum de Prisma
      let role: any;
      const rolInput = dto.rol || dto.tipo; // Aceptar tanto 'rol' como 'tipo'
      
      switch (rolInput?.toLowerCase()) {
        case 'profesional':
        case 'professional':
          role = 'PROFESSIONAL';
          break;
        case 'secretario':
        case 'secretary':
          role = 'SECRETARY';
          break;
        case 'administrador':
        case 'admin':
          role = 'ADMIN';
          break;
        default:
          console.error('Rol inválido recibido:', rolInput);
          throw new BadRequestException(`Rol inválido: "${rolInput}". Roles válidos: profesional, secretario, administrador`);
      }

      // SIEMPRE generar contraseña automáticamente
      const password = this.generatePassword();
      
      // Generar username automáticamente
      const username = PasswordGenerator.generateUsername(dto.nombre);
      
      // Generar email automáticamente si no se proporciona o si ya existe
      let emailToUse = dto.email;
      if (!dto.email || dto.email.trim() === '') {
        emailToUse = PasswordGenerator.generateEmail(dto.nombre, clinica.name);
        console.log(`📧 Email generado automáticamente: ${emailToUse}`);
      } else {
        // Verificar si el email ya existe
        const existingUser = await this.prisma.user.findFirst({
          where: { 
            email: dto.email,
            clinicaId: clinica.id
          },
        });

        if (existingUser) {
          // Si el email ya existe, generar uno automático
          emailToUse = PasswordGenerator.generateEmail(dto.nombre, clinica.name);
          console.log(`📧 Email ${dto.email} ya existe, generando automático: ${emailToUse}`);
        }
      }
      
      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Permisos: usar los del frontend o por defecto si no se envían
      const permisosUsuario = dto.permisos || {
        gestionarTurnos: false,
        gestionarPacientes: false,
        gestionarUsuarios: false,
        gestionarProfesionales: false,
        gestionarVentas: false,
        gestionarReportes: false,
        gestionarEspecialidades: false,
        gestionarTratamientos: false,
        gestionarSucursales: false,
        gestionarMensajeria: false,
        gestionarIA: false,
        gestionarFichasMedicas: false,
      };

      console.log('🔍 Permisos del usuario a crear:', permisosUsuario);

      // Crear el usuario
      const usuario = await this.prisma.user.create({
        data: {
          name: dto.nombre,
          email: emailToUse,
          username: username,
          password: hashedPassword,
          role: role,
          clinicaId: clinica.id,
          permisos: permisosUsuario as any, // Cast para compatibilidad con Prisma
        },
      });

      // SIEMPRE enviar email de bienvenida con credenciales
      try {
        console.log(`📧 Intentando enviar email de bienvenida a ${emailToUse}...`);
        console.log(`📧 Datos del email:`, {
          email: emailToUse,
          username: username,
          password: password,
          userName: dto.nombre,
          role: role, // Usar el rol mapeado, no el del DTO
          clinicaName: clinica.name
        });
        
        // Usar la misma lógica que funciona en turnos - llamar directamente a sendEmail
        const emailResult = await this.emailService.sendEmail({
          to: emailToUse,
          subject: `Bienvenido/a a ${clinica.name} - Tus credenciales de acceso`,
          template: 'welcome-credentials',
          data: { 
            email: emailToUse, 
            username: username,
            password: password, 
            userName: dto.nombre, 
            role: role, // Usar el rol mapeado, no el del DTO
            clinicaName: clinica.name 
          },
        });
        
        if (emailResult.success) {
          console.log(`✅ Email de bienvenida enviado exitosamente a ${emailToUse} con username: ${username} y contraseña: ${password}`);
          console.log(`✅ MessageId: ${emailResult.messageId}`);
        } else {
          console.error(`❌ Falló el envío de email a ${emailToUse} - error: ${emailResult.error}`);
        }
      } catch (emailError) {
        console.error('❌ Error al enviar email de bienvenida:', emailError);
        console.error('❌ Stack trace:', emailError.stack);
        // No lanzamos error para no interrumpir la creación del usuario
      }

      return {
        success: true,
        usuario: {
          id: usuario.id,
          nombre: usuario.name,
          email: usuario.email,
          username: usuario.username,
          rol: dto.rol,
          especialidad: dto.especialidad || null,
          estado: 'activo',
          permisos: usuario.permisos, // Incluir permisos en la respuesta
          fechaCreacion: usuario.createdAt.toISOString().split('T')[0],
          ultimoAcceso: usuario.updatedAt.toISOString().split('T')[0],
          turnos: 0,
          pacientes: 0,
        },
        emailGenerado: emailToUse !== dto.email,
        emailOriginal: dto.email,
        emailFinal: emailToUse,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al crear usuario de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async deleteUsuario(clinicaUrl: string, userId: string) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar el usuario
      const usuario = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          professional: true,
        },
      });

      if (!usuario) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Verificar que el usuario pertenece a la clínica
      if (usuario.clinicaId !== clinica.id) {
        throw new BadRequestException('El usuario no pertenece a esta clínica');
      }

      // Eliminar datos relacionados según el rol
      if (usuario.role === 'PROFESSIONAL' && usuario.professional) {
        // Eliminar especialidades del profesional
        await this.prisma.professionalEspecialidad.deleteMany({
          where: { professionalId: usuario.professional.id },
        });

        // Eliminar tratamientos del profesional
        await this.prisma.professionalTratamiento.deleteMany({
          where: { professionalId: usuario.professional.id },
        });

        // Eliminar agendas del profesional
        await this.prisma.agenda.deleteMany({
          where: { professionalId: usuario.professional.id },
        });

        // Eliminar el profesional
        await this.prisma.professional.delete({
          where: { id: usuario.professional.id },
        });
      }

      // Ya no hay usuarios con rol PATIENT, esta lógica se eliminó

      // Eliminar turnos relacionados
      // await this.prisma.turno.deleteMany({
      //   where: { userId: userId },
      // });

      // Finalmente, eliminar el usuario
      await this.prisma.user.delete({
        where: { id: userId },
      });

      return {
        success: true,
        message: 'Usuario eliminado exitosamente',
        deletedUser: {
          id: usuario.id,
          name: usuario.name,
          email: usuario.email,
          role: usuario.role,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al eliminar usuario:', error);
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

  async getUsuarioPermisos(clinicaUrl: string, userId: string) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar el usuario
      const usuario = await this.prisma.user.findFirst({
        where: {
          id: userId,
          clinicaId: clinica.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permisos: true,
        },
      });

      if (!usuario) {
        throw new BadRequestException('Usuario no encontrado en esta clínica');
      }

      return {
        success: true,
        usuario: {
          id: usuario.id,
          nombre: usuario.name,
          email: usuario.email,
          rol: usuario.role,
        },
        permisos: usuario.permisos || {
          gestionarTurnos: false,
          gestionarPacientes: false,
          gestionarUsuarios: false,
          gestionarProfesionales: false,
          gestionarVentas: false,
          gestionarReportes: false,
          gestionarEspecialidades: false,
          gestionarTratamientos: false,
          gestionarSucursales: false,
          gestionarMensajeria: false,
          gestionarIA: false,
          gestionarFichasMedicas: false,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener permisos del usuario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async updateUsuario(
    clinicaUrl: string,
    userId: string,
    dto: UpdateUsuarioDto,
  ) {
    try {
      console.log('🔍 updateUsuario - Service iniciando');
      console.log('🔍 clinicaUrl:', clinicaUrl);
      console.log('🔍 userId:', userId);
      console.log('🔍 dto:', dto);

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

      // Solo actualizar permisos
      const updateData: any = {};

      if (dto.permisos) {
        // Los permisos se almacenan directamente en el campo permisos (tipo Json)
        updateData.permisos = dto.permisos as any; // Cast para compatibilidad con Prisma
      } else {
        throw new BadRequestException('Los permisos son requeridos para la actualización');
      }

      console.log('🔍 Datos a actualizar:', updateData);

      // Actualizar el usuario
      const usuarioActualizado = await this.prisma.user.update({
        where: { id: userId },
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

      console.log('🔍 Usuario actualizado:', usuarioActualizado);

      return {
        success: true,
        message: 'Permisos actualizados exitosamente',
        permisos: usuarioActualizado.permisos,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al actualizar usuario:', error);
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
                  },
                  especialidades: {
                    include: {
                      especialidad: true
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
              specialties: turno.professional.especialidades?.map(pe => pe.especialidad.name) || [],
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
              },
              especialidades: {
                include: {
                  especialidad: true
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
            specialties: turno.professional.especialidades?.map(pe => pe.especialidad.name) || [],
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
        // defaultLanguage: clinica.defaultLanguage || 'es',
        currencyCode: clinica.currencyCode || 'USD',
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
        defaultLanguage: clinica.defaultLanguage,
        currencyCode: clinica.currencyCode,
        contacto: clinica.contacto ? JSON.parse(clinica.contacto) : {},
        pixel_id: clinica.pixel_id,
        gtm_id: clinica.gtm_id,
        ga_id: clinica.ga_id,
        video_url: clinica.video_url,
        testimonials: clinica.testimonials || [],
        consentimiento_informado: clinica.consentimiento_informado,
        showTreatments: clinica.showTreatments,
        showTestimonials: clinica.showTestimonials,
        showProfessionals: clinica.showProfessionals,
        showSchedule: clinica.showSchedule,
        showSpecialties: clinica.showSpecialties,
        showGallery: clinica.showGallery,
        showVideo: clinica.showVideo,
        showContactForm: clinica.showContactForm,
        showLocation: clinica.showLocation,
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

  async updateClinicaConfiguracionById(
    clinicaId: string,
    dto: UpdateClinicaConfiguracionDto,
  ) {
    try {
      // Buscar la clínica por ID
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: clinicaId },
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

      if (dto.titulo !== undefined) {
        updateData.titulo = dto.titulo;
      }

      if (dto.subtitulo !== undefined) {
        updateData.subtitulo = dto.subtitulo;
      }

      if (dto.comentariosHTML !== undefined || (dto as any).html !== undefined) {
        updateData.comentariosHTML = dto.comentariosHTML || (dto as any).html;
      }

      if (dto.defaultLanguage) {
        updateData.defaultLanguage = dto.defaultLanguage;
      }

      if (dto.currencyCode) {
        updateData.currencyCode = dto.currencyCode;
      }

      if (dto.contacto) {
        const contactoActual = clinica.contacto
          ? JSON.parse(clinica.contacto)
          : {};
        const contactoActualizado = { ...contactoActual, ...dto.contacto };
        updateData.contacto = JSON.stringify(contactoActualizado);
      }

      if (dto.pixel_id !== undefined) {
        updateData.pixel_id = dto.pixel_id;
      }

      if (dto.gtm_id !== undefined) {
        updateData.gtm_id = dto.gtm_id;
      }

      if (dto.ga_id !== undefined) {
        updateData.ga_id = dto.ga_id;
      }

      if (dto.video_url !== undefined) {
        updateData.video_url = dto.video_url;
      }

      if (dto.testimonials !== undefined) {
        updateData.testimonials = dto.testimonials;
      }

      if (dto.consentimiento_informado !== undefined) {
        updateData.consentimiento_informado = dto.consentimiento_informado;
      }

      // Toggles para mostrar/ocultar secciones
      if (dto.showTreatments !== undefined) {
        updateData.showTreatments = dto.showTreatments;
      }

      if (dto.showTestimonials !== undefined) {
        updateData.showTestimonials = dto.showTestimonials;
      }

      if (dto.showProfessionals !== undefined) {
        updateData.showProfessionals = dto.showProfessionals;
      }

      if (dto.showSchedule !== undefined) {
        updateData.showSchedule = dto.showSchedule;
      }

      if (dto.showSpecialties !== undefined) {
        updateData.showSpecialties = dto.showSpecialties;
      }

      if (dto.showGallery !== undefined) {
        updateData.showGallery = dto.showGallery;
      }

      if (dto.showVideo !== undefined) {
        updateData.showVideo = dto.showVideo;
      }

      if (dto.showContactForm !== undefined) {
        updateData.showContactForm = dto.showContactForm;
      }

      if (dto.showLocation !== undefined) {
        updateData.showLocation = dto.showLocation;
      }

      // Actualizar la clínica por ID
      const clinicaActualizada = await this.prisma.clinica.update({
        where: { id: clinicaId },
        data: updateData,
      });

      return {
        success: true,
        message: 'Configuración de clínica actualizada exitosamente',
        data: clinicaActualizada,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al actualizar configuración de clínica:', error);
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

      if (dto.titulo !== undefined) {
        updateData.titulo = dto.titulo;
      }

      if (dto.subtitulo !== undefined) {
        updateData.subtitulo = dto.subtitulo;
      }

      // Aceptar tanto 'comentariosHTML' como 'html' (alias)
      if (dto.comentariosHTML !== undefined || (dto as any).html !== undefined) {
        updateData.comentariosHTML = dto.comentariosHTML || (dto as any).html;
      }

      if (dto.defaultLanguage) {
        updateData.defaultLanguage = dto.defaultLanguage;
      }

      if (dto.currencyCode) {
        updateData.currencyCode = dto.currencyCode;
      }

      if (dto.contacto) {
        // Obtener el contacto actual y actualizarlo
        const contactoActual = clinica.contacto
          ? JSON.parse(clinica.contacto)
          : {};
        const contactoActualizado = { ...contactoActual, ...dto.contacto };
        updateData.contacto = JSON.stringify(contactoActualizado);
      }

      if (dto.pixel_id !== undefined) {
        updateData.pixel_id = dto.pixel_id;
      }

      if (dto.gtm_id !== undefined) {
        updateData.gtm_id = dto.gtm_id;
      }

      if (dto.ga_id !== undefined) {
        updateData.ga_id = dto.ga_id;
      }

      if (dto.video_url !== undefined) {
        updateData.video_url = dto.video_url;
      }

      if (dto.testimonials !== undefined) {
        updateData.testimonials = dto.testimonials;
      }

      if (dto.consentimiento_informado !== undefined) {
        updateData.consentimiento_informado = dto.consentimiento_informado;
      }

      // Toggles para mostrar/ocultar secciones
      if (dto.showTreatments !== undefined) {
        updateData.showTreatments = dto.showTreatments;
      }

      if (dto.showTestimonials !== undefined) {
        updateData.showTestimonials = dto.showTestimonials;
      }

      if (dto.showProfessionals !== undefined) {
        updateData.showProfessionals = dto.showProfessionals;
      }

      if (dto.showSchedule !== undefined) {
        updateData.showSchedule = dto.showSchedule;
      }

      if (dto.showSpecialties !== undefined) {
        updateData.showSpecialties = dto.showSpecialties;
      }

      if (dto.showGallery !== undefined) {
        updateData.showGallery = dto.showGallery;
      }

      if (dto.showVideo !== undefined) {
        updateData.showVideo = dto.showVideo;
      }

      if (dto.showContactForm !== undefined) {
        updateData.showContactForm = dto.showContactForm;
      }

      if (dto.showLocation !== undefined) {
        updateData.showLocation = dto.showLocation;
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

      // Obtener tratamientos que se muestran en el landing
      const tratamientosLanding = await this.prisma.tratamiento.findMany({
        where: {
          clinicaId: clinica.id,
          estado: 'activo',
          showInLanding: true,
        },
        include: {
          profesionales: {
            include: {
              professional: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
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
        titulo: clinica.titulo,
        subtitulo: clinica.subtitulo,
        comentariosHTML: clinica.comentariosHTML,
        direccion: clinica.address,
        telefono: clinica.phone,
        email: clinica.email,
        defaultLanguage: clinica.defaultLanguage,
        currencyCode: clinica.currencyCode,
        horarios: clinica.horarios,
        especialidades: clinica.especialidades,
        rating: clinica.rating,
        stats: clinica.stats ? JSON.parse(clinica.stats) : {},
        pixel_id: clinica.pixel_id,
        gtm_id: clinica.gtm_id,
        ga_id: clinica.ga_id,
        video_url: clinica.video_url,
        testimonials: clinica.testimonials || [],
        consentimiento_informado: clinica.consentimiento_informado,
        showTreatments: clinica.showTreatments,
        showTestimonials: clinica.showTestimonials,
        showProfessionals: clinica.showProfessionals,
        showSchedule: clinica.showSchedule,
        showSpecialties: clinica.showSpecialties,
        showGallery: clinica.showGallery,
        showVideo: clinica.showVideo,
        showContactForm: clinica.showContactForm,
        showLocation: clinica.showLocation,
      };

      const turnosFormateados = turnosDisponibles.map((turno) => ({
        fecha: turno.fecha.toISOString().split('T')[0],
        hora: turno.hora,
        doctor: turno.doctor,
      }));

      const tratamientosFormateados = tratamientosLanding.map((tratamiento) => ({
        id: tratamiento.id,
        name: tratamiento.name,
        descripcion: tratamiento.descripcion,
        duracionPorSesion: tratamiento.duracionPorSesion,
        cantidadSesiones: tratamiento.cantidadSesiones,
        precio: tratamiento.precio,
        allowSobreturno: tratamiento.allowSobreturno,
        allowVideocall: tratamiento.allowVideocall,
        profesionales: tratamiento.profesionales.map((pt) => ({
          id: pt.professional.id,
          name: pt.professional.name,
          precio: pt.precio,
          duracionMin: pt.duracionMin,
          user: pt.professional.user,
        })),
      }));

      return {
        success: true,
        clinica: clinicaFormateada,
        turnosDisponibles: turnosFormateados,
        tratamientos: tratamientosFormateados,
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

      // NOTA: Se permite crear múltiples turnos en el mismo horario para el mismo doctor
      // Esta funcionalidad permite que un profesional pueda tener varias citas simultáneas
      console.log('✅ Permitir múltiples turnos en mismo horario para:', {
        doctor: dto.doctor,
        fecha: fechaTurno,
        hora: dto.hora
      });

      // Generar token único de confirmación
      const confirmationToken = this.generateConfirmationToken();

      // Crear el turno
      const turnoCreado = await this.prisma.turno.create({
        data: {
          paciente: dto.nombre,
          email: dto.email,
          telefono: dto.telefono,
          doctor: dto.doctor,
          fecha: fechaTurno,
          hora: dto.hora,
          estado: 'pendiente', // Estado inicial pendiente para que confirme desde email
          motivo: dto.motivo || 'Consulta',
          servicio: dto.tratamiento,
          sucursal: dto.sucursal,
          clinicaId: clinica.id,
          confirmationToken: confirmationToken,
          isVideocall: dto.isVideocall,
        },
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

      // Enviar email de confirmación al paciente
      try {
        const emailData = {
          paciente: turnoCreado.paciente,
          doctor: turnoCreado.doctor,
          fecha: turnoCreado.fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          hora: turnoCreado.hora,
          motivo: turnoCreado.motivo || 'Consulta médica',
          clinica: turnoCreado.clinica.name,
          telefonoClinica: turnoCreado.clinica.phone,
          emailClinica: turnoCreado.clinica.email,
          confirmationToken: turnoCreado.confirmationToken,
        };

        const emailResult = await this.emailService.sendEmail({
          to: turnoCreado.email,
          subject: `Confirma tu cita - ${turnoCreado.clinica.name}`,
          template: 'appointment-confirmation',
          data: emailData
        });

        if (emailResult.success) {
          console.log(`✅ Email de confirmación enviado a ${turnoCreado.email}`);
        } else {
          console.error(`❌ Error enviando email de confirmación: ${emailResult.error}`);
        }
      } catch (emailError) {
        console.error('❌ Error en envío de email de confirmación:', emailError);
        // No lanzar error para no afectar la creación del turno
      }

      // Enviar webhook de cita creada
      try {
        await this.appointmentWebhookService.sendAppointmentCreatedWebhook(
          turnoCreado,
          clinica.id,
        );
      } catch (webhookError) {
        console.error('❌ Error enviando webhook:', webhookError);
        // No lanzar error para no afectar la creación del turno
      }

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
          tratamiento: turnoCreado.servicio,
          sucursal: turnoCreado.sucursal,
        },
        mensaje: `Turno creado para ${fechaFormateada} a las ${dto.hora} con ${dto.doctor}. Por favor revisa tu email para confirmar la cita.`,
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
              },
              especialidades: {
                include: {
                  especialidad: true
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

      // Procesar datos de pago
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
          specialties: turno.professional.especialidades?.map(pe => pe.especialidad.name) || [],
          user: turno.professional.user,
        } : null,
        clinicaId: turno.clinicaId,
        createdAt: turno.createdAt,
        updatedAt: turno.updatedAt,
        // Datos de pago procesados
        montoTotal,
        montoAbonado,
        montoPendiente,
        estadoPago,
        medioPago: turno.medioPago,
        porcentajePagado: montoTotal > 0 ? Math.round((montoAbonado / montoTotal) * 100) : 0,
        porcentajePendiente: montoTotal > 0 ? Math.round((montoPendiente / montoTotal) * 100) : 0,
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

      // Generar token único de confirmación
      const confirmationToken = this.generateConfirmationToken();

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
        estado: 'pendiente', // Estado inicial siempre pendiente
        confirmationToken: confirmationToken, // Token para confirmar/cancelar desde email
        // Nuevos campos para datos de pago
        montoTotal: dto.montoTotal,
        estadoPago: dto.estadoPago || 'pendiente',
        medioPago: dto.medioPago,
        // Campos para pagos parciales
        montoAbonado: dto.montoAbonado,
        montoPendiente: dto.montoPendiente,
        // Nuevos campos adicionales
        origen: dto.origen,
        ate: dto.ate,
        isVideocall: dto.isVideocall,
        sucursal: dto.sucursal,
        updatedAt: new Date(),
      };

      console.log('Datos del turno a crear:', JSON.stringify(turnoData, null, 2));

      // Verificar si ya existe un paciente con ese email
      const pacienteExistente = await this.prisma.patient.findFirst({
        where: {
          email: dto.email,
          clinicaId: clinica.id,
        },
        include: {
          clinica: {
            select: {
              name: true,
              url: true,
            },
          },
        },
      });

      if (pacienteExistente) {
        console.log('✅ Paciente ya existe, solo se creará el turno:', dto.email);
        console.log('Paciente existente:', {
          id: pacienteExistente.id,
          name: pacienteExistente.name,
          email: pacienteExistente.email,
          clinica: pacienteExistente.clinica?.name || 'Sin clínica',
        });
      } else {
        console.log('🆕 Paciente no existe, se creará paciente + turno para:', dto.email);
        
        // Crear paciente automáticamente ya que no existe (SOLO PACIENTE, NO USUARIO)
        try {
          const paciente = await this.prisma.patient.create({
            data: {
              name: dto.paciente,
              email: dto.email,
              phone: dto.telefono,
              clinicaId: clinica.id,
            },
          });

          console.log('✅ Paciente creado automáticamente:', { pacienteId: paciente.id });
        } catch (error) {
          console.error('❌ Error al crear paciente automáticamente:', error);
          // Si falla la creación del paciente, lanzar error
          throw new BadRequestException(`Error al crear el paciente: ${error.message}`);
        }
      }

      const turno = await this.prisma.turno.create({
        data: turnoData,
      });

      console.log('Turno creado exitosamente:', turno.id);

      // Obtener datos de la clínica para el email y webhook
      const clinicaData = await this.prisma.clinica.findUnique({
        where: { id: clinica.id },
        select: {
          name: true,
          phone: true,
          email: true,
          address: true
        }
      });

      // Enviar email de confirmación automáticamente
      try {
        console.log('📧 Enviando email de confirmación de turno...');

        const emailData = {
          paciente: turno.paciente,
          doctor: turno.doctor,
          fecha: turno.fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          hora: turno.hora,
          motivo: turno.motivo || 'Consulta médica',
          clinica: clinicaData?.name || 'Clínica',
          telefonoClinica: clinicaData?.phone || '',
          emailClinica: clinicaData?.email || '',
          confirmationToken: turno.confirmationToken, // Token para confirmar/cancelar
        };

        console.log('📧 Datos para el email:', emailData);

        const emailResult = await this.emailService.sendEmail({
          to: turno.email,
          subject: `Confirma tu cita - ${clinicaData?.name || 'Clínica'}`,
          template: 'appointment-confirmation',
          data: emailData
        });

        if (emailResult.success) {
          console.log('✅ Email de confirmación enviado exitosamente');
        } else {
          console.error('❌ Error enviando email de confirmación:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Error en envío de email de confirmación:', emailError);
        // No lanzar error para no afectar la creación del turno
      }

      // Enviar webhook de cita creada
      try {
        console.log('🔔 Enviando webhook de cita creada...');
        await this.appointmentWebhookService.sendAppointmentCreatedWebhook(
          { ...turno, clinica: clinicaData },
          clinica.id,
        );
      } catch (webhookError) {
        console.error('❌ Error enviando webhook:', webhookError);
        // No lanzar error para no afectar la creación del turno
      }

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
          // Campos para pagos parciales
          montoAbonado: dto.montoAbonado,
          montoPendiente: dto.montoPendiente,
          // Nuevos campos adicionales
          origen: dto.origen,
          ate: dto.ate,
          sucursal: dto.sucursal,
          isVideocall: dto.isVideocall,
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
          // Campos de pago
          montoTotal: turnoActualizado.montoTotal,
          estadoPago: turnoActualizado.estadoPago,
          medioPago: turnoActualizado.medioPago,
          montoAbonado: turnoActualizado.montoAbonado,
          montoPendiente: turnoActualizado.montoPendiente,
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

  async updateTurnoFechaHora(clinicaUrl: string, turnoId: string, dto: UpdateTurnoFechaHoraDto) {
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

      // Actualizar solo fecha y hora del turno
      const turnoActualizado = await this.prisma.turno.update({
        where: { id: turnoId },
        data: {
          fecha: new Date(dto.fecha),
          hora: dto.hora,
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
          // Campos de pago
          montoTotal: turnoActualizado.montoTotal,
          estadoPago: turnoActualizado.estadoPago,
          medioPago: turnoActualizado.medioPago,
          montoAbonado: turnoActualizado.montoAbonado,
          montoPendiente: turnoActualizado.montoPendiente,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al actualizar fecha y hora del turno:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getTurnosStatsBasic(clinicaUrl: string) {
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
      console.log('=== GET TURNOS SERVICE ===');
      console.log('clinicaUrl:', clinicaUrl);
      console.log('filters:', filters);
      console.log('==========================');
      
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      console.log('Clínica encontrada:', clinica ? { id: clinica.id, name: clinica.name } : 'No encontrada');

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
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const skip = (page - 1) * limit;

      // Obtener turnos
      console.log('Ejecutando consulta a la base de datos...');
      console.log('Where clause:', JSON.stringify(where, null, 2));
      
      const [turnos, total] = await Promise.all([
        this.prisma.turno.findMany({
          where,
          orderBy: { fecha: 'asc' },
          skip,
          take: limit,
        }),
        this.prisma.turno.count({ where }),
      ]);
      
      console.log('Consulta completada. Turnos encontrados:', turnos.length);
      console.log('Total de turnos:', total);

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
          // Datos de pago procesados
          montoTotal,
          montoAbonado,
          montoPendiente,
          estadoPago,
          medioPago: turno.medioPago,
          porcentajePagado: montoTotal > 0 ? Math.round((montoAbonado / montoTotal) * 100) : 0,
          porcentajePendiente: montoTotal > 0 ? Math.round((montoPendiente / montoTotal) * 100) : 0,
          origen: turno.origen,
          ate: turno.ate,
          sucursal: turno.sucursal,
          createdAt: turno.createdAt,
          updatedAt: turno.updatedAt,
        };
      });

      return {
        success: true,
        turnos: turnosProcesados,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('=== ERROR EN GET TURNOS ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('============================');
      
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
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
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
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
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

  async getTurnosStats(clinicaUrl: string, filters: any = {}) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Calcular fechas según el período
      const { fechaInicio, fechaFin } = this.calcularFechasPeriodo(filters.periodo || 'hoy', filters.fechaInicio, filters.fechaFin);

      // Construir filtros base
      const where: any = {
        clinicaId: clinica.id,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      };

      // Aplicar filtros adicionales
      if (filters.estadoPago) {
        where.estadoPago = filters.estadoPago;
      }

      if (filters.profesional) {
        where.doctor = { contains: filters.profesional, mode: 'insensitive' };
      }

      if (filters.sucursal) {
        where.sucursal = filters.sucursal;
      }

      // Obtener todos los turnos del período
      const turnos = await this.prisma.turno.findMany({
        where,
        orderBy: { fecha: 'desc' },
      });

      // Calcular estadísticas
      const stats = this.calcularEstadisticas(turnos);

      return {
        success: true,
        ...stats,
        periodo: {
          inicio: fechaInicio.toISOString().split('T')[0],
          fin: fechaFin.toISOString().split('T')[0],
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

  private calcularFechasPeriodo(periodo: string, fechaInicio?: string, fechaFin?: string) {
    const ahora = new Date();
    let fechaInicioDate: Date;
    let fechaFinDate: Date;

    switch (periodo) {
      case 'hoy':
        fechaInicioDate = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        fechaFinDate = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
        break;
      case 'semana':
        const inicioSemana = new Date(ahora);
        inicioSemana.setDate(ahora.getDate() - ahora.getDay());
        fechaInicioDate = new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate());
        fechaFinDate = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
        break;
      case 'mes':
        fechaInicioDate = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        fechaFinDate = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
        break;
      case 'año':
        fechaInicioDate = new Date(ahora.getFullYear(), 0, 1);
        fechaFinDate = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
        break;
      case 'personalizado':
        if (!fechaInicio || !fechaFin) {
          throw new BadRequestException('Para período personalizado, fechaInicio y fechaFin son requeridos');
        }
        fechaInicioDate = new Date(fechaInicio);
        fechaFinDate = new Date(fechaFin + 'T23:59:59');
        break;
      default:
        fechaInicioDate = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        fechaFinDate = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
    }

    return { fechaInicio: fechaInicioDate, fechaFin: fechaFinDate };
  }

  private calcularEstadisticas(turnos: any[]) {
    // Calcular totales básicos
    const totalVentas = turnos.reduce((sum, turno) => {
      const monto = parseFloat(turno.montoTotal || '0');
      return sum + monto;
    }, 0);

    const totalTurnos = turnos.length;
    const pacientesUnicos = new Set(turnos.map(t => t.email)).size;
    const promedioVentaPorTurno = totalTurnos > 0 ? totalVentas / totalTurnos : 0;

    // Contar por estado de pago
    const turnosPagados = turnos.filter(t => t.estadoPago === 'pagado').length;
    const turnosPendientes = turnos.filter(t => t.estadoPago === 'pendiente').length;
    const turnosParciales = turnos.filter(t => t.estadoPago === 'parcial').length;
    const turnosSinCargo = turnos.filter(t => t.estadoPago === 'sin_cargo').length;

    // Calcular ventas por estado de pago
    const ventasPorEstado = {
      pagado: turnos.filter(t => t.estadoPago === 'pagado').reduce((sum, t) => sum + parseFloat(t.montoTotal || '0'), 0),
      parcial: turnos.filter(t => t.estadoPago === 'parcial').reduce((sum, t) => sum + parseFloat(t.montoTotal || '0'), 0),
      pendiente: turnos.filter(t => t.estadoPago === 'pendiente').reduce((sum, t) => sum + parseFloat(t.montoTotal || '0'), 0),
      sin_cargo: 0,
    };

    // Calcular ventas por medio de pago
    const ventasPorMedioPago = {
      efectivo: turnos.filter(t => t.medioPago === 'efectivo').reduce((sum, t) => sum + parseFloat(t.montoTotal || '0'), 0),
      tarjeta: turnos.filter(t => t.medioPago === 'tarjeta').reduce((sum, t) => sum + parseFloat(t.montoTotal || '0'), 0),
      transferencia: turnos.filter(t => t.medioPago === 'transferencia').reduce((sum, t) => sum + parseFloat(t.montoTotal || '0'), 0),
      mercadopago: turnos.filter(t => t.medioPago === 'mercadopago').reduce((sum, t) => sum + parseFloat(t.montoTotal || '0'), 0),
      paypal: turnos.filter(t => t.medioPago === 'paypal').reduce((sum, t) => sum + parseFloat(t.montoTotal || '0'), 0),
      otro: turnos.filter(t => t.medioPago === 'otro').reduce((sum, t) => sum + parseFloat(t.montoTotal || '0'), 0),
    };

    // Calcular ventas por origen
    const ventasPorOrigen = {
      instagram: turnos.filter(t => t.origen === 'instagram').reduce((sum, t) => sum + parseFloat(t.montoTotal || '0'), 0),
      organico: turnos.filter(t => t.origen === 'organico').reduce((sum, t) => sum + parseFloat(t.montoTotal || '0'), 0),
      'google-ads': turnos.filter(t => t.origen === 'google-ads').reduce((sum, t) => sum + parseFloat(t.montoTotal || '0'), 0),
      whatsapp: turnos.filter(t => t.origen === 'whatsapp').reduce((sum, t) => sum + parseFloat(t.montoTotal || '0'), 0),
    };

    return {
      totalVentas,
      totalTurnos,
      totalPacientes: pacientesUnicos,
      promedioVentaPorTurno,
      turnosPagados,
      turnosPendientes,
      turnosParciales,
      turnosSinCargo,
      ventasPorEstado,
      ventasPorMedioPago,
      ventasPorOrigen,
    };
  }

  async getDashboardVentas(clinicaUrl: string) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      const ahora = new Date();
      const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

      // 1. Turnos de hoy
      const turnosHoy = await this.prisma.turno.count({
        where: {
          clinicaId: clinica.id,
          fecha: {
            gte: hoy,
            lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      // 2. Turnos del mes
      const turnosMes = await this.prisma.turno.count({
        where: {
          clinicaId: clinica.id,
          fecha: {
            gte: inicioMes,
            lt: new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 1),
          },
        },
      });

      // 3. Ventas de hoy (sumar manualmente ya que montoTotal es string)
      const turnosHoyData = await this.prisma.turno.findMany({
        where: {
          clinicaId: clinica.id,
          fecha: {
            gte: hoy,
            lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        select: {
          montoTotal: true,
        },
      });

      const ventasHoy = turnosHoyData.reduce((sum, turno) => {
        return sum + parseFloat(turno.montoTotal || '0');
      }, 0);

      // 4. Ventas del mes
      const turnosMesData = await this.prisma.turno.findMany({
        where: {
          clinicaId: clinica.id,
          fecha: {
            gte: inicioMes,
            lt: new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 1),
          },
        },
        select: {
          montoTotal: true,
        },
      });

      const ventasMes = turnosMesData.reduce((sum, turno) => {
        return sum + parseFloat(turno.montoTotal || '0');
      }, 0);

      // 5. Total ventas pagadas (de todos los tiempos)
      const turnosPagadosData = await this.prisma.turno.findMany({
        where: {
          clinicaId: clinica.id,
          estadoPago: 'pagado',
        },
        select: {
          montoTotal: true,
        },
      });

      const totalVentasPagadas = turnosPagadosData.reduce((sum, turno) => {
        return sum + parseFloat(turno.montoTotal || '0');
      }, 0);

      // 6. Pacientes únicos (de todos los tiempos)
      const pacientesUnicos = await this.prisma.turno.groupBy({
        by: ['email'],
        where: {
          clinicaId: clinica.id,
          email: {
            not: '',
          },
        },
        _count: {
          email: true,
        },
      });

      return {
        success: true,
        turnosHoy,
        turnosMes,
        ventasHoy,
        ventasMes,
        totalVentasPagadas,
        totalPacientes: pacientesUnicos.length,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener dashboard de ventas:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getClinicaByUrl(clinicaUrl: string) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });
      return clinica;
    } catch (error) {
      console.error('Error al obtener clínica por URL:', error);
      return null;
    }
  }

  async createClinica(dto: CreateClinicaDto) {
    console.log('🔧 ClinicasService: Iniciando creación de clínica');
    console.log('🔧 ClinicasService: DTO recibido:', dto);
    
    // Convertir URL a minúsculas para consistencia
    const urlNormalizada = dto.url.toLowerCase();
    console.log('🔧 ClinicasService: URL normalizada:', urlNormalizada);
    
    // Verificar que la URL no exista
    const existingClinica = await this.prisma.clinica.findUnique({
      where: { url: urlNormalizada },
    });

    if (existingClinica) {
      throw new BadRequestException('URL de clínica ya existe');
    }

    // Verificar que el email no exista globalmente (para emails de clínicas)
    if (dto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException('El email ya está registrado');
      }
    }

    // Verificar que el plan existe si se proporciona
    let planId: string | null = null;
    if (dto.planId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: dto.planId },
      });
      
      if (!plan || !plan.activo) {
        throw new BadRequestException('Plan no encontrado o inactivo');
      }
      planId = plan.id;
    }

    // Usar transacción para crear clínica y suscripción atómicamente
    const result = await this.prisma.$transaction(async (prisma) => {
      // Crear la clínica
      const clinica = await prisma.clinica.create({
        data: {
          name: dto.nombre,
          url: urlNormalizada,
          address: dto.direccion || '',
          phone: dto.telefono || '',
          email: dto.email,
          colorPrimario: dto.colorPrimario || dto.color_primario || '#3B82F6',
          colorSecundario: dto.colorSecundario || dto.color_secundario || '#1E40AF',
          descripcion: dto.descripcion || '',
          estado: dto.estado || 'activa',
          estadoPago: 'pendiente',
          fechaCreacion: new Date(),
          ultimoPago: null,
          proximoPago: null,
        },
      });

      // Crear suscripción automáticamente si se proporciona planId
      let suscripcion: any = null;
      if (planId) {
        const fechaInicio = new Date();
        const fechaTrialFin = new Date();
        fechaTrialFin.setDate(fechaTrialFin.getDate() + 7); // 7 días de trial

        suscripcion = await prisma.suscripcion.create({
          data: {
            clinicaId: clinica.id,
            planId: planId,
            estado: 'trial',
            fechaInicio,
            fechaTrialFin,
            trialDias: 7,
            autoRenovar: true,
            metadata: {
              limiteProfesionales: 3,
              limiteUam: 1000,
              profesionalesUsados: 0,
              uamUsadas: 0,
            },
          },
        });

        // Actualizar estado de pago de la clínica
        await prisma.clinica.update({
          where: { id: clinica.id },
          data: { estadoPago: 'trial' },
        });
      }

      return { clinica, suscripcion };
    });

    const { clinica, suscripcion } = result;

    // Crear usuario ADMIN automáticamente para la clínica
    let adminUser: any = null;
    if (dto.email && dto.password) {
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      adminUser = await this.prisma.user.create({
        data: {
          name: `Administrador de ${dto.nombre}`,
          email: dto.email,
          password: hashedPassword,
          role: 'ADMIN',
          clinicaId: clinica.id,
          estado: 'activo',
        },
      });

      // Enviar email de bienvenida con credenciales al admin
      try {
        await this.emailService.sendWelcomeCredentialsEmail(
          dto.email,
          dto.password, // Contraseña en texto plano para el email
          `Administrador de ${dto.nombre}`,
          'ADMIN',
          dto.nombre,
        );
        console.log(`Email de bienvenida enviado al admin: ${dto.email}`);
      } catch (emailError) {
        console.error('Error al enviar email de bienvenida al admin:', emailError);
        // No lanzamos error para no interrumpir la creación de la clínica
      }
    }

    if (dto.especialidades?.length) {
      await this.prisma.especialidad.createMany({
        data: dto.especialidades.map((name) => ({
          name,
          clinicaId: clinica.id,
        })),
      });
    }

    // Manejar horarios (puede ser array o string JSON)
    if (dto.horarios) {
      let horariosArray: Array<{day: string, openTime: string, closeTime: string}> = [];
      
      if (typeof dto.horarios === 'string') {
        try {
          const horariosJson = JSON.parse(dto.horarios);
          // Convertir el formato del frontend al formato de la base de datos
          horariosArray = Object.entries(horariosJson).map(([day, schedule]: [string, any]) => ({
            day: day,
            openTime: schedule.inicio,
            closeTime: schedule.fin,
          }));
        } catch (error) {
          console.log('Error parsing horarios JSON:', error);
        }
      } else if (Array.isArray(dto.horarios)) {
        horariosArray = dto.horarios;
      }
      
      if (horariosArray.length > 0) {
        await this.prisma.horario.createMany({
          data: horariosArray.map((h) => ({
            day: h.day,
            openTime: h.openTime,
            closeTime: h.closeTime,
            clinicaId: clinica.id,
          })),
        });
      }
    }

    const clinicaConRelaciones = await this.prisma.clinica.findUnique({
      where: { id: clinica.id },
      include: { 
        especialidades: true, 
        horarios: true,
        suscripcion: {
          include: {
            plan: true
          }
        }
      },
    });

    if (!clinicaConRelaciones) {
      throw new BadRequestException('Error al crear la clínica');
    }

    return {
      success: true,
      message: 'Clínica creada exitosamente',
      clinica: {
        id: clinicaConRelaciones.id,
        nombre: clinicaConRelaciones.name,
        url: clinicaConRelaciones.url,
        email: clinicaConRelaciones.email,
        colorPrimario: clinicaConRelaciones.colorPrimario,
        colorSecundario: clinicaConRelaciones.colorSecundario,
        descripcion: clinicaConRelaciones.descripcion,
        direccion: clinicaConRelaciones.address,
        telefono: clinicaConRelaciones.phone,
        plan: dto.plan || 'basic',
        estado: clinicaConRelaciones.estado,
        estadoPago: clinicaConRelaciones.estadoPago,
        fechaCreacion: clinicaConRelaciones.fechaCreacion,
        createdAt: clinicaConRelaciones.createdAt,
        updatedAt: clinicaConRelaciones.updatedAt,
        suscripcion: suscripcion ? {
          id: suscripcion.id,
          estado: suscripcion.estado,
          fechaInicio: suscripcion.fechaInicio,
          fechaTrialFin: suscripcion.fechaTrialFin,
          trialDias: suscripcion.trialDias,
          plan: {
            id: suscripcion.planId,
            nombre: 'Plan Trial',
            precio: 0,
          }
        } : null,
      },
    };
  }

  async updateClinicaLanguage(
    clinicaUrl: string,
    dto: UpdateClinicaLanguageDto,
  ) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Actualizar solo el idioma
      const clinicaActualizada = await this.prisma.clinica.update({
        where: { url: clinicaUrl },
        data: {
          defaultLanguage: dto.defaultLanguage,
        },
      });

      return {
        success: true,
        message: 'Idioma de la clínica actualizado exitosamente',
        clinica: {
          id: clinicaActualizada.id,
          nombre: clinicaActualizada.name,
          url: clinicaActualizada.url,
          defaultLanguage: clinicaActualizada.defaultLanguage,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al actualizar idioma de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }
}
