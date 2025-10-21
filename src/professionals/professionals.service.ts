import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessionalDto, ProfessionalSucursalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { EmailService } from '../email/email.service';
import { PasswordGenerator } from '../common/utils/password-generator';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfessionalsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async findAll(clinicaUrl: string) {
    try {
      console.log(`🔍 [${new Date().toISOString()}] Iniciando consulta de profesionales para: ${clinicaUrl}`);
      
      // 1. Verificar clínica (consulta simple y rápida)
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
        select: { id: true, name: true }
      });

      if (!clinica) {
        console.log(`❌ Clínica no encontrada: ${clinicaUrl}`);
        throw new NotFoundException('Clínica no encontrada');
      }

      console.log(`✅ [${new Date().toISOString()}] Clínica encontrada: ${clinica.name}`);

      // 2. Obtener profesionales básicos (sin relaciones complejas)
      const professionals = await this.prisma.professional.findMany({
        where: { user: { clinicaId: clinica.id } },
        include: { 
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              role: true,
              createdAt: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      console.log(`✅ [${new Date().toISOString()}] Profesionales básicos obtenidos: ${professionals.length}`);

      // Si no hay profesionales, retornar array vacío
      if (professionals.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No se encontraron profesionales',
        };
      }

      // 3. Obtener IDs para consultas paralelas
      const professionalIds = professionals.map(p => p.id);
      console.log(`🔍 [${new Date().toISOString()}] IDs de profesionales: ${professionalIds.length}`);

      // 4. Consultas paralelas optimizadas
      const [agendas, especialidades, tratamientos, professionalSucursales] = await Promise.all([
        // Agendas - consulta optimizada
        this.prisma.agenda.findMany({
          where: { professionalId: { in: professionalIds } },
          select: {
            professionalId: true,
            dia: true,
            horaInicio: true,
            horaFin: true
          },
          orderBy: [
            { professionalId: 'asc' },
            { dia: 'asc' }
          ]
        }),
        
        // Especialidades - consulta optimizada
        this.prisma.professionalEspecialidad.findMany({
          where: { professionalId: { in: professionalIds } },
          select: {
            professionalId: true,
            especialidad: {
              select: {
                name: true
              }
            }
          }
        }),
        
        // Tratamientos - consulta optimizada
        this.prisma.professionalTratamiento.findMany({
          where: { professionalId: { in: professionalIds } },
          select: {
            professionalId: true,
            tratamiento: {
              select: {
                name: true
              }
            }
          }
        }),

        // Sucursales - consulta optimizada
        this.prisma.professionalSucursal.findMany({
          where: { 
            professionalId: { in: professionalIds },
            activo: true 
          },
          select: {
            professionalId: true,
            sucursalId: true,
            activo: true,
            fechaInicio: true,
            fechaFin: true,
            notas: true,
            sucursal: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
                telefono: true,
                email: true,
                estado: true,
              }
            }
          }
        })
      ]);

      console.log(`✅ [${new Date().toISOString()}] Datos relacionados obtenidos - Agendas: ${agendas.length}, Especialidades: ${especialidades.length}, Tratamientos: ${tratamientos.length}, Sucursales: ${professionalSucursales.length}`);

      // 5. Formatear datos de manera eficiente
      const profesionalesTransformados = professionals.map(prof => {
        // Filtrar y mapear agendas - formato agrupado por día
        const agendasDelProfesional = agendas.filter(agenda => agenda.professionalId === prof.id);
        const horariosAgrupados: any = {};
        
        agendasDelProfesional.forEach(agenda => {
          if (!horariosAgrupados[agenda.dia]) {
            horariosAgrupados[agenda.dia] = [];
          }
          horariosAgrupados[agenda.dia].push({
            horaInicio: agenda.horaInicio,
            horaFin: agenda.horaFin,
          });
        });

        // Convertir a formato esperado por el frontend
        const horariosDetallados = Object.keys(horariosAgrupados).map(dia => ({
          dia: dia,
          rangos: horariosAgrupados[dia]
        }));

        // Filtrar y mapear especialidades
        const specialties = especialidades
          .filter(esp => esp.professionalId === prof.id)
          .map(esp => esp.especialidad.name);

        // Filtrar y mapear tratamientos
        const tratamientosProf = tratamientos
          .filter(trat => trat.professionalId === prof.id)
          .map(trat => trat.tratamiento.name);

        // Filtrar y mapear sucursales
        const sucursalesProf = professionalSucursales
          .filter(ps => ps.professionalId === prof.id)
          .map(ps => ({
            id: ps.sucursal.id,
            nombre: ps.sucursal.nombre,
            direccion: ps.sucursal.direccion,
            telefono: ps.sucursal.telefono,
            email: ps.sucursal.email,
            estado: ps.sucursal.estado,
            activo: ps.activo,
            fechaInicio: ps.fechaInicio,
            fechaFin: ps.fechaFin,
            notas: ps.notas,
          }));

        return {
          ...prof,
          horariosDetallados,
          specialties,
          tratamientos: tratamientosProf,
          sucursal: (prof as any).sucursalId || null, // Compatibilidad hacia atrás
          sucursales: sucursalesProf, // Nueva funcionalidad
        };
      });

      console.log(`✅ [${new Date().toISOString()}] Profesionales transformados: ${profesionalesTransformados.length}`);

      return {
        success: true,
        data: profesionalesTransformados,
        message: 'Profesionales obtenidos exitosamente',
      };
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Error en findAll profesionales:`, error);
      throw error;
    }
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

      // Generar username automáticamente
      const username = PasswordGenerator.generateUsername(dto.name);
      console.log('✅ Username generado:', username);

      // Generar email automáticamente si ya existe
      let emailToUse = dto.email;
      const existingUser = await this.prisma.user.findFirst({
        where: { 
          email: dto.email,
          clinicaId: clinica.id
        },
      });

      if (existingUser) {
        // Si el email ya existe, generar uno automático
        emailToUse = PasswordGenerator.generateEmail(dto.name, clinica.name);
        console.log(`📧 Email ${dto.email} ya existe, generando automático: ${emailToUse}`);
      }

      console.log('🔍 Creando usuario...');
      console.log('🔍 Datos del usuario:', {
        email: emailToUse,
        username: username,
        role: 'PROFESSIONAL',
        name: dto.name,
        phone: dto.phone,
        clinicaId: clinica.id,
      });
      
      const user = await this.prisma.user.create({
        data: {
          email: emailToUse,
          username: username,
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
        console.log(`📧 Enviando email de bienvenida a ${emailToUse}...`);
        
        const emailSent = await this.emailService.sendWelcomeCredentialsEmail(
          emailToUse, // Usar el email final (puede ser el original o el generado)
          dto.password, // Usar la contraseña original (antes del hash)
          dto.name,
          'PROFESSIONAL',
          clinica.name,
          username // Agregar el username generado
        );

        if (emailSent) {
          console.log(`✅ Email de bienvenida enviado exitosamente a ${emailToUse}`);
          emailResult = { success: true };
        } else {
          console.error(`❌ Error al enviar email de bienvenida a ${emailToUse}`);
          emailResult = { success: false, error: 'Error al enviar email' };
        }
      } catch (emailError) {
        console.error(`❌ Error inesperado al enviar email de bienvenida a ${emailToUse}:`, emailError);
        emailResult = { success: false, error: emailError.message || 'Error inesperado' };
      }

      // MensAPI integration removed - not needed for new user system

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
            duracionMin: trat.duracionPorSesion
          }));

          await this.prisma.professionalTratamiento.createMany({
            data: tratamientosData
          });
          console.log('✅ Tratamientos asignados:', tratamientos.map(t => t.name));
        } else {
          console.log('⚠️ No se encontraron tratamientos para asignar');
        }
      }

      // Manejar sucursales (compatibilidad hacia atrás + nueva funcionalidad)
      if (dto.sucursales && dto.sucursales.length > 0) {
        console.log('🔍 Creando relaciones con múltiples sucursales:', dto.sucursales.length);
        
        // Crear relaciones ProfessionalSucursal
        for (const sucursalData of dto.sucursales) {
          // Validar que la sucursal existe
          const sucursal = await this.prisma.sucursal.findUnique({
            where: { id: sucursalData.sucursalId }
          });

          if (!sucursal) {
            console.log(`⚠️ Sucursal con ID ${sucursalData.sucursalId} no encontrada, saltando...`);
            continue;
          }

          // Crear la relación ProfessionalSucursal
          const professionalSucursal = await this.prisma.professionalSucursal.create({
            data: {
              professionalId: professional.id,
              sucursalId: sucursalData.sucursalId,
              fechaInicio: sucursalData.fechaInicio ? new Date(sucursalData.fechaInicio) : null,
              fechaFin: sucursalData.fechaFin ? new Date(sucursalData.fechaFin) : null,
              notas: sucursalData.notas,
            }
          });

          // Crear horarios específicos para esta sucursal si se proporcionan
          if (sucursalData.horariosDetallados && sucursalData.horariosDetallados.length > 0) {
            console.log(`🔍 Creando horarios específicos para sucursal ${sucursalData.sucursalId}`);
            
            const horariosPorSucursal = sucursalData.horariosDetallados.map(horario => ({
              professionalId: professional.id,
              professionalSucursalId: professionalSucursal.id,
              dia: horario.dia.toUpperCase(),
              horaInicio: horario.horaInicio,
              horaFin: horario.horaFin,
              duracionMin: dto.defaultDurationMin ?? 30,
            }));

            await this.prisma.agenda.createMany({
              data: horariosPorSucursal,
            });
            console.log(`✅ Horarios específicos creados para sucursal ${sucursalData.sucursalId}`);
          }
        }
      } else if (dto.sucursal) {
        // Compatibilidad hacia atrás: manejar campo sucursal único
        console.log('🔍 Actualizando sucursal única con ID:', dto.sucursal);
        
        // Validar que la sucursal existe
        const sucursal = await this.prisma.sucursal.findUnique({
          where: { id: dto.sucursal }
        });

        if (sucursal) {
          // Actualizar el campo sucursalId para compatibilidad
          await this.prisma.professional.update({
            where: { id: professional.id },
            data: { sucursalId: dto.sucursal }
          });

          // También crear la relación ProfessionalSucursal para la nueva funcionalidad
          await this.prisma.professionalSucursal.create({
            data: {
              professionalId: professional.id,
              sucursalId: dto.sucursal,
            }
          });
          console.log('✅ Sucursal única actualizada exitosamente');
        } else {
          console.log('⚠️ Sucursal con ID proporcionado no encontrada');
        }
      } else {
        console.log('⚠️ No se proporcionaron sucursales en el DTO');
      }

      // Crear horarios de atención si se proporcionan
      if (dto.horariosMultiRango && dto.horariosMultiRango.length > 0) {
        // Formato multi-rango: múltiples rangos por día
        console.log('🔍 Creando horarios multi-rango...');
        const horariosData: any[] = [];
        
        dto.horariosMultiRango.forEach(horarioDia => {
          horarioDia.rangos.forEach(rango => {
            horariosData.push({
              professionalId: professional.id,
              dia: horarioDia.dia.toUpperCase(),
              horaInicio: rango.horaInicio,
              horaFin: rango.horaFin,
              duracionMin: dto.defaultDurationMin ?? 30,
            });
          });
        });

        await this.prisma.agenda.createMany({
          data: horariosData,
        });
        console.log('✅ Horarios multi-rango creados');
      } else if (dto.horariosDetallados && dto.horariosDetallados.length > 0) {
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

      // Transformar los horarios al formato agrupado por día
      const agendas = (profesionalCompleto as any).agendas || [];
      const horariosAgrupados: any = {};
      
      agendas.forEach((agenda: any) => {
        if (!horariosAgrupados[agenda.dia]) {
          horariosAgrupados[agenda.dia] = [];
        }
        horariosAgrupados[agenda.dia].push({
          horaInicio: agenda.horaInicio,
          horaFin: agenda.horaFin,
        });
      });

      // Convertir a formato esperado por el frontend
      const horariosDetallados = Object.keys(horariosAgrupados).map(dia => ({
        dia: dia,
        rangos: horariosAgrupados[dia]
      }));

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
        emailGenerado: emailToUse !== dto.email,
        emailOriginal: dto.email,
        emailFinal: emailToUse,
        // MensAPI integration removed
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
          include: {
            professionalSucursal: {
              include: {
                sucursal: {
                  select: {
                    id: true,
                    nombre: true,
                  }
                }
              }
            }
          },
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
        },
        professionalSucursales: {
          include: {
            sucursal: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
                telefono: true,
                email: true,
                estado: true,
              }
            },
            agendas: {
              orderBy: {
                dia: 'asc',
              }
            }
          },
          where: {
            activo: true
          }
        },
        sucursal: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            telefono: true,
            email: true,
            estado: true,
          }
        }
      },
    });

    if (!prof) throw new NotFoundException('Profesional no encontrado');

    // Transformar los horarios al formato agrupado por día
    const agendas = (prof as any).agendas || [];
    const horariosAgrupados: any = {};
    
    agendas.forEach((agenda: any) => {
      if (!horariosAgrupados[agenda.dia]) {
        horariosAgrupados[agenda.dia] = [];
      }
      
      // Agregar información de la sucursal si existe
      const rango = {
        horaInicio: agenda.horaInicio,
        horaFin: agenda.horaFin,
      };

      // Si la agenda está asociada a una sucursal específica, incluir esa información
      if (agenda.professionalSucursal) {
        (rango as any).sucursal = {
          id: agenda.professionalSucursal.sucursal.id,
          nombre: agenda.professionalSucursal.sucursal.nombre
        };
      }

      horariosAgrupados[agenda.dia].push(rango);
    });

    // Convertir a formato esperado por el frontend
    const horariosDetallados = Object.keys(horariosAgrupados).map(dia => ({
      dia: dia,
      rangos: horariosAgrupados[dia]
    }));

    // Transformar especialidades al formato esperado
    const specialties = (prof as any).especialidades?.map((esp: any) => esp.especialidad.name) || [];

    // Transformar tratamientos al formato esperado
    const tratamientos = (prof as any).tratamientos?.map((trat: any) => trat.tratamiento.name) || [];

    // Transformar sucursales múltiples
    const sucursales = (prof as any).professionalSucursales?.map((ps: any) => ({
      id: ps.sucursal.id,
      nombre: ps.sucursal.nombre,
      direccion: ps.sucursal.direccion,
      telefono: ps.sucursal.telefono,
      email: ps.sucursal.email,
      estado: ps.sucursal.estado,
      activo: ps.activo,
      fechaInicio: ps.fechaInicio,
      fechaFin: ps.fechaFin,
      notas: ps.notas,
      horarios: ps.agendas?.map((agenda: any) => ({
        dia: agenda.dia,
        horaInicio: agenda.horaInicio,
        horaFin: agenda.horaFin
      })) || []
    })) || [];

    // Construir la respuesta con el formato unificado
    const response = {
      ...prof,
      horariosDetallados,
      specialties,
      tratamientos,
      sucursal: (prof as any).sucursalId || null, // Mantener compatibilidad
      sucursales: sucursales, // Nueva funcionalidad
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
                duracionMin: trat.duracionPorSesion
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

      // Actualizar sucursales si se proporcionan
      if (dto.sucursales && dto.sucursales.length > 0) {
        console.log('🔍 Actualizando múltiples sucursales:', dto.sucursales.length);
        
        try {
          // Obtener relaciones actuales
          const professionalSucursalesActuales = await this.prisma.professionalSucursal.findMany({
            where: { professionalId: id },
            include: { sucursal: true }
          });

          // Para cada sucursal en el DTO
          for (const sucursalData of dto.sucursales) {
            // Validar que la sucursal existe
            const sucursal = await this.prisma.sucursal.findUnique({
              where: { id: sucursalData.sucursalId }
            });

            if (!sucursal) {
              console.log(`⚠️ Sucursal con ID ${sucursalData.sucursalId} no encontrada, saltando...`);
              continue;
            }

            // Buscar si ya existe la relación
            const existingRel = professionalSucursalesActuales.find(
              ps => ps.sucursalId === sucursalData.sucursalId
            );

            let professionalSucursalId: string;

            if (existingRel) {
              // Actualizar relación existente
              const updatedRel = await this.prisma.professionalSucursal.update({
                where: { id: existingRel.id },
                data: {
                  fechaInicio: sucursalData.fechaInicio ? new Date(sucursalData.fechaInicio) : existingRel.fechaInicio,
                  fechaFin: sucursalData.fechaFin ? new Date(sucursalData.fechaFin) : existingRel.fechaFin,
                  notas: sucursalData.notas || existingRel.notas,
                  activo: true, // Reactivar si estaba desactivado
                }
              });
              professionalSucursalId = updatedRel.id;
              console.log(`✅ Relación existente actualizada para sucursal ${sucursalData.sucursalId}`);
            } else {
              // Crear nueva relación
              const newRel = await this.prisma.professionalSucursal.create({
                data: {
                  professionalId: id,
                  sucursalId: sucursalData.sucursalId,
                  fechaInicio: sucursalData.fechaInicio ? new Date(sucursalData.fechaInicio) : new Date(),
                  fechaFin: sucursalData.fechaFin ? new Date(sucursalData.fechaFin) : null,
                  notas: sucursalData.notas,
                }
              });
              professionalSucursalId = newRel.id;
              console.log(`✅ Nueva relación creada para sucursal ${sucursalData.sucursalId}`);
            }

            // Manejar horarios para esta sucursal específica
            if (sucursalData.horariosDetallados && sucursalData.horariosDetallados.length > 0) {
              console.log(`🔍 Actualizando horarios detallados para sucursal ${sucursalData.sucursalId}`);
              
              // Eliminar horarios existentes de esta sucursal específica
              await this.prisma.agenda.deleteMany({
                where: { 
                  professionalId: id,
                  professionalSucursalId: professionalSucursalId 
                }
              });

              // Crear nuevos horarios específicos para esta sucursal
              const horariosPorSucursal = sucursalData.horariosDetallados.map(horario => ({
                professionalId: id,
                professionalSucursalId: professionalSucursalId,
                dia: horario.dia.toUpperCase(),
                horaInicio: horario.horaInicio,
                horaFin: horario.horaFin,
                duracionMin: dto.defaultDurationMin ?? updatedProfessional.defaultDurationMin ?? 30,
              }));

              await this.prisma.agenda.createMany({
                data: horariosPorSucursal,
              });
              console.log(`✅ Horarios detallados actualizados para sucursal ${sucursalData.sucursalId}: ${horariosPorSucursal.length} horarios`);
            // } 
            // else if (sucursalData.horariosMultiRango && sucursalData.horariosMultiRango.length > 0) {
            //   console.log(`🔍 Actualizando horarios multi-rango para sucursal ${sucursalData.sucursalId}`);
              
            //   // Eliminar horarios existentes de esta sucursal específica
            //   await this.prisma.agenda.deleteMany({
            //     where: { 
            //       professionalId: id,
            //       professionalSucursalId: professionalSucursalId 
            //     }
            //   });

            //   // Crear nuevos horarios multi-rango para esta sucursal
            //   const horariosPorSucursal: any[] = [];
              
            //   sucursalData.horariosMultiRango.forEach(horarioDia => {
            //     horarioDia.rangos.forEach(rango => {
            //       horariosPorSucursal.push({
            //         professionalId: id,
            //         professionalSucursalId: professionalSucursalId,
            //         dia: horarioDia.dia.toUpperCase(),
            //         horaInicio: rango.horaInicio,
            //         horaFin: rango.horaFin,
            //         duracionMin: dto.defaultDurationMin ?? updatedProfessional.defaultDurationMin ?? 30,
            //       });
            //     });
            //   });

            //   await this.prisma.agenda.createMany({
            //     data: horariosPorSucursal,
            //   });
            //   console.log(`✅ Horarios multi-rango actualizados para sucursal ${sucursalData.sucursalId}: ${horariosPorSucursal.length} horarios`);
            } else {
              console.log(`⚠️ No se proporcionaron horariosDetallados ni horariosMultiRango para sucursal ${sucursalData.sucursalId}`);
            }
          }
        } catch (error) {
          console.error('❌ Error actualizando sucursales:', error);
          throw new Error(`Error actualizando sucursales: ${error.message}`);
        }
      }

      // Actualizar horarios si se proporcionan
      if (dto.horariosMultiRango && dto.horariosMultiRango.length > 0) {
        // Formato multi-rango: múltiples rangos por día
        console.log('🔍 Actualizando horarios multi-rango...');
        
        // Eliminar horarios existentes
        await this.prisma.agenda.deleteMany({
          where: { professionalId: id },
        });

        // Crear nuevos horarios multi-rango
        const horariosData: any[] = [];
        
        dto.horariosMultiRango.forEach(horarioDia => {
          horarioDia.rangos.forEach(rango => {
            horariosData.push({
              professionalId: id,
              dia: horarioDia.dia.toUpperCase(),
              horaInicio: rango.horaInicio,
              horaFin: rango.horaFin,
              duracionMin: dto.defaultDurationMin ?? 30,
            });
          });
        });

        await this.prisma.agenda.createMany({
          data: horariosData,
        });
        console.log('✅ Horarios multi-rango actualizados');
      } else if (dto.horariosDetallados && dto.horariosDetallados.length > 0) {
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
              include: {
                professionalSucursal: {
                  include: {
                    sucursal: {
                      select: {
                        id: true,
                        nombre: true,
                      }
                    }
                  }
                }
              },
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
            },
            professionalSucursales: {
              include: {
                sucursal: {
                  select: {
                    id: true,
                    nombre: true,
                    direccion: true,
                    telefono: true,
                    email: true,
                    estado: true,
                  }
                },
                agendas: {
                  orderBy: {
                    dia: 'asc',
                  }
                }
              },
              where: {
                activo: true
              }
            },
            sucursal: {
              select: {
                id: true,
                nombre: true,
                direccion: true,
                telefono: true,
                email: true,
                estado: true,
              }
            }
          },
        });

        // Transformar los horarios al formato agrupado por día
        const agendas = (finalProfessional as any).agendas || [];
        const horariosAgrupados: any = {};
        
        agendas.forEach((agenda: any) => {
          if (!horariosAgrupados[agenda.dia]) {
            horariosAgrupados[agenda.dia] = [];
          }
          horariosAgrupados[agenda.dia].push({
            horaInicio: agenda.horaInicio,
            horaFin: agenda.horaFin,
          });
        });

        // Convertir a formato esperado por el frontend
        const horariosDetallados = Object.keys(horariosAgrupados).map(dia => ({
          dia: dia,
          rangos: horariosAgrupados[dia]
        }));

        // Transformar especialidades al formato esperado
        const specialties = (finalProfessional as any).especialidades?.map((esp: any) => esp.especialidad.name) || [];

        // Transformar tratamientos al formato esperado
        const tratamientos = (finalProfessional as any).tratamientos?.map((trat: any) => trat.tratamiento.name) || [];

        // Transformar sucursales múltiples
        const sucursales = (finalProfessional as any).professionalSucursales?.map((ps: any) => ({
          id: ps.sucursal.id,
          nombre: ps.sucursal.nombre,
          direccion: ps.sucursal.direccion,
          telefono: ps.sucursal.telefono,
          email: ps.sucursal.email,
          estado: ps.sucursal.estado,
          activo: ps.activo,
          fechaInicio: ps.fechaInicio,
          fechaFin: ps.fechaFin,
          notas: ps.notas,
          horarios: ps.agendas?.map((agenda: any) => ({
            dia: agenda.dia,
            horaInicio: agenda.horaInicio,
            horaFin: agenda.horaFin
          })) || []
        })) || [];

        // Construir la respuesta con el formato unificado
        const response = {
          ...finalProfessional,
          horariosDetallados,
          specialties,
          tratamientos,
          sucursal: (finalProfessional as any).sucursalId || null, // Mantener compatibilidad
          sucursales: sucursales, // Nueva funcionalidad
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
            include: {
              professionalSucursal: {
                include: {
                  sucursal: {
                    select: {
                      id: true,
                      nombre: true,
                    }
                  }
                }
              }
            },
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
          },
          professionalSucursales: {
            include: {
              sucursal: {
                select: {
                  id: true,
                  nombre: true,
                  direccion: true,
                  telefono: true,
                  email: true,
                  estado: true,
                }
              },
              agendas: {
                orderBy: {
                  dia: 'asc',
                }
              }
            },
            where: {
              activo: true
            }
          },
          sucursal: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
              telefono: true,
              email: true,
              estado: true,
            }
          }
        },
      });

      // Transformar los horarios al formato agrupado por día
      const agendas = (finalProfessional as any).agendas || [];
      const horariosAgrupados: any = {};
      
      agendas.forEach((agenda: any) => {
        if (!horariosAgrupados[agenda.dia]) {
          horariosAgrupados[agenda.dia] = [];
        }
        horariosAgrupados[agenda.dia].push({
          horaInicio: agenda.horaInicio,
          horaFin: agenda.horaFin,
        });
      });

      // Convertir a formato esperado por el frontend
      const horariosDetallados = Object.keys(horariosAgrupados).map(dia => ({
        dia: dia,
        rangos: horariosAgrupados[dia]
      }));

      // Transformar especialidades al formato esperado
      const specialties = (finalProfessional as any).especialidades?.map((esp: any) => esp.especialidad.name) || [];

      // Transformar tratamientos al formato esperado
      const tratamientos = (finalProfessional as any).tratamientos?.map((trat: any) => trat.tratamiento.name) || [];

      // Transformar sucursales múltiples
      const sucursales = (finalProfessional as any).professionalSucursales?.map((ps: any) => ({
        id: ps.sucursal.id,
        nombre: ps.sucursal.nombre,
        direccion: ps.sucursal.direccion,
        telefono: ps.sucursal.telefono,
        email: ps.sucursal.email,
        estado: ps.sucursal.estado,
        activo: ps.activo,
        fechaInicio: ps.fechaInicio,
        fechaFin: ps.fechaFin,
        notas: ps.notas,
        horarios: ps.agendas?.map((agenda: any) => ({
          dia: agenda.dia,
          horaInicio: agenda.horaInicio,
          horaFin: agenda.horaFin
        })) || []
      })) || [];

      // Construir la respuesta con el formato unificado
      const response = {
        ...finalProfessional,
        horariosDetallados,
        specialties,
        tratamientos,
        sucursal: (finalProfessional as any).sucursalId || null, // Mantener compatibilidad
        sucursales: sucursales, // Nueva funcionalidad
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

  // ===== NUEVOS MÉTODOS PARA GESTIONAR SUCURSALES =====

  /**
   * Agregar una sucursal a un profesional
   */
  async addSucursalToProfessional(
    professionalId: string, 
    sucursalId: string, 
    fechaInicio?: string, 
    notas?: string
  ) {
    try {
      // Verificar que el profesional existe
      const professional = await this.prisma.professional.findUnique({
        where: { id: professionalId }
      });

      if (!professional) {
        throw new NotFoundException('Profesional no encontrado');
      }

      // Verificar que la sucursal existe
      const sucursal = await this.prisma.sucursal.findUnique({
        where: { id: sucursalId }
      });

      if (!sucursal) {
        throw new NotFoundException('Sucursal no encontrada');
      }

      // Crear la relación
      const professionalSucursal = await this.prisma.professionalSucursal.create({
        data: {
          professionalId,
          sucursalId,
          fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
          notas,
        },
        include: {
          sucursal: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
              telefono: true,
              email: true,
            }
          }
        }
      });

      return {
        success: true,
        data: professionalSucursal,
        message: 'Sucursal agregada al profesional exitosamente',
      };
    } catch (error) {
      console.error('Error agregando sucursal al profesional:', error);
      throw error;
    }
  }

  /**
   * Remover una sucursal de un profesional (desactivar relación)
   */
  async removeSucursalFromProfessional(
    professionalId: string, 
    sucursalId: string,
    fechaFin?: string,
    notas?: string
  ) {
    try {
      const professionalSucursal = await this.prisma.professionalSucursal.findFirst({
        where: {
          professionalId,
          sucursalId,
          activo: true
        }
      });

      if (!professionalSucursal) {
        throw new NotFoundException('Relación profesional-sucursal no encontrada');
      }

      // Desactivar la relación y agregar fecha fin
      const updated = await this.prisma.professionalSucursal.update({
        where: { id: professionalSucursal.id },
        data: {
          activo: false,
          fechaFin: fechaFin ? new Date(fechaFin) : new Date(),
          notas: notas || professionalSucursal.notas,
        },
        include: {
          sucursal: {
            select: {
              id: true,
              nombre: true,
            }
          }
        }
      });

      return {
        success: true,
        data: updated,
        message: 'Sucursal removida del profesional exitosamente',
      };
    } catch (error) {
      console.error('Error removiendo sucursal del profesional:', error);
      throw error;
    }
  }

  /**
   * Obtener sucursales de un profesional
   */
  async getProfessionalSucursales(professionalId: string) {
    try {
      const professionalSucursales = await this.prisma.professionalSucursal.findMany({
        where: { 
          professionalId,
          activo: true 
        },
        include: {
          sucursal: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
              telefono: true,
              email: true,
              estado: true,
            }
          },
          agendas: {
            orderBy: {
              dia: 'asc',
            }
          }
        },
        orderBy: {
          fechaInicio: 'desc'
        }
      });

      const sucursales = professionalSucursales.map(ps => ({
        id: ps.sucursal.id,
        nombre: ps.sucursal.nombre,
        direccion: ps.sucursal.direccion,
        telefono: ps.sucursal.telefono,
        email: ps.sucursal.email,
        estado: ps.sucursal.estado,
        activo: ps.activo,
        fechaInicio: ps.fechaInicio,
        fechaFin: ps.fechaFin,
        notas: ps.notas,
        horarios: ps.agendas?.map(agenda => ({
          dia: agenda.dia,
          horaInicio: agenda.horaInicio,
          horaFin: agenda.horaFin
        })) || []
      }));

      return {
        success: true,
        data: sucursales,
        message: 'Sucursales del profesional obtenidas exitosamente',
      };
    } catch (error) {
      console.error('Error obteniendo sucursales del profesional:', error);
      throw error;
    }
  }
}
