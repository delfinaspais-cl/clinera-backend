import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClinicaDto } from './dto/create-clinica.dto';
import { UpdateClinicaDto } from './dto/update-clinica.dto';
import { SendMensajeDto } from './dto/send-mensaje.dto';
import * as bcrypt from 'bcrypt';

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
      throw new BadRequestException('Error interno del servidor');
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
      estado: dto.estado || 'activa',
      estadoPago: 'pagado',
      fechaCreacion: new Date(),
      ultimoPago: new Date(),
      proximoPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  // Crear usuario ADMIN automáticamente para la clínica
  let adminUser: any = null;
  if (dto.email) {
    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (!existingUser) {
      // Generar contraseña temporal (el admin deberá cambiarla en su primer login)
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      adminUser = await this.prisma.user.create({
        data: {
          name: `Administrador de ${dto.nombre}`,
          email: dto.email,
          password: hashedPassword,
          role: 'ADMIN',
          clinicaId: clinica.id,
          estado: 'activo'
        }
      });

      console.log(`Usuario ADMIN creado para clínica ${dto.nombre} con email: ${dto.email} y contraseña temporal: ${tempPassword}`);
    }
  }

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
    clinica: clinicaConRelaciones,
    adminUser: adminUser ? {
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      message: 'Usuario administrador creado automáticamente. Revisa los logs del servidor para la contraseña temporal.'
    } : null
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
    updateData.colorSecundario = dto.colorSecundario || clinica.colorSecundario;

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

  async getOwnerMessages() {
    try {
      const mensajes = await this.prisma.mensaje.findMany({
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        success: true,
        mensajes: mensajes.map(mensaje => ({
          id: mensaje.id,
          asunto: mensaje.asunto,
          mensaje: mensaje.mensaje,
          tipo: mensaje.tipo,
          leido: mensaje.leido,
          clinica: mensaje.clinica,
          createdAt: mensaje.createdAt.toISOString()
        }))
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
        let clinica = await this.prisma.clinica.findUnique({
          where: { id: dto.clinicaId }
        });

        // Si no se encuentra por ID, intentar buscar por URL
        if (!clinica) {
          clinica = await this.prisma.clinica.findUnique({
            where: { url: dto.clinicaId }
          });
        }

        if (!clinica) {
          throw new BadRequestException(`Clínica con ID o URL "${dto.clinicaId}" no encontrada. Verifique que sea correcto.`);
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
          clinicaId: dto.clinicaId || undefined // Si no se especifica, es un mensaje general
        },
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

      return {
        success: true,
        mensaje: {
          id: mensaje.id,
          asunto: mensaje.asunto,
          mensaje: mensaje.mensaje,
          tipo: mensaje.tipo,
          leido: mensaje.leido,
          clinica: mensaje.clinica,
          createdAt: mensaje.createdAt.toISOString()
        }
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
            gte: fechaInicio
          }
        },
        _count: {
          estado: true
        }
      });

      // Analytics de usuarios por rol
      const usuariosPorRol = await this.prisma.user.groupBy({
        by: ['role'],
        where: {
          role: {
            in: ['ADMIN', 'PROFESSIONAL', 'SECRETARY']
          }
        },
        _count: {
          role: true
        }
      });

      // Analytics de turnos por mes
      const turnosPorMes = await this.prisma.turno.groupBy({
        by: ['estado'],
        where: {
          createdAt: {
            gte: fechaInicio
          }
        },
        _count: {
          estado: true
        }
      });

      // Analytics de crecimiento de clínicas
      const ultimos6Meses: Array<{mes: string; clinicas: number; turnos: number}> = [];
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const mes = fecha.getMonth();
        const año = fecha.getFullYear();

        const clinicasMes = await this.prisma.clinica.count({
          where: {
            createdAt: {
              gte: new Date(año, mes, 1),
              lt: new Date(año, mes + 1, 1)
            }
          }
        });

        const turnosMes = await this.prisma.turno.count({
          where: {
            createdAt: {
              gte: new Date(año, mes, 1),
              lt: new Date(año, mes + 1, 1)
            }
          }
        });

        ultimos6Meses.push({
          mes: fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
          clinicas: clinicasMes,
          turnos: turnosMes
        });
      }

      // Calcular métricas de rendimiento
      const totalClinicas = clinicasPorMes.reduce((acc, stat) => acc + stat._count.estado, 0);
      const clinicasActivas = clinicasPorMes.find(s => s.estado === 'activa')?._count.estado || 0;
      const tasaActivacion = totalClinicas > 0 ? (clinicasActivas / totalClinicas) * 100 : 0;

      const totalTurnos = turnosPorMes.reduce((acc, stat) => acc + stat._count.estado, 0);
      const turnosConfirmados = turnosPorMes.find(s => s.estado === 'confirmado')?._count.estado || 0;
      const tasaConfirmacion = totalTurnos > 0 ? (turnosConfirmados / totalTurnos) * 100 : 0;

      return {
        success: true,
        analytics: {
          resumen: {
            totalClinicas,
            clinicasActivas,
            tasaActivacion: Math.round(tasaActivacion * 100) / 100,
            totalTurnos,
            turnosConfirmados,
            tasaConfirmacion: Math.round(tasaConfirmacion * 100) / 100
          },
          usuariosPorRol: usuariosPorRol.map(stat => ({
            rol: stat.role,
            cantidad: stat._count.role
          })),
          tendencias: {
            ultimos6Meses,
            crecimientoClinicas: ultimos6Meses.length > 1 ? 
              ((ultimos6Meses[ultimos6Meses.length - 1].clinicas - ultimos6Meses[0].clinicas) / ultimos6Meses[0].clinicas * 100) : 0,
            crecimientoTurnos: ultimos6Meses.length > 1 ? 
              ((ultimos6Meses[ultimos6Meses.length - 1].turnos - ultimos6Meses[0].turnos) / ultimos6Meses[0].turnos * 100) : 0
          },
          rendimiento: {
            promedioClinicasPorMes: Math.round(totalClinicas / 12),
            promedioTurnosPorMes: Math.round(totalTurnos / 12),
            ingresosEstimados: clinicasActivas * 12500 // $12,500 por clínica activa
          }
        }
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
          destinatarioId: null // Notificaciones generales para el propietario
        },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        success: true,
        notificaciones: notificaciones.map(notif => ({
          id: notif.id,
          titulo: notif.titulo,
          mensaje: notif.mensaje,
          tipo: notif.tipo,
          prioridad: notif.prioridad,
          leida: notif.leida,
          clinica: notif.clinica,
          fechaVencimiento: notif.fechaVencimiento?.toISOString(),
          createdAt: notif.createdAt.toISOString()
        }))
      };
    } catch (error) {
      console.error('Error al obtener notificaciones del propietario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getAdminCredentials(clinicaId: string) {
    try {
      // Buscar la clínica
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: clinicaId }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar el usuario admin de la clínica
      const adminUser = await this.prisma.user.findFirst({
        where: {
          clinicaId: clinicaId,
          role: 'ADMIN'
        }
      });

      if (!adminUser) {
        throw new BadRequestException('No se encontró un administrador para esta clínica');
      }

      return {
        success: true,
        adminCredentials: {
          email: adminUser.email,
          name: adminUser.name,
          clinicaUrl: clinica.url,
          clinicaName: clinica.name,
          message: 'Para obtener la contraseña temporal, revisa los logs del servidor cuando se creó la clínica.'
        }
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
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: clinicaId }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Buscar el usuario admin de la clínica
      const adminUser = await this.prisma.user.findFirst({
        where: {
          clinicaId: clinicaId,
          role: 'ADMIN'
        }
      });

      if (!adminUser) {
        throw new BadRequestException('No se encontró un administrador para esta clínica');
      }

      // Generar nueva contraseña temporal
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Actualizar la contraseña del admin
      await this.prisma.user.update({
        where: { id: adminUser.id },
        data: { password: hashedPassword }
      });

      return {
        success: true,
        message: 'Contraseña de administrador reseteada exitosamente',
        adminCredentials: {
          email: adminUser.email,
          name: adminUser.name,
          clinicaUrl: clinica.url,
          clinicaName: clinica.name,
          tempPassword: tempPassword
        }
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
          message: 'La URL solo puede contener letras, números, guiones y guiones bajos'
        };
      }

      // Verificar si la URL ya existe
      const existingClinica = await this.prisma.clinica.findUnique({
        where: { url }
      });

      return {
        success: true,
        available: !existingClinica,
        message: existingClinica ? 'La URL ya está en uso' : 'La URL está disponible'
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
          message: 'Formato de email inválido'
        };
      }

      // Verificar si el email ya existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email }
      });

      return {
        success: true,
        available: !existingUser,
        message: existingUser ? 'El email ya está registrado' : 'El email está disponible'
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
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: clinicaId }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      console.log('✅ Clínica encontrada:', clinica.name);

      // Intentar borrar la clínica directamente
      try {
        await this.prisma.clinica.delete({
          where: { id: clinicaId }
        });
        
        console.log('✅ Clínica borrada exitosamente');
        
        return {
          success: true,
          message: 'Clínica borrada exitosamente',
          deletedClinica: {
            id: clinica.id,
            name: clinica.name,
            url: clinica.url
          }
        };
      } catch (deleteError) {
        console.error('❌ Error al borrar clínica:', deleteError);
        
        // Si hay error de clave foránea, intentar borrado en cascada
        if (deleteError.code === 'P2003' || deleteError.message.includes('foreign key')) {
          console.log('🔄 Intentando borrado en cascada...');
          
          try {
            // Borrar datos relacionados en orden específico
            await this.prisma.notificacion.deleteMany({ where: { clinicaId } });
            await this.prisma.mensaje.deleteMany({ where: { clinicaId } });
            await this.prisma.horario.deleteMany({ where: { clinicaId } });
            await this.prisma.especialidad.deleteMany({ where: { clinicaId } });
            await this.prisma.whatsAppMessage.deleteMany({ where: { clinicaId } });
            await this.prisma.whatsAppTemplate.deleteMany({ where: { clinicaId } });
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
                url: clinica.url
              }
            };
          } catch (cascadeError) {
            console.error('❌ Error en borrado en cascada:', cascadeError);
            throw new BadRequestException('No se puede borrar la clínica porque tiene datos relacionados. Elimine primero los datos asociados.');
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

} 