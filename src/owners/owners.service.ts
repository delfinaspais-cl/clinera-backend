import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClinicaDto } from './dto/create-clinica.dto';
import { UpdateClinicaDto } from './dto/update-clinica.dto';
import { SendMensajeDto } from './dto/send-mensaje.dto';
import { EmailService } from '../email/email.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OwnersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async getAllClinicas() {
    try {
      const clinicas = await this.prisma.clinica.findMany({
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transformar los datos para el formato requerido
      const clinicasFormateadas = clinicas.map((clinica) => ({
        id: clinica.id,
        nombre: clinica.name,
        url: clinica.url,
        logo: clinica.logo || null,
        colorPrimario: clinica.colorPrimario || '#3B82F6',
        colorSecundario: clinica.colorSecundario || '#1E40AF',
        estado: clinica.estado || 'activa',
        estadoPago: clinica.estadoPago || 'pagado',
        pendiente_aprobacion: clinica.pendienteAprobacion || false,
        fuente: clinica.fuente || 'owner_dashboard',
        fechaCreacion: clinica.fechaCreacion.toISOString().split('T')[0],
        ultimoPago: clinica.ultimoPago
          ? clinica.ultimoPago.toISOString().split('T')[0]
          : null,
        proximoPago: clinica.proximoPago
          ? clinica.proximoPago.toISOString().split('T')[0]
          : null,
        usuarios: clinica._count.users,
        turnos: 0, // Por ahora hardcodeado, se puede calcular después
        ingresos: 0, // Por ahora hardcodeado, se puede calcular después
      }));

      return {
        success: true,
        clinicas: clinicasFormateadas,
      };
    } catch (error) {
      console.error('Error al obtener clínicas:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async createClinica(dto: CreateClinicaDto) {
    // Convertir URL a minúsculas para consistencia
    const urlNormalizada = dto.url.toLowerCase();
    
    // Verificar que la URL no exista
    const existingClinica = await this.prisma.clinica.findFirst({
      where: { url: urlNormalizada },
    });

    if (existingClinica) {
      throw new BadRequestException('URL de clínica ya existe');
    }

    // Verificar que el email no exista
    if (dto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException('El email ya está registrado');
      }
    }

    const clinica = await this.prisma.clinica.create({
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

    const clinicaConRelaciones = await this.prisma.clinica.findFirst({
      where: { id: clinica.id },
      include: { especialidades: true, horarios: true },
    });

    if (!clinicaConRelaciones) {
      throw new BadRequestException('Error al crear la clínica');
    }

    // Crear suscripción automática si se proporciona planId
    let subscription = null;
    if (dto.planId) {
      try {
        console.log(`🏥 Creando suscripción automática para clínica ${clinicaConRelaciones.id} con plan ${dto.planId}`);
        subscription = await this.subscriptionsService.createTrialSubscription(
          clinicaConRelaciones.id,
          dto.planId
        );
        console.log(`✅ Suscripción creada exitosamente:`, subscription);
      } catch (subscriptionError) {
        console.error('❌ Error al crear suscripción automática:', subscriptionError);
        // No lanzamos error para no interrumpir la creación de la clínica
      }
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
      },
      subscription: subscription ? {
        id: subscription.id,
        planId: subscription.planId,
        estado: subscription.estado,
        tipo: subscription.tipo
      } : null,
    };
  }

  async updateClinica(clinicaId: string, dto: UpdateClinicaDto) {
    try {
      // Verificar si la clínica existe
      const clinica = await this.prisma.clinica.findFirst({
        where: { id: clinicaId },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Debug: mostrar qué campos llegan en el DTO
      console.log('DTO recibido:', JSON.stringify(dto, null, 2));
      console.log('dto.address:', dto.address);
      console.log('dto.phone:', dto.phone);
      console.log('dto.descripcion:', dto.descripcion);

      // Actualizar campos simples - versión de debug forzada
      const updateData: any = {};

      // Forzar la actualización de todos los campos que llegan
      updateData.address = dto.address || dto.direccion || '';
      updateData.phone = dto.phone || dto.telefono || '';
      updateData.descripcion = dto.descripcion || '';
      updateData.name = dto.name || dto.nombre || clinica.name;
      updateData.email = dto.email || clinica.email;
      updateData.colorPrimario = dto.colorPrimario || clinica.colorPrimario;
      updateData.colorSecundario =
        dto.colorSecundario || clinica.colorSecundario;

      console.log('Datos a actualizar:', JSON.stringify(updateData, null, 2));

      await this.prisma.clinica.update({
        where: { id: clinicaId },
        data: updateData,
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
      if (dto.horarios && Array.isArray(dto.horarios)) {
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
      const clinicaActualizada = await this.prisma.clinica.findFirst({
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
      const clinica = await this.prisma.clinica.findFirst({
        where: { id: clinicaId },
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
          clinicaId: clinicaId,
        },
      });

      return {
        success: true,
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
        where: { estado: 'activa' },
      });

      // Obtener estadísticas de usuarios
      const totalUsuarios = await this.prisma.user.count({
        where: {
          role: {
            in: ['ADMIN', 'PROFESSIONAL', 'SECRETARY'],
          },
        },
      });

      // Obtener estadísticas de turnos
      const totalTurnos = await this.prisma.turno.count();

      // Calcular clínicas nuevas (creadas en el último mes)
      const unMesAtras = new Date();
      unMesAtras.setMonth(unMesAtras.getMonth() - 1);

      const clinicasNuevas = await this.prisma.clinica.count({
        where: {
          createdAt: {
            gte: unMesAtras,
          },
        },
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
          clinicasNuevas,
        },
      };
    } catch (error) {
      console.error('Error al obtener estadísticas del propietario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getOwnerMessages() {
    try {
      const mensajes = await this.prisma.mensaje.findMany({
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
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        mensajes: mensajes.map((mensaje) => ({
          id: mensaje.id,
          asunto: mensaje.asunto,
          mensaje: mensaje.mensaje,
          tipo: mensaje.tipo,
          leido: mensaje.leido,
          clinica: mensaje.clinica,
          createdAt: mensaje.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      console.error('Error al obtener mensajes del propietario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async createOwnerMessage(dto: SendMensajeDto) {
    try {
      // Si se especifica una clínica, verificar que existe (por ID o URL)
      if (dto.clinicaId) {
        let clinica = await this.prisma.clinica.findFirst({
          where: { id: dto.clinicaId },
        });

        // Si no se encuentra por ID, intentar buscar por URL
        if (!clinica) {
          clinica = await this.prisma.clinica.findFirst({
            where: { url: dto.clinicaId },
          });
        }

        if (!clinica) {
          throw new BadRequestException(
            `Clínica con ID o URL "${dto.clinicaId}" no encontrada. Verifique que sea correcto.`,
          );
        }

        // Usar el ID real de la clínica encontrada
        dto.clinicaId = clinica.id;
      }

      // Crear el mensaje
      const mensaje = await this.prisma.mensaje.create({
        data: {
          asunto: dto.asunto,
          mensaje: dto.mensaje,
          tipo: dto.tipo || 'general',
          clinicaId: dto.clinicaId || undefined, // Si no se especifica, es un mensaje general
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
        mensaje: {
          id: mensaje.id,
          asunto: mensaje.asunto,
          mensaje: mensaje.mensaje,
          tipo: mensaje.tipo,
          leido: mensaje.leido,
          clinica: mensaje.clinica,
          createdAt: mensaje.createdAt.toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al crear mensaje del propietario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getOwnerAnalytics() {
    try {
      // Obtener datos de los últimos 12 meses
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 12);

      // Analytics de clínicas por mes
      const clinicasPorMes = await this.prisma.clinica.groupBy({
        by: ['estado'],
        where: {
          createdAt: {
            gte: fechaInicio,
          },
        },
        _count: {
          estado: true,
        },
      });

      // Analytics de usuarios por rol
      const usuariosPorRol = await this.prisma.user.groupBy({
        by: ['role'],
        where: {
          role: {
            in: ['ADMIN', 'PROFESSIONAL', 'SECRETARY'],
          },
        },
        _count: {
          role: true,
        },
      });

      // Analytics de turnos por mes
      const turnosPorMes = await this.prisma.turno.groupBy({
        by: ['estado'],
        where: {
          createdAt: {
            gte: fechaInicio,
          },
        },
        _count: {
          estado: true,
        },
      });

      // Analytics de crecimiento de clínicas
      const ultimos6Meses: Array<{
        mes: string;
        clinicas: number;
        turnos: number;
      }> = [];
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const mes = fecha.getMonth();
        const año = fecha.getFullYear();

        const clinicasMes = await this.prisma.clinica.count({
          where: {
            createdAt: {
              gte: new Date(año, mes, 1),
              lt: new Date(año, mes + 1, 1),
            },
          },
        });

        const turnosMes = await this.prisma.turno.count({
          where: {
            createdAt: {
              gte: new Date(año, mes, 1),
              lt: new Date(año, mes + 1, 1),
            },
          },
        });

        ultimos6Meses.push({
          mes: fecha.toLocaleString('es-ES', {
            month: 'long',
            year: 'numeric',
          }),
          clinicas: clinicasMes,
          turnos: turnosMes,
        });
      }

      // Calcular métricas de rendimiento
      const totalClinicas = clinicasPorMes.reduce(
        (acc, stat) => acc + stat._count.estado,
        0,
      );
      const clinicasActivas =
        clinicasPorMes.find((s) => s.estado === 'activa')?._count.estado || 0;
      const tasaActivacion =
        totalClinicas > 0 ? (clinicasActivas / totalClinicas) * 100 : 0;

      const totalTurnos = turnosPorMes.reduce(
        (acc, stat) => acc + stat._count.estado,
        0,
      );
      const turnosConfirmados =
        turnosPorMes.find((s) => s.estado === 'confirmado')?._count.estado || 0;
      const tasaConfirmacion =
        totalTurnos > 0 ? (turnosConfirmados / totalTurnos) * 100 : 0;

      return {
        success: true,
        analytics: {
          resumen: {
            totalClinicas,
            clinicasActivas,
            tasaActivacion: Math.round(tasaActivacion * 100) / 100,
            totalTurnos,
            turnosConfirmados,
            tasaConfirmacion: Math.round(tasaConfirmacion * 100) / 100,
          },
          usuariosPorRol: usuariosPorRol.map((stat) => ({
            rol: stat.role,
            cantidad: stat._count.role,
          })),
          tendencias: {
            ultimos6Meses,
            crecimientoClinicas:
              ultimos6Meses.length > 1
                ? ((ultimos6Meses[ultimos6Meses.length - 1].clinicas -
                    ultimos6Meses[0].clinicas) /
                    ultimos6Meses[0].clinicas) *
                  100
                : 0,
            crecimientoTurnos:
              ultimos6Meses.length > 1
                ? ((ultimos6Meses[ultimos6Meses.length - 1].turnos -
                    ultimos6Meses[0].turnos) /
                    ultimos6Meses[0].turnos) *
                  100
                : 0,
          },
          rendimiento: {
            promedioClinicasPorMes: Math.round(totalClinicas / 12),
            promedioTurnosPorMes: Math.round(totalTurnos / 12),
            ingresosEstimados: clinicasActivas * 12500, // $12,500 por clínica activa
          },
        },
      };
    } catch (error) {
      console.error('Error al obtener analytics del propietario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getOwnerNotifications() {
    try {
      const notificaciones = await this.prisma.notificacion.findMany({
        where: {
          destinatarioId: null, // Notificaciones generales para el propietario
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        notificaciones: notificaciones.map((notif) => ({
          id: notif.id,
          titulo: notif.titulo,
          mensaje: notif.mensaje,
          tipo: notif.tipo,
          prioridad: notif.prioridad,
          leida: notif.leida,
          clinica: notif.clinica,
          fechaVencimiento: notif.fechaVencimiento?.toISOString(),
          createdAt: notif.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      console.error('Error al obtener notificaciones del propietario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getAdminCredentials(clinicaId: string) {
    try {
      // Buscar la clínica
      const clinica = await this.prisma.clinica.findFirst({
        where: { id: clinicaId },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar el usuario admin de la clínica
      const adminUser = await this.prisma.user.findFirst({
        where: {
          clinicaId: clinicaId,
          role: 'ADMIN',
        },
      });

      if (!adminUser) {
        throw new BadRequestException(
          'No se encontró un administrador para esta clínica',
        );
      }

      return {
        success: true,
        adminCredentials: {
          email: adminUser.email,
          name: adminUser.name,
          clinicaUrl: clinica.url,
          clinicaName: clinica.name,
          message:
            'Para obtener la contraseña temporal, revisa los logs del servidor cuando se creó la clínica.',
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al obtener credenciales de admin:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async resetAdminPassword(clinicaId: string) {
    try {
      // Buscar la clínica
      const clinica = await this.prisma.clinica.findFirst({
        where: { id: clinicaId },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar el usuario admin de la clínica
      const adminUser = await this.prisma.user.findFirst({
        where: {
          clinicaId: clinicaId,
          role: 'ADMIN',
        },
      });

      if (!adminUser) {
        throw new BadRequestException(
          'No se encontró un administrador para esta clínica',
        );
      }

      // Generar nueva contraseña temporal
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Actualizar la contraseña del admin
      await this.prisma.user.update({
        where: { id: adminUser.id },
        data: { password: hashedPassword },
      });

      return {
        success: true,
        message: 'Contraseña de administrador reseteada exitosamente',
        adminCredentials: {
          email: adminUser.email,
          name: adminUser.name,
          clinicaUrl: clinica.url,
          clinicaName: clinica.name,
          tempPassword: tempPassword,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al resetear contraseña de admin:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  // Métodos de validación
  async validateClinicaUrl(url: string) {
    try {
      // Validar formato de URL (solo letras, números, guiones y guiones bajos)
      const urlRegex = /^[a-zA-Z0-9_-]+$/;
      if (!urlRegex.test(url)) {
        return {
          success: false,
          available: false,
          message:
            'La URL solo puede contener letras, números, guiones y guiones bajos',
        };
      }

      // Verificar si la URL ya existe
      const existingClinica = await this.prisma.clinica.findFirst({
        where: { url },
      });

      return {
        success: true,
        available: !existingClinica,
        message: existingClinica
          ? 'La URL ya está en uso'
          : 'La URL está disponible',
      };
    } catch (error) {
      console.error('Error al validar URL de clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async validateEmail(email: string) {
    try {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          available: false,
          message: 'Formato de email inválido',
        };
      }

      // Verificar si el email ya existe
      const existingUser = await this.prisma.user.findFirst({
        where: { email },
      });

      return {
        success: true,
        available: !existingUser,
        message: existingUser
          ? 'El email ya está registrado'
          : 'El email está disponible',
      };
    } catch (error) {
      console.error('Error al validar email:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  // Método para borrar clínica (con manejo de errores mejorado)
  async deleteClinica(clinicaId: string) {
    try {
      console.log('🔍 Iniciando borrado de clínica:', clinicaId);

      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findFirst({
        where: { id: clinicaId },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      console.log('✅ Clínica encontrada:', clinica.name);

      // Intentar borrar la clínica directamente
      try {
        await this.prisma.clinica.delete({
          where: { id: clinicaId },
        });

        console.log('✅ Clínica borrada exitosamente');

        return {
          success: true,
          message: 'Clínica borrada exitosamente',
          deletedClinica: {
            id: clinica.id,
            name: clinica.name,
            url: clinica.url,
          },
        };
      } catch (deleteError) {
        console.error('❌ Error al borrar clínica:', deleteError);

        // Si hay error de clave foránea, intentar borrado en cascada
        if (
          deleteError.code === 'P2003' ||
          deleteError.message.includes('foreign key')
        ) {
          console.log('🔄 Intentando borrado en cascada...');

          try {
            // Borrar datos relacionados en orden específico
            await this.prisma.notificacion.deleteMany({ where: { clinicaId } });
            await this.prisma.mensaje.deleteMany({ where: { clinicaId } });
            await this.prisma.horario.deleteMany({ where: { clinicaId } });
            await this.prisma.especialidad.deleteMany({ where: { clinicaId } });
            await this.prisma.whatsAppMessage.deleteMany({
              where: { clinicaId },
            });
            await this.prisma.whatsAppTemplate.deleteMany({
              where: { clinicaId },
            });
            await this.prisma.turno.deleteMany({ where: { clinicaId } });
            await this.prisma.user.deleteMany({ where: { clinicaId } });

            // Ahora intentar borrar la clínica
            await this.prisma.clinica.delete({ where: { id: clinicaId } });

            console.log('✅ Clínica borrada con cascada exitosamente');

            return {
              success: true,
              message: 'Clínica borrada exitosamente',
              deletedClinica: {
                id: clinica.id,
                name: clinica.name,
                url: clinica.url,
              },
            };
          } catch (cascadeError) {
            console.error('❌ Error en borrado en cascada:', cascadeError);
            throw new BadRequestException(
              'No se puede borrar la clínica porque tiene datos relacionados. Elimine primero los datos asociados.',
            );
          }
        } else {
          throw new BadRequestException('Error interno del servidor');
        }
      }
    } catch (error) {
      console.error('❌ Error al borrar clínica:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error interno del servidor');
    }
  }

  // Método para actualizar configuración del propietario
  async updateOwnerConfig(ownerId: string, dto: any) {
    try {
      console.log('🔍 Actualizando configuración del propietario:', ownerId);

      // Verificar que el owner existe
      const owner = await this.prisma.user.findFirst({
        where: { 
          id: ownerId,
          role: 'OWNER'
        },
      });

      if (!owner) {
        throw new BadRequestException('Propietario no encontrado');
      }

      // Verificar que el email no esté en uso por otro usuario (si cambió)
      if (dto.email && dto.email !== owner.email) {
        const existingUser = await this.prisma.user.findFirst({
          where: { 
            email: dto.email,
            id: { not: ownerId }
          },
        });

        if (existingUser) {
          throw new BadRequestException('El email ya está en uso por otro usuario');
        }
      }

      // Preparar datos para actualizar
      const updateData: any = {
        name: dto.nombre,
        email: dto.email,
        phone: dto.telefono,
        updatedAt: new Date(),
      };

      // Agregar campos adicionales si existen en el modelo User
      if (dto.whatsapp !== undefined) updateData.whatsapp = dto.whatsapp;
      if (dto.facebook !== undefined) updateData.facebook = dto.facebook;
      if (dto.instagram !== undefined) updateData.instagram = dto.instagram;
      if (dto.website !== undefined) updateData.website = dto.website;
      if (dto.avatar_url !== undefined) updateData.avatar_url = dto.avatar_url;
      if (dto.configuracion !== undefined) updateData.configuracion = JSON.stringify(dto.configuracion);

      // Actualizar el usuario
      const updatedOwner = await this.prisma.user.update({
        where: { id: ownerId },
        data: updateData,
      });

      console.log('✅ Configuración del propietario actualizada exitosamente');

      // Preparar respuesta
      const responseData = {
        id: updatedOwner.id,
        nombre: updatedOwner.name,
        email: updatedOwner.email,
        telefono: updatedOwner.phone,
        whatsapp: updatedOwner.whatsapp || null,
        facebook: updatedOwner.facebook || null,
        instagram: updatedOwner.instagram || null,
        website: updatedOwner.website || null,
        avatar_url: updatedOwner.avatar_url || null,
        configuracion: updatedOwner.configuracion ? JSON.parse(updatedOwner.configuracion) : {},
        updated_at: updatedOwner.updatedAt,
      };

      return {
        success: true,
        message: 'Configuración del propietario actualizada exitosamente',
        data: responseData,
      };

    } catch (error) {
      console.error('❌ Error al actualizar configuración del propietario:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Error interno del servidor');
    }
  }

  // ===== NUEVOS MÉTODOS PARA MENSAJERÍA =====

  async searchClinicas(query: string) {
    try {
      console.log('🔍 Buscando clínicas con query:', query);

      const clinicas = await this.prisma.clinica.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { url: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          url: true,
          email: true,
          estado: true,
        },
        take: 20,
      });

      return {
        success: true,
        clinicas: clinicas.map(clinica => ({
          id: clinica.id,
          nombre: clinica.name,
          url: clinica.url,
          email: clinica.email,
          estado: clinica.estado,
        })),
      };
    } catch (error) {
      console.error('❌ Error buscando clínicas:', error);
      throw new BadRequestException('Error al buscar clínicas');
    }
  }

  async markMessageAsRead(messageId: string) {
    try {
      const message = await this.prisma.mensaje.update({
        where: { id: messageId },
        data: { leido: true },
      });

      return {
        success: true,
        message: 'Mensaje marcado como leído',
        data: message,
      };
    } catch (error) {
      throw new BadRequestException('Error al marcar mensaje como leído');
    }
  }

  async getConversations() {
    try {
      // Obtener todas las clínicas que tienen mensajes
      const clinicasWithMessages = await this.prisma.clinica.findMany({
        where: {
          mensajes: {
            some: {},
          },
        },
        include: {
          mensajes: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Solo el último mensaje
          },
          _count: {
            select: {
              mensajes: true,
            },
          },
        },
      });

      const conversations = await Promise.all(
        clinicasWithMessages.map(async (clinica) => {
          // Contar mensajes no leídos
          const unreadCount = await this.prisma.mensaje.count({
            where: {
              clinicaId: clinica.id,
              leido: false,
            },
          });

          return {
            clinicaId: clinica.id,
            clinicaNombre: clinica.name,
            clinicaUrl: clinica.url,
            lastMessage: clinica.mensajes[0] ? {
              id: clinica.mensajes[0].id,
              asunto: clinica.mensajes[0].asunto,
              mensaje: clinica.mensajes[0].mensaje,
              fecha: clinica.mensajes[0].createdAt,
              leido: clinica.mensajes[0].leido,
            } : null,
            unreadCount,
            totalMessages: clinica._count.mensajes,
          };
        })
      );

      return {
        success: true,
        conversations: conversations.filter(conv => conv.lastMessage), // Solo conversaciones con mensajes
      };
    } catch (error) {
      throw new BadRequestException('Error al obtener conversaciones');
    }
  }

  async getConversationMessages(clinicaIdOrUrl: string) {
    try {
      // Primero intentar buscar por ID
      let clinica = await this.prisma.clinica.findFirst({
        where: { id: clinicaIdOrUrl },
      });

      // Si no se encuentra por ID, intentar buscar por URL
      if (!clinica) {
        clinica = await this.prisma.clinica.findFirst({
          where: { url: clinicaIdOrUrl },
        });
      }

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      const messages = await this.prisma.mensaje.findMany({
        where: { clinicaId: clinica.id },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        messages: messages.map(message => ({
          id: message.id,
          asunto: message.asunto,
          mensaje: message.mensaje,
          tipo: message.tipo,
          leido: message.leido,
          clinicaId: message.clinicaId,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        })),
      };
    } catch (error) {
      throw new BadRequestException('Error al obtener mensajes de conversación');
    }
  }

  async sendMessageToConversation(clinicaIdOrUrl: string, dto: SendMensajeDto) {
    try {
      // Primero intentar buscar por ID
      let clinica = await this.prisma.clinica.findFirst({
        where: { id: clinicaIdOrUrl },
      });

      // Si no se encuentra por ID, intentar buscar por URL
      if (!clinica) {
        clinica = await this.prisma.clinica.findFirst({
          where: { url: clinicaIdOrUrl },
        });
      }

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      const message = await this.prisma.mensaje.create({
        data: {
          asunto: dto.asunto,
          mensaje: dto.mensaje,
          tipo: dto.tipo,
          clinicaId: clinica.id,
          leido: false,
        },
      });

      return {
        success: true,
        message: 'Mensaje enviado exitosamente',
        data: message,
      };
    } catch (error) {
      throw new BadRequestException('Error al enviar mensaje');
    }
  }

  async getMessageStats() {
    try {
      const [total, unread, read] = await Promise.all([
        this.prisma.mensaje.count(),
        this.prisma.mensaje.count({ where: { leido: false } }),
        this.prisma.mensaje.count({ where: { leido: true } }),
      ]);

      // Contar mensajes en conversación (clínicas con mensajes)
      const clinicasWithMessages = await this.prisma.clinica.count({
        where: {
          mensajes: {
            some: {},
          },
        },
      });

      return {
        success: true,
        stats: {
          total,
          unread,
          read,
          archived: 0, // Por ahora no implementamos archivo
          inConversation: clinicasWithMessages,
        },
      };
    } catch (error) {
      throw new BadRequestException('Error al obtener estadísticas de mensajes');
    }
  }

  async archiveMessage(messageId: string, archived: boolean) {
    try {
      // Por ahora solo marcamos como leído/no leído
      // En el futuro se puede implementar un campo archived en el modelo
      const message = await this.prisma.mensaje.update({
        where: { id: messageId },
        data: { leido: !archived }, // Si se archiva, se marca como leído
      });

      return {
        success: true,
        message: archived ? 'Mensaje archivado' : 'Mensaje desarchivado',
        data: message,
      };
    } catch (error) {
      throw new BadRequestException('Error al archivar mensaje');
    }
  }

  async getMessagesWithFilters(filters: {
    status?: string;
    clinicaId?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const where: any = {};

      // Aplicar filtros
      if (filters.clinicaId) {
        where.clinicaId = filters.clinicaId;
      }

      if (filters.status) {
        switch (filters.status) {
          case 'unread':
            where.leido = false;
            break;
          case 'read':
            where.leido = true;
            break;
          case 'archived':
            // Por ahora no implementamos archivo, pero se puede extender
            where.leido = true;
            break;
          case 'in_conversation':
            // Mensajes de clínicas que tienen múltiples mensajes
            break;
        }
      }

      const messages = await this.prisma.mensaje.findMany({
        where,
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      });

      return {
        success: true,
        messages: messages.map(message => ({
          id: message.id,
          asunto: message.asunto,
          mensaje: message.mensaje,
          tipo: message.tipo,
          leido: message.leido,
          clinicaId: message.clinicaId,
          clinica: message.clinica,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        })),
        pagination: {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          total: await this.prisma.mensaje.count({ where }),
        },
      };
    } catch (error) {
      console.error('❌ Error obteniendo mensajes con filtros:', error);
      throw new BadRequestException('Error al obtener mensajes');
    }
  }

  // ===== NUEVOS MÉTODOS PARA CLÍNICAS PENDIENTES =====

  async createClinicaPendiente(dto: any) {
    try {
      // Convertir URL a minúsculas para consistencia
      const urlNormalizada = dto.url.toLowerCase();
      
      // Verificar que la URL no exista
      const existingClinica = await this.prisma.clinica.findFirst({
        where: { url: urlNormalizada },
      });

      if (existingClinica) {
        throw new BadRequestException('URL de clínica ya existe');
      }

      // Verificar que el email no exista
      if (dto.email) {
        const existingUser = await this.prisma.user.findFirst({
          where: { email: dto.email },
        });

        if (existingUser) {
          throw new BadRequestException('El email ya está registrado');
        }
      }

      // Crear la clínica con estado pendiente
      const clinica = await this.prisma.clinica.create({
        data: {
          name: dto.nombre,
          url: urlNormalizada,
          address: dto.direccion || '',
          phone: dto.telefono || '',
          email: dto.email,
          colorPrimario: dto.color_primario || '#3B82F6',
          colorSecundario: dto.color_secundario || '#1E40AF',
          descripcion: dto.descripcion || '',
          estado: dto.estado || 'activo',
          estadoPago: 'pendiente',
          pendienteAprobacion: dto.pendiente_aprobacion !== undefined ? dto.pendiente_aprobacion : false,
          fuente: dto.fuente || 'owner_dashboard',
          fechaCreacion: new Date(),
          ultimoPago: null,
          proximoPago: null,
        },
      });

      // Crear el usuario admin si se proporciona
      if (dto.admin) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        
        await this.prisma.user.create({
          data: {
            email: dto.admin.email,
            password: hashedPassword,
            name: dto.admin.nombre,
            role: 'ADMIN',
            clinicaId: clinica.id,
            estado: 'activo',
          },
        });
      }

      return {
        success: true,
        clinica: {
          id: clinica.id,
          nombre: clinica.name,
          url: clinica.url,
          estado: clinica.estado,
          pendiente_aprobacion: clinica.pendienteAprobacion,
          fuente: clinica.fuente,
          createdAt: clinica.createdAt,
          updatedAt: clinica.updatedAt,
        },
      };
    } catch (error) {
      console.error('Error al crear clínica pendiente:', error);
      throw new BadRequestException(error.message || 'Error interno del servidor');
    }
  }

  async updateClinicaEstado(clinicaId: string, estado: 'activo' | 'inactiva') {
    try {
      // Verificar que la clínica existe
      const existingClinica = await this.prisma.clinica.findFirst({
        where: { id: clinicaId },
      });

      if (!existingClinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Actualizar el estado de la clínica
      const clinica = await this.prisma.clinica.update({
        where: { id: clinicaId },
        data: {
          estado: estado,
          // Si se activa la clínica, marcar como no pendiente de aprobación
          pendienteAprobacion: estado === 'activo' ? false : existingClinica.pendienteAprobacion,
        },
      });

      return {
        success: true,
        clinica: {
          id: clinica.id,
          nombre: clinica.name,
          url: clinica.url,
          estado: clinica.estado,
          pendiente_aprobacion: clinica.pendienteAprobacion,
          fuente: clinica.fuente,
          createdAt: clinica.createdAt,
          updatedAt: clinica.updatedAt,
        },
      };
    } catch (error) {
      console.error('Error al actualizar estado de clínica:', error);
      throw new BadRequestException(error.message || 'Error interno del servidor');
    }
  }
}
