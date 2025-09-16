import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { EmailService } from '../email/email.service';
import { MensapiIntegrationService } from '../users/services/mensapi-integration.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfessionalsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private mensapiIntegration: MensapiIntegrationService,
  ) {}

  async findAll(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
      include: {
        especialidades: true,
        horarios: true,
      },
    });

    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    const professionals = await this.prisma.professional.findMany({
      where: { user: { clinicaId: clinica.id } },
      include: { 
        user: true,
        agendas: {
          orderBy: {
            dia: 'asc',
          },
        },
        especialidades: {
          include: {
            especialidad: true
          }
        },
        tratamientos: {
          include: {
            tratamiento: true
          }
        }
      },
    });

    // Formatear cada profesional con el formato unificado
    const profesionalesTransformados = professionals.map(prof => {
      const horariosDetallados = (prof as any).agendas?.map((agenda: any) => ({
        dia: agenda.dia,
        horaInicio: agenda.horaInicio,
        horaFin: agenda.horaFin,
      })) || [];

      // Transformar especialidades al formato esperado
      const specialties = (prof as any).especialidades?.map((esp: any) => esp.especialidad.name) || [];

      // Transformar tratamientos al formato esperado
      const tratamientos = (prof as any).tratamientos?.map((trat: any) => trat.tratamiento.name) || [];

      return {
        ...prof,
        horariosDetallados,
        specialties,
        tratamientos,
        sucursal: (prof as any).sucursalId || null,
      };
    });

    return {
      success: true,
      data: profesionalesTransformados,
      message: 'Profesionales obtenidos exitosamente',
    };
  }

  async create(clinicaUrl: string, dto: CreateProfessionalDto) {
    try {
      console.log('🔍 Creando profesional con datos:', JSON.stringify(dto, null, 2));
      console.log('🔍 Clinica URL:', clinicaUrl);
      
      // Validar datos requeridos
      if (!dto.name || !dto.email || !dto.password) {
        throw new Error('Datos requeridos faltantes: name, email, password');
      }

      if (!Array.isArray(dto.specialties)) {
        throw new Error('specialties debe ser un array');
      }
      
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
        include: {
          especialidades: true,
          horarios: true,
        },
      });

      if (!clinica) throw new NotFoundException('Clínica no encontrada');

      console.log('✅ Clínica encontrada:', clinica.id);

      console.log('🔍 Hasheando contraseña...');
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      console.log('✅ Contraseña hasheada');

      console.log('🔍 Creando usuario...');
      console.log('🔍 Datos del usuario:', {
        email: dto.email,
        role: 'PROFESSIONAL',
        name: dto.name,
        phone: dto.phone,
        clinicaId: clinica.id,
      });
      
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: 'PROFESSIONAL',
          name: dto.name,
          phone: dto.phone,
          clinicaId: clinica.id,
        },
      });

      console.log('✅ Usuario creado:', user.id);

      console.log('🔍 Creando profesional...');
      console.log('🔍 Datos del profesional:', {
        userId: user.id,
        name: dto.name,
        specialties: dto.specialties,
        defaultDurationMin: dto.defaultDurationMin ?? 30,
        bufferMin: dto.bufferMin ?? 10,
        notes: dto.notes,
      });
      
      // Crear el profesional con los nuevos campos
      const professional = await this.prisma.professional.create({
        data: {
          userId: user.id,
          name: dto.name,
          defaultDurationMin: dto.defaultDurationMin ?? 30,
          bufferMin: dto.bufferMin ?? 10,
          notes: dto.notes,
        },
        include: { user: true },
      });

      console.log('✅ Profesional creado:', professional.id);

      // Enviar email de bienvenida con credenciales
      let emailResult: { success: boolean; error?: string } = { success: false, error: 'No se intentó enviar' };
      try {
        console.log(`📧 Enviando email de bienvenida a ${dto.email}...`);
        
        const emailSent = await this.emailService.sendWelcomeCredentialsEmail(
          dto.email,
          dto.password, // Usar la contraseña original (antes del hash)
          dto.name,
          'PROFESSIONAL',
          clinica.name
        );

        if (emailSent) {
          console.log(`✅ Email de bienvenida enviado exitosamente a ${dto.email}`);
          emailResult = { success: true };
        } else {
          console.error(`❌ Error al enviar email de bienvenida a ${dto.email}`);
          emailResult = { success: false, error: 'Error al enviar email' };
        }
      } catch (emailError) {
        console.error(`❌ Error inesperado al enviar email de bienvenida a ${dto.email}:`, emailError);
        emailResult = { success: false, error: emailError.message || 'Error inesperado' };
      }

      // Intentar registrar el usuario en mensapi (no bloquea si falla)
      let mensapiResult: any = null;
      try {
        console.log(`📱 Registrando usuario en MensAPI: ${dto.email}...`);
        mensapiResult = await this.mensapiIntegration.registerUser({
          name: dto.name,
          email: dto.email,
          password: dto.password, // Usar la contraseña original (antes del hash)
          phone: dto.phone,
        }, clinica.mensapiServiceEmail || undefined, clinica.mensapiServicePassword || undefined);
        
        if (mensapiResult) {
          console.log(`✅ Usuario registrado exitosamente en MensAPI: ${dto.email}`);
        }
      } catch (error) {
        console.warn('⚠️ Error registrando usuario en MensAPI:', error.message);
      }

      // Asignar especialidades si se proporcionan
      if (dto.specialties && dto.specialties.length > 0) {
        console.log('🔍 Asignando especialidades:', dto.specialties);
        
        // Buscar las especialidades por nombre
        const especialidades = await this.prisma.especialidad.findMany({
          where: {
            name: { in: dto.specialties },
            clinicaId: clinica.id
          }
        });

        if (especialidades.length > 0) {
          // Crear las relaciones ProfessionalEspecialidad
          const especialidadesData = especialidades.map(esp => ({
            professionalId: professional.id,
            especialidadId: esp.id
          }));

          await this.prisma.professionalEspecialidad.createMany({
            data: especialidadesData
          });
          console.log('✅ Especialidades asignadas:', especialidades.map(e => e.name));
        } else {
          console.log('⚠️ No se encontraron especialidades para asignar');
        }
      }

      // Asignar tratamientos si se proporcionan
      if (dto.tratamientos && dto.tratamientos.length > 0) {
        console.log('🔍 Asignando tratamientos:', dto.tratamientos);
        
        // Buscar los tratamientos por nombre
        const tratamientos = await this.prisma.tratamiento.findMany({
          where: {
            name: { in: dto.tratamientos },
            clinicaId: clinica.id
          }
        });

        if (tratamientos.length > 0) {
          // Crear las relaciones ProfessionalTratamiento
          const tratamientosData = tratamientos.map(trat => ({
            professionalId: professional.id,
            tratamientoId: trat.id,
            precio: trat.precio,
            duracionMin: trat.duracionMin
          }));

          await this.prisma.professionalTratamiento.createMany({
            data: tratamientosData
          });
          console.log('✅ Tratamientos asignados:', tratamientos.map(t => t.name));
        } else {
          console.log('⚠️ No se encontraron tratamientos para asignar');
        }
      }

      // Actualizar sucursal si se proporciona
      if (dto.sucursal) {
        console.log('🔍 Actualizando sucursal con ID:', dto.sucursal);
        await this.prisma.$executeRaw`
          UPDATE "Professional" 
          SET "sucursalId" = ${dto.sucursal} 
          WHERE id = ${professional.id}
        `;
        console.log('✅ Sucursal actualizada exitosamente');
      } else {
        console.log('⚠️ No se proporcionó sucursal en el DTO');
      }

      // Crear horarios de atención si se proporcionan
      if (dto.horariosDetallados && dto.horariosDetallados.length > 0) {
        // Formato avanzado: horarios específicos por día
        console.log('🔍 Creando horarios detallados...');
        const horariosData = dto.horariosDetallados.map(horario => ({
          professionalId: professional.id,
          dia: horario.dia.toUpperCase(),
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          duracionMin: dto.defaultDurationMin ?? 30,
        }));

        await this.prisma.agenda.createMany({
          data: horariosData,
        });
        console.log('✅ Horarios detallados creados');
      } else if (dto.horarios && dto.horarios.dias && dto.horarios.dias.length > 0) {
        // Formato simple: mismo horario para todos los días
        console.log('🔍 Creando horarios simples...');
        const horariosData = dto.horarios.dias.map(dia => ({
          professionalId: professional.id,
          dia: dia.toUpperCase(),
          horaInicio: dto.horarios?.horaInicio || '08:00',
          horaFin: dto.horarios?.horaFin || '18:00',
          duracionMin: dto.defaultDurationMin ?? 30,
        }));

        await this.prisma.agenda.createMany({
          data: horariosData,
        });
        console.log('✅ Horarios simples creados');
      }

      // Obtener el profesional completo con todos los datos para retornar el formato unificado
      const profesionalCompleto = await this.prisma.professional.findUnique({
        where: { id: professional.id },
        include: { 
          user: true,
          agendas: {
            orderBy: {
              dia: 'asc',
            },
          },
          especialidades: {
            include: {
              especialidad: true
            }
          },
          tratamientos: {
            include: {
              tratamiento: true
            }
          }
        },
      });

      // Transformar los horarios al formato esperado por el frontend
      const horariosDetallados = (profesionalCompleto as any).agendas?.map((agenda: any) => ({
        dia: agenda.dia,
        horaInicio: agenda.horaInicio,
        horaFin: agenda.horaFin,
      })) || [];

      // Transformar especialidades al formato esperado
      const specialties = (profesionalCompleto as any).especialidades?.map((esp: any) => esp.especialidad.name) || [];

      // Transformar tratamientos al formato esperado
      const tratamientos = (profesionalCompleto as any).tratamientos?.map((trat: any) => trat.tratamiento.name) || [];

      // Construir la respuesta con el formato unificado
      const response = {
        ...profesionalCompleto,
        horariosDetallados,
        specialties,
        tratamientos,
        sucursal: (profesionalCompleto as any).sucursalId || null,
      };

      console.log('✅ Profesional creado exitosamente');
      return {
        success: true,
        data: response,
        message: 'Profesional creado exitosamente',
        emailEnviado: emailResult.success,
        fechaEmailEnviado: emailResult.success ? new Date().toISOString() : null,
        emailError: emailResult.error,
        mensapi: mensapiResult ? {
          registered: true,
          accessToken: mensapiResult.content?.accessToken,
          refreshToken: mensapiResult.content?.refreshToken,
        } : {
          registered: false,
          error: 'No se pudo registrar en MensAPI',
        },
      };
      
    } catch (error) {
      console.error('❌ Error creando profesional:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  async findOne(clinicaUrl: string, id: string) {
    const prof = await this.prisma.professional.findUnique({
      where: { id },
      include: { 
        user: true,
        agendas: {
          orderBy: {
            dia: 'asc',
          },
        },
        especialidades: {
          include: {
            especialidad: true
          }
        },
        tratamientos: {
          include: {
            tratamiento: true
          }
        }
      },
    });

    if (!prof) throw new NotFoundException('Profesional no encontrado');

    // Transformar los horarios al formato esperado por el frontend
    const horariosDetallados = (prof as any).agendas?.map((agenda: any) => ({
      dia: agenda.dia,
      horaInicio: agenda.horaInicio,
      horaFin: agenda.horaFin,
    })) || [];

    // Transformar especialidades al formato esperado
    const specialties = (prof as any).especialidades?.map((esp: any) => esp.especialidad.name) || [];

    // Transformar tratamientos al formato esperado
    const tratamientos = (prof as any).tratamientos?.map((trat: any) => trat.tratamiento.name) || [];

    // Construir la respuesta con el formato unificado
    const response = {
      ...prof,
      horariosDetallados,
      specialties,
      tratamientos,
      sucursal: (prof as any).sucursalId || null,
    };

    return {
      success: true,
      data: response,
      message: 'Profesional obtenido exitosamente',
    };
  }

  async update(clinicaUrl: string, id: string, dto: UpdateProfessionalDto) {
    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new Error('Clínica no encontrada');
      }

      // Verificar que el profesional existe y pertenece a la clínica
      const existingProfessional = await this.prisma.professional.findFirst({
        where: {
          id,
          user: {
            clinicaId: clinica.id,
          },
        },
        include: { user: true },
      });

      if (!existingProfessional) {
        throw new Error('Profesional no encontrado en esta clínica');
      }

      // Preparar datos para actualizar el profesional
      const professionalData: any = {};
      if (dto.name) professionalData.name = dto.name;
      if (dto.defaultDurationMin !== undefined) professionalData.defaultDurationMin = dto.defaultDurationMin;
      if (dto.bufferMin !== undefined) professionalData.bufferMin = dto.bufferMin;
      if (dto.notes !== undefined) professionalData.notes = dto.notes;

      // Preparar datos para actualizar el usuario
      const userData: any = {};
      if (dto.email) userData.email = dto.email;
      if (dto.phone) userData.phone = dto.phone;

      // Actualizar el profesional
      const updatedProfessional = await this.prisma.professional.update({
        where: { id },
        data: professionalData,
        include: { user: true },
      });

      // Actualizar sucursal si se proporciona
      if (dto.sucursal !== undefined) {
        console.log('🔍 Actualizando sucursal en update con ID:', dto.sucursal);
        await this.prisma.$executeRaw`
          UPDATE "Professional" 
          SET "sucursalId" = ${dto.sucursal} 
          WHERE id = ${id}
        `;
        console.log('✅ Sucursal actualizada exitosamente en update');
      } else {
        console.log('⚠️ No se proporcionó sucursal en el DTO de update');
      }

      // Actualizar especialidades si se proporcionan
      if (dto.specialties && dto.specialties.length > 0) {
        console.log('🔍 Actualizando especialidades:', dto.specialties);
        
        try {
          // Buscar las especialidades por nombre
          const especialidades = await this.prisma.especialidad.findMany({
            where: {
              name: { in: dto.specialties },
              clinicaId: clinica.id
            }
          });

          console.log('🔍 Especialidades encontradas:', especialidades);

          if (especialidades.length > 0) {
            // Obtener especialidades actuales del profesional
            const especialidadesActuales = await this.prisma.professionalEspecialidad.findMany({
              where: { professionalId: id },
              include: { especialidad: true }
            });

            console.log('🔍 Especialidades actuales:', especialidadesActuales.map(esp => esp.especialidad.name));

            // Filtrar especialidades que ya existen
            const especialidadesExistentes = especialidadesActuales.filter(esp => 
              dto.specialties!.includes(esp.especialidad.name)
            );

            console.log('🔍 Especialidades que ya existen:', especialidadesExistentes.map(esp => esp.especialidad.name));

            // Filtrar especialidades nuevas a agregar
            const especialidadesNuevas = especialidades.filter(esp => 
              !especialidadesActuales.some(espExistente => espExistente.especialidadId === esp.id)
            );

            console.log('🔍 Especialidades nuevas a agregar:', especialidadesNuevas.map(esp => esp.name));

            if (especialidadesNuevas.length > 0) {
              // Crear solo las nuevas relaciones ProfessionalEspecialidad
              const especialidadesData = especialidadesNuevas.map(esp => ({
                professionalId: id,
                especialidadId: esp.id
              }));

              console.log('🔍 Creando nuevas relaciones:', especialidadesData);
              await this.prisma.professionalEspecialidad.createMany({
                data: especialidadesData
              });
              console.log('✅ Nuevas especialidades agregadas:', especialidadesNuevas.map(e => e.name));
            } else {
              console.log('✅ Todas las especialidades ya existen');
            }
          } else {
            console.log('⚠️ No se encontraron especialidades para asignar');
          }
        } catch (error) {
          console.error('❌ Error actualizando especialidades:', error);
          console.error('❌ Stack trace:', error.stack);
          throw new Error(`Error actualizando especialidades: ${error.message}`);
        }
      }

      // Actualizar tratamientos si se proporcionan
      if (dto.tratamientos && dto.tratamientos.length > 0) {
        console.log('🔍 Actualizando tratamientos:', dto.tratamientos);
        
        try {
          // Buscar los tratamientos por nombre
          const tratamientos = await this.prisma.tratamiento.findMany({
            where: {
              name: { in: dto.tratamientos },
              clinicaId: clinica.id
            }
          });

          if (tratamientos.length > 0) {
            // Obtener tratamientos actuales del profesional
            const tratamientosActuales = await this.prisma.professionalTratamiento.findMany({
              where: { professionalId: id },
              include: { tratamiento: true }
            });

            console.log('🔍 Tratamientos actuales:', tratamientosActuales.map(trat => trat.tratamiento.name));

            // Filtrar tratamientos que ya existen
            const tratamientosExistentes = tratamientosActuales.filter(trat => 
              dto.tratamientos!.includes(trat.tratamiento.name)
            );

            console.log('🔍 Tratamientos que ya existen:', tratamientosExistentes.map(trat => trat.tratamiento.name));

            // Filtrar tratamientos nuevos a agregar
            const tratamientosNuevos = tratamientos.filter(trat => 
              !tratamientosActuales.some(tratExistente => tratExistente.tratamientoId === trat.id)
            );

            console.log('🔍 Tratamientos nuevos a agregar:', tratamientosNuevos.map(trat => trat.name));

            if (tratamientosNuevos.length > 0) {
              // Crear solo las nuevas relaciones ProfessionalTratamiento
              const tratamientosData = tratamientosNuevos.map(trat => ({
                professionalId: id,
                tratamientoId: trat.id,
                precio: trat.precio,
                duracionMin: trat.duracionMin
              }));

              await this.prisma.professionalTratamiento.createMany({
                data: tratamientosData
              });
              console.log('✅ Nuevos tratamientos agregados:', tratamientosNuevos.map(t => t.name));
            } else {
              console.log('✅ Todos los tratamientos ya existen');
            }
          } else {
            console.log('⚠️ No se encontraron tratamientos para asignar');
          }
        } catch (error) {
          console.error('❌ Error actualizando tratamientos:', error);
          throw new Error(`Error actualizando tratamientos: ${error.message}`);
        }
      }

      // Actualizar horarios si se proporcionan
      if (dto.horariosDetallados && dto.horariosDetallados.length > 0) {
        // Formato avanzado: horarios específicos por día
        // Eliminar horarios existentes
        await this.prisma.agenda.deleteMany({
          where: { professionalId: id },
        });

        // Crear nuevos horarios detallados
        const horariosData = dto.horariosDetallados.map(horario => ({
          professionalId: id,
          dia: horario.dia.toUpperCase(),
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          duracionMin: dto.defaultDurationMin ?? 30,
        }));

        await this.prisma.agenda.createMany({
          data: horariosData,
        });
      } else if (dto.horarios && dto.horarios.dias && dto.horarios.dias.length > 0) {
        // Formato simple: mismo horario para todos los días
        // Eliminar horarios existentes
        await this.prisma.agenda.deleteMany({
          where: { professionalId: id },
        });

        // Crear nuevos horarios simples
        const horariosData = dto.horarios.dias.map(dia => ({
          professionalId: id,
          dia: dia.toUpperCase(),
          horaInicio: dto.horarios?.horaInicio || '08:00',
          horaFin: dto.horarios?.horaFin || '18:00',
          duracionMin: dto.defaultDurationMin ?? 30,
        }));

        await this.prisma.agenda.createMany({
          data: horariosData,
        });
      }

      // Actualizar el usuario si hay datos de usuario
      if (Object.keys(userData).length > 0) {
        await this.prisma.user.update({
          where: { id: existingProfessional.user.id },
          data: userData,
        });

        // Obtener el profesional actualizado con todos los datos para retornar el formato unificado
        const finalProfessional = await this.prisma.professional.findUnique({
          where: { id },
          include: { 
            user: true,
            agendas: {
              orderBy: {
                dia: 'asc',
              },
            },
            especialidades: {
              include: {
                especialidad: true
              }
            },
            tratamientos: {
              include: {
                tratamiento: true
              }
            }
          },
        });

        // Transformar los horarios al formato esperado por el frontend
        const horariosDetallados = (finalProfessional as any).agendas?.map((agenda: any) => ({
          dia: agenda.dia,
          horaInicio: agenda.horaInicio,
          horaFin: agenda.horaFin,
        })) || [];

        // Transformar especialidades al formato esperado
        const specialties = (finalProfessional as any).especialidades?.map((esp: any) => esp.especialidad.name) || [];

        // Transformar tratamientos al formato esperado
        const tratamientos = (finalProfessional as any).tratamientos?.map((trat: any) => trat.tratamiento.name) || [];

        // Construir la respuesta con el formato unificado
        const response = {
          ...finalProfessional,
          horariosDetallados,
          specialties,
          tratamientos,
          sucursal: (finalProfessional as any).sucursalId || null,
        };

        return {
          success: true,
          data: response,
          message: 'Profesional actualizado exitosamente',
        };
      }

      // Obtener el profesional actualizado con todos los datos para retornar el formato unificado
      const finalProfessional = await this.prisma.professional.findUnique({
        where: { id },
        include: { 
          user: true,
          agendas: {
            orderBy: {
              dia: 'asc',
            },
          },
          especialidades: {
            include: {
              especialidad: true
            }
          },
          tratamientos: {
            include: {
              tratamiento: true
            }
          }
        },
      });

      // Transformar los horarios al formato esperado por el frontend
      const horariosDetallados = (finalProfessional as any).agendas?.map((agenda: any) => ({
        dia: agenda.dia,
        horaInicio: agenda.horaInicio,
        horaFin: agenda.horaFin,
      })) || [];

      // Transformar especialidades al formato esperado
      const specialties = (finalProfessional as any).especialidades?.map((esp: any) => esp.especialidad.name) || [];

      // Transformar tratamientos al formato esperado
      const tratamientos = (finalProfessional as any).tratamientos?.map((trat: any) => trat.tratamiento.name) || [];

      // Construir la respuesta con el formato unificado
      const response = {
        ...finalProfessional,
        horariosDetallados,
        specialties,
        tratamientos,
        sucursal: (finalProfessional as any).sucursalId || null,
      };

      return {
        success: true,
        data: response,
        message: 'Profesional actualizado exitosamente',
      };
    } catch (error) {
      console.error('Error actualizando profesional:', error);
      throw error;
    }
  }

  async remove(clinicaUrl: string, id: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new Error('Clínica no encontrada');
    }

    // Verificar que el profesional pertenece a la clínica
    const professional = await this.prisma.professional.findFirst({
      where: {
        id,
        user: {
          clinicaId: clinica.id,
        },
      },
      include: {
        user: true,
        agendas: true,
      },
    });

    if (!professional) {
      throw new Error('Profesional no encontrado en esta clínica');
    }

    // Eliminar agendas asociadas
    if (professional.agendas.length > 0) {
      await this.prisma.agenda.deleteMany({
        where: { professionalId: id },
      });
    }

    // Eliminar el profesional y su usuario asociado
    await this.prisma.professional.delete({
      where: { id },
    });

    await this.prisma.user.delete({
      where: { id: professional.user.id },
    });

    return { 
      success: true,
      message: 'Profesional eliminado correctamente',
    };
  }
}
