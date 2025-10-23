import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { PasswordGenerator } from '../common/utils/password-generator';

@ApiTags('Profesionales Globales')
@Controller('profesionales')
export class GlobalProfessionalsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los profesionales' })
  @ApiResponse({ status: 200, description: 'Lista de profesionales obtenida exitosamente' })
  @ApiQuery({ name: 'clinicaId', required: false, description: 'Filtrar por clínica' })
  @ApiQuery({ name: 'especialidad', required: false, description: 'Filtrar por especialidad' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findAll(
    @Query('clinicaId') clinicaId?: string,
    @Query('especialidad') especialidad?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const where: any = {};
      if (clinicaId) {
        where.user = {
          clinicaId: clinicaId,
        };
      }
      if (especialidad) {
        where.specialties = {
          has: especialidad,
        };
      }

      const profesionales = await this.prisma.professional.findMany({
        where,
        take: limitNum,
        skip: offsetNum,
        include: {
          user: true,
          agendas: {
            orderBy: {
              dia: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transformar los datos para incluir horariosDetallados y sucursal en el formato esperado
      const profesionalesTransformados = profesionales.map(profesional => {
        const horariosDetallados = (profesional as any).agendas?.map((agenda: any) => ({
          dia: agenda.dia,
          horaInicio: agenda.horaInicio,
          horaFin: agenda.horaFin,
        })) || [];

        return {
          ...profesional,
          horariosDetallados,
          sucursal: (profesional as any).sucursalId || null,
        };
      });

      console.log('🔍 Profesionales encontrados:', profesionales.length);
      console.log('🔍 Profesionales transformados:', profesionalesTransformados.length);

      return {
        success: true,
        data: profesionalesTransformados,
        message: 'Profesionales obtenidos exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.professional.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo profesionales:', error);
      throw new BadRequestException('Error al obtener los profesionales');
    }
  }

  @Get('availability/:clinicaUrl')
  @ApiOperation({ summary: 'Obtener disponibilidad de profesionales por URL de clínica - ENDPOINT SIMPLE' })
  @ApiResponse({ status: 200, description: 'Disponibilidad de profesionales obtenida exitosamente' })
  @ApiQuery({ name: 'fecha', required: false, description: 'Filtrar por fecha específica (YYYY-MM-DD)' })
  @ApiQuery({ name: 'especialidad', required: false, description: 'Filtrar por especialidad' })
  async getProfessionalsAvailabilitySimple(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query('fecha') fecha?: string,
    @Query('especialidad') especialidad?: string,
  ) {
    // Reutilizar la lógica del endpoint existente
    return this.getProfessionalsAvailabilityByUrl(clinicaUrl, fecha, especialidad);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener profesional específico' })
  @ApiResponse({ status: 200, description: 'Profesional obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  async findOne(@Param('id') id: string) {
    try {
      const profesional = await this.prisma.professional.findUnique({
        where: { id },
        include: {
          user: true,
          agendas: {
            orderBy: {
              dia: 'asc',
            },
          },
        },
      });

      if (!profesional) {
        throw new NotFoundException('Profesional no encontrado');
      }

      // Transformar los horarios al formato esperado por el frontend
      const horariosDetallados = (profesional as any).agendas?.map((agenda: any) => ({
        dia: agenda.dia,
        horaInicio: agenda.horaInicio,
        horaFin: agenda.horaFin,
      })) || [];

      // Construir la respuesta con el formato esperado
      const response = {
        ...profesional,
        horariosDetallados,
        sucursal: (profesional as any).sucursalId || null,
      };

      return {
        success: true,
        data: response,
        message: 'Profesional obtenido exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo profesional:', error);
      throw new BadRequestException('Error al obtener el profesional');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo profesional' })
  @ApiResponse({ status: 201, description: 'Profesional creado exitosamente' })
  async create(@Body() createProfesionalDto: any) {
    try {
      console.log('🔍 DTO recibido en create:', JSON.stringify(createProfesionalDto, null, 2));
      console.log('🔍 Campo sucursal recibido:', createProfesionalDto.sucursal);
      
      // Validar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: createProfesionalDto.clinicaId },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(createProfesionalDto.password || 'defaultPassword123', 10);

      // Generar username automáticamente
      const username = PasswordGenerator.generateUsername(createProfesionalDto.name);

      // Crear usuario primero
      const user = await this.prisma.user.create({
        data: {
          email: createProfesionalDto.email,
          username: username, // Agregar el username generado
          password: hashedPassword,
          name: createProfesionalDto.name,
          phone: createProfesionalDto.phone,
          role: 'PROFESSIONAL',
          clinicaId: createProfesionalDto.clinicaId,
        },
      });

      // Hacer POST a la API externa de Fluentia
      console.log('🌐 ===== INICIANDO LLAMADA A API EXTERNA (GLOBAL PROFESSIONALS) =====');
      const startTime = Date.now();
      try {
        const externalApiUrl = 'https://fluentia-api-develop-latest.up.railway.app/auth/register';
        const externalApiData = {
          name: username, // Usar el username generado
          email: createProfesionalDto.email,
          password: createProfesionalDto.password || 'defaultPassword123', // Contraseña en texto plano
        };
        
        console.log('📤 Datos que se enviarán a la API externa (GLOBAL PROFESSIONALS):', JSON.stringify(externalApiData, null, 2));
        console.log('🔗 URL de la API externa:', externalApiUrl);
        console.log('⏱️ Iniciando petición HTTP...');
        
        const externalApiResponse = await axios.post(externalApiUrl, externalApiData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 segundos de timeout
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('✅ ===== LLAMADA A API EXTERNA EXITOSA (GLOBAL PROFESSIONALS) =====');
        console.log('⏱️ Duración de la petición:', `${duration}ms`);
        console.log('📊 Status Code:', externalApiResponse.status);
        console.log('📋 Headers de respuesta:', JSON.stringify(externalApiResponse.headers, null, 2));
        console.log('📄 Datos de respuesta:', JSON.stringify(externalApiResponse.data, null, 2));
        console.log('✅ Profesional global registrado exitosamente en Fluentia API');
        
      } catch (externalApiError) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('❌ ===== ERROR EN LLAMADA A API EXTERNA (GLOBAL PROFESSIONALS) =====');
        console.log('⏱️ Duración antes del error:', `${duration}ms`);
        console.log('🚨 Tipo de error:', externalApiError.name || 'Unknown');
        console.log('📝 Mensaje de error:', externalApiError.message);
        
        if (externalApiError.response) {
          console.log('📊 Status Code de error:', externalApiError.response.status);
          console.log('📋 Headers de error:', JSON.stringify(externalApiError.response.headers, null, 2));
          console.log('📄 Datos de error:', JSON.stringify(externalApiError.response.data, null, 2));
        } else if (externalApiError.request) {
          console.log('🔌 Error de conexión - No se recibió respuesta');
          console.log('📋 Request config:', JSON.stringify(externalApiError.config, null, 2));
        } else {
          console.log('⚙️ Error de configuración:', externalApiError.message);
        }
        
        console.log('⚠️ IMPORTANTE: El registro local continúa normalmente');
        console.log('⚠️ El profesional se registra en el sistema local aunque falle la API externa de Fluentia');
      }

      console.log('✅ API externa procesada, continuando con el registro local...');

      // Crear profesional
      const profesional = await this.prisma.professional.create({
        data: {
          userId: user.id,
          name: createProfesionalDto.name,
          // specialties: createProfesionalDto.specialties || [], // Campo eliminado en nueva estructura
          defaultDurationMin: createProfesionalDto.defaultDurationMin || 30,
          bufferMin: createProfesionalDto.bufferMin || 10,
          notes: createProfesionalDto.notes,
          // tratamientos: createProfesionalDto.tratamientos || [], // Campo eliminado en nueva estructura
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              estado: true,
              clinicaId: true,
              clinica: {
                select: {
                  id: true,
                  name: true,
                  url: true,
                },
              },
            },
          },
          agendas: {
            select: {
              id: true,
              dia: true,
              horaInicio: true,
              horaFin: true,
              duracionMin: true,
            },
            orderBy: {
              dia: 'asc',
            },
          },
        },
      });

      // Actualizar sucursal si se proporciona
      if (createProfesionalDto.sucursal) {
        console.log('🔍 Actualizando sucursal con ID:', createProfesionalDto.sucursal);
        await this.prisma.$executeRaw`
          UPDATE "Professional" 
          SET "sucursalId" = ${createProfesionalDto.sucursal} 
          WHERE id = ${profesional.id}
        `;
        console.log('✅ Sucursal actualizada exitosamente');
      } else {
        console.log('⚠️ No se proporcionó sucursal en el DTO');
      }

      // Crear horarios si se proporcionan
      if (createProfesionalDto.horariosDetallados && Array.isArray(createProfesionalDto.horariosDetallados)) {
        const horariosData = createProfesionalDto.horariosDetallados.map(horario => ({
          professionalId: profesional.id,
          dia: horario.dia,
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          duracionMin: createProfesionalDto.defaultDurationMin || 30,
        }));

        await this.prisma.agenda.createMany({
          data: horariosData,
        });
      }

      // Obtener el profesional con los horarios creados
      const profesionalConHorarios = await this.prisma.professional.findUnique({
        where: { id: profesional.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              estado: true,
              clinicaId: true,
              clinica: {
                select: {
                  id: true,
                  name: true,
                  url: true,
                },
              },
            },
          },
          agendas: {
            select: {
              id: true,
              dia: true,
              horaInicio: true,
              horaFin: true,
              duracionMin: true,
            },
            orderBy: {
              dia: 'asc',
            },
          },
        },
      });

      if (!profesionalConHorarios) {
        throw new BadRequestException('Error al obtener el profesional creado');
      }

      // Transformar los horarios al formato esperado por el frontend
      const horariosDetallados = (profesionalConHorarios as any).agendas?.map((agenda: any) => ({
        dia: agenda.dia,
        horaInicio: agenda.horaInicio,
        horaFin: agenda.horaFin,
      })) || [];

      // Construir la respuesta con el formato esperado
      const response = {
        ...profesionalConHorarios,
        horariosDetallados,
        sucursal: (profesionalConHorarios as any).sucursalId || null,
      };

      return {
        success: true,
        data: response,
        message: 'Profesional creado exitosamente',
      };
    } catch (error) {
      console.error('Error creando profesional:', error);
      throw new BadRequestException('Error al crear el profesional');
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar profesional' })
  @ApiResponse({ status: 200, description: 'Profesional actualizado exitosamente' })
  async update(@Param('id') id: string, @Body() updateProfesionalDto: any) {
    try {
      console.log('🔍 DTO recibido en update:', JSON.stringify(updateProfesionalDto, null, 2));
      console.log('🔍 Campo sucursal recibido en update:', updateProfesionalDto.sucursal);
      
      const profesional = await this.prisma.professional.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      if (!profesional) {
        throw new NotFoundException('Profesional no encontrado');
      }

      // Actualizar datos del profesional
      const updatedProfesional = await this.prisma.professional.update({
        where: { id },
        data: {
          name: updateProfesionalDto.name,
          // specialties: updateProfesionalDto.specialties, // Campo eliminado en nueva estructura
          defaultDurationMin: updateProfesionalDto.defaultDurationMin,
          bufferMin: updateProfesionalDto.bufferMin,
          notes: updateProfesionalDto.notes,
          // tratamientos: updateProfesionalDto.tratamientos, // Campo eliminado en nueva estructura
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              estado: true,
              clinicaId: true,
              clinica: {
                select: {
                  id: true,
                  name: true,
                  url: true,
                },
              },
            },
          },
          agendas: {
            select: {
              id: true,
              dia: true,
              horaInicio: true,
              horaFin: true,
              duracionMin: true,
            },
            orderBy: {
              dia: 'asc',
            },
          },
        },
      });

      // Actualizar sucursal si se proporciona
      if (updateProfesionalDto.sucursal !== undefined) {
        console.log('🔍 Actualizando sucursal en update con ID:', updateProfesionalDto.sucursal);
        await this.prisma.$executeRaw`
          UPDATE "Professional" 
          SET "sucursalId" = ${updateProfesionalDto.sucursal} 
          WHERE id = ${id}
        `;
        console.log('✅ Sucursal actualizada exitosamente en update');
      } else {
        console.log('⚠️ No se proporcionó sucursal en el DTO de update');
      }

      // Actualizar datos del usuario si se proporcionan
      if (updateProfesionalDto.email || updateProfesionalDto.name || updateProfesionalDto.phone) {
        await this.prisma.user.update({
          where: { id: profesional.userId },
          data: {
            email: updateProfesionalDto.email,
            name: updateProfesionalDto.name,
            phone: updateProfesionalDto.phone,
          },
        });
      }

      // Actualizar horarios si se proporcionan
      if (updateProfesionalDto.horariosDetallados && Array.isArray(updateProfesionalDto.horariosDetallados)) {
        // Eliminar horarios existentes
        await this.prisma.agenda.deleteMany({
          where: { professionalId: id },
        });

        // Crear nuevos horarios
        const horariosData = updateProfesionalDto.horariosDetallados.map(horario => ({
          professionalId: id,
          dia: horario.dia,
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          duracionMin: updateProfesionalDto.defaultDurationMin || 30,
        }));

        await this.prisma.agenda.createMany({
          data: horariosData,
        });
      }

      // Obtener el profesional actualizado con los horarios
      const profesionalActualizado = await this.prisma.professional.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              estado: true,
              clinicaId: true,
              clinica: {
                select: {
                  id: true,
                  name: true,
                  url: true,
                },
              },
            },
          },
          agendas: {
            select: {
              id: true,
              dia: true,
              horaInicio: true,
              horaFin: true,
              duracionMin: true,
            },
            orderBy: {
              dia: 'asc',
            },
          },
        },
      });

      if (!profesionalActualizado) {
        throw new BadRequestException('Error al obtener el profesional actualizado');
      }

      // Transformar los horarios al formato esperado por el frontend
      const horariosDetallados = (profesionalActualizado as any).agendas?.map((agenda: any) => ({
        dia: agenda.dia,
        horaInicio: agenda.horaInicio,
        horaFin: agenda.horaFin,
      })) || [];

      // Construir la respuesta con el formato esperado
      const response = {
        ...profesionalActualizado,
        horariosDetallados,
        sucursal: (profesionalActualizado as any).sucursalId || null,
      };

      return {
        success: true,
        data: response,
        message: 'Profesional actualizado exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error actualizando profesional:', error);
      throw new BadRequestException('Error al actualizar el profesional');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar profesional' })
  @ApiResponse({ status: 200, description: 'Profesional eliminado exitosamente' })
  async remove(@Param('id') id: string) {
    try {
      const profesional = await this.prisma.professional.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      if (!profesional) {
        throw new NotFoundException('Profesional no encontrado');
      }

      // Eliminar profesional (esto también eliminará el usuario por la relación)
      await this.prisma.professional.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Profesional eliminado exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error eliminando profesional:', error);
      throw new BadRequestException('Error al eliminar el profesional');
    }
  }

  @Get('clinica/:clinicaId/availability')
  @ApiOperation({ summary: 'Obtener disponibilidad de profesionales (horarios de trabajo y turnos agendados) - PÚBLICO' })
  @ApiResponse({ status: 200, description: 'Disponibilidad de profesionales obtenida exitosamente' })
  @ApiQuery({ name: 'fecha', required: false, description: 'Filtrar por fecha específica (YYYY-MM-DD)' })
  @ApiQuery({ name: 'especialidad', required: false, description: 'Filtrar por especialidad' })
  async getProfessionalsAvailability(
    @Param('clinicaId') clinicaId: string,
    @Query('fecha') fecha?: string,
    @Query('especialidad') especialidad?: string,
  ) {
    try {
      console.log(`🔍 [${new Date().toISOString()}] Obteniendo disponibilidad para clínica: ${clinicaId}`);
      console.log(`🔍 Filtros: fecha=${fecha}, especialidad=${especialidad}`);

      // 1. Obtener profesionales de la clínica con sus horarios de trabajo
      const whereProfessional: any = {
        user: {
          clinicaId: clinicaId,
        },
      };

      if (especialidad) {
        whereProfessional.especialidades = {
          some: {
            especialidad: {
              name: {
                contains: especialidad,
                mode: 'insensitive'
              }
            }
          }
        };
      }

      const profesionales = await this.prisma.professional.findMany({
        where: whereProfessional,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              estado: true,
            }
          },
          agendas: {
            select: {
              id: true,
              dia: true,
              horaInicio: true,
              horaFin: true,
              duracionMin: true,
            },
            orderBy: {
              dia: 'asc',
            },
          },
          especialidades: {
            include: {
              especialidad: {
                select: {
                  name: true
                }
              }
            }
          },
          tratamientos: {
            include: {
              tratamiento: {
                select: {
                  name: true,
                  precio: true,
                  duracionPorSesion: true,
                  cantidadSesiones: true
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc',
        },
      });

      console.log(`✅ Profesionales encontrados: ${profesionales.length}`);

      // 2. Si se especifica una fecha, obtener turnos agendados para esa fecha
      let turnosAgendados: any[] = [];
      if (fecha) {
        const fechaInicio = new Date(fecha);
        const fechaFin = new Date(fecha);
        fechaFin.setDate(fechaFin.getDate() + 1);

        turnosAgendados = await this.prisma.turno.findMany({
          where: {
            clinicaId: clinicaId,
            fecha: {
              gte: fechaInicio,
              lt: fechaFin,
            },
            estado: {
              not: 'cancelado'
            }
          },
          select: {
            id: true,
            professionalId: true,
            doctor: true,
            fecha: true,
            hora: true,
            duracionMin: true,
            estado: true,
            paciente: true,
            motivo: true,
          },
          orderBy: {
            hora: 'asc',
          },
        });

        console.log(`🔍 Turnos encontrados en DB para ${fecha}:`, turnosAgendados.length);
        console.log(`🔍 Detalles de turnos:`, turnosAgendados.map(t => ({
          id: t.id,
          professionalId: t.professionalId,
          fecha: t.fecha,
          hora: t.hora,
          estado: t.estado
        })));

        console.log(`✅ Turnos agendados para ${fecha}: ${turnosAgendados.length}`);
      }

      // 3. Procesar datos para cada profesional
      const profesionalesConDisponibilidad = profesionales.map(profesional => {
        // Horarios de trabajo del profesional
        const horariosTrabajo = profesional.agendas.map(agenda => ({
          dia: agenda.dia,
          horaInicio: agenda.horaInicio,
          horaFin: agenda.horaFin,
          duracionMin: agenda.duracionMin,
        }));

        // Turnos agendados del profesional (si se especificó fecha)
        // Buscar por professionalId o por nombre del doctor
        const turnosProfesional = turnosAgendados.filter(turno => 
          turno.professionalId === profesional.id || 
          turno.doctor === profesional.name
        ).map(turno => ({
          id: turno.id,
          fecha: turno.fecha,
          hora: turno.hora,
          duracionMin: turno.duracionMin,
          estado: turno.estado,
          paciente: turno.paciente,
          motivo: turno.motivo,
        }));

        console.log(`🔍 Profesional ${profesional.name} (${profesional.id}):`);
        console.log(`🔍 - Turnos totales encontrados: ${turnosAgendados.length}`);
        console.log(`🔍 - Turnos filtrados para este profesional: ${turnosProfesional.length}`);
        console.log(`🔍 - Comparando nombres: profesional.name="${profesional.name}" vs turnos.doctor:`);
        turnosAgendados.forEach(turno => {
          console.log(`🔍   - Turno ${turno.id}: doctor="${turno.doctor}", professionalId="${turno.professionalId}"`);
        });
        if (turnosProfesional.length > 0) {
          console.log(`🔍 - Turnos del profesional:`, turnosProfesional.map(t => ({
            id: t.id,
            hora: t.hora,
            paciente: t.paciente
          })));
        }

        // Especialidades del profesional
        const especialidades = profesional.especialidades.map(esp => esp.especialidad.name);

        // Tratamientos del profesional
        const tratamientos = profesional.tratamientos.map(trat => ({
          name: trat.tratamiento.name,
          precio: trat.precio || trat.tratamiento.precio,
          duracionPorSesion: trat.duracionMin || trat.tratamiento.duracionPorSesion,
          cantidadSesiones: trat.tratamiento.cantidadSesiones,
          duracionTotal: (trat.duracionMin || trat.tratamiento.duracionPorSesion) * trat.tratamiento.cantidadSesiones,
        }));

        return {
          id: profesional.id,
          name: profesional.name,
          user: profesional.user,
          horariosTrabajo: horariosTrabajo,
          turnosAgendados: turnosProfesional,
          especialidades: especialidades,
          tratamientos: tratamientos,
          defaultDurationMin: profesional.defaultDurationMin,
          bufferMin: profesional.bufferMin,
          notes: profesional.notes,
          sucursal: (profesional as any).sucursalId || null,
          // Información adicional para el frontend
          totalTurnosAgendados: turnosProfesional.length,
          diasTrabajo: horariosTrabajo.map(h => h.dia),
          horarioCompleto: horariosTrabajo.length > 0,
        };
      });

      console.log(`✅ Profesionales procesados: ${profesionalesConDisponibilidad.length}`);

      return {
        success: true,
        data: profesionalesConDisponibilidad,
        message: 'Disponibilidad de profesionales obtenida exitosamente',
        metadata: {
          totalProfesionales: profesionalesConDisponibilidad.length,
          fechaConsultada: fecha || null,
          especialidadFiltrada: especialidad || null,
          profesionalesConHorarios: profesionalesConDisponibilidad.filter(p => p.horariosTrabajo.length > 0).length,
          profesionalesConTurnos: profesionalesConDisponibilidad.filter(p => p.turnosAgendados.length > 0).length,
        }
      };
    } catch (error) {
      console.error('Error obteniendo disponibilidad de profesionales:', error);
      throw new BadRequestException('Error al obtener la disponibilidad de profesionales');
    }
  }

  @Get('clinica-url/:clinicaUrl/availability')
  @ApiOperation({ summary: 'Obtener disponibilidad de profesionales por URL de clínica (horarios de trabajo y turnos agendados) - PÚBLICO' })
  @ApiResponse({ status: 200, description: 'Disponibilidad de profesionales obtenida exitosamente' })
  @ApiQuery({ name: 'fecha', required: false, description: 'Filtrar por fecha específica (YYYY-MM-DD)' })
  @ApiQuery({ name: 'especialidad', required: false, description: 'Filtrar por especialidad' })
  async getProfessionalsAvailabilityByUrl(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query('fecha') fecha?: string,
    @Query('especialidad') especialidad?: string,
  ) {
    try {
      console.log(`🔍 [${new Date().toISOString()}] Obteniendo disponibilidad para clínica URL: ${clinicaUrl}`);
      console.log(`🔍 Filtros: fecha=${fecha}, especialidad=${especialidad}`);

      // 1. Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
        select: { id: true, name: true, url: true }
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      console.log(`✅ Clínica encontrada: ${clinica.name} (${clinica.id})`);

      // 2. Obtener profesionales de la clínica con sus horarios de trabajo
      const whereProfessional: any = {
        user: {
          clinicaId: clinica.id,
        },
      };

      if (especialidad) {
        whereProfessional.especialidades = {
          some: {
            especialidad: {
              name: {
                contains: especialidad,
                mode: 'insensitive'
              }
            }
          }
        };
      }

      const profesionales = await this.prisma.professional.findMany({
        where: whereProfessional,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              estado: true,
            }
          },
          agendas: {
            select: {
              id: true,
              dia: true,
              horaInicio: true,
              horaFin: true,
              duracionMin: true,
            },
            orderBy: {
              dia: 'asc',
            },
          },
          especialidades: {
            include: {
              especialidad: {
                select: {
                  name: true
                }
              }
            }
          },
          tratamientos: {
            include: {
              tratamiento: {
                select: {
                  name: true,
                  precio: true,
                  duracionPorSesion: true,
                  cantidadSesiones: true
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc',
        },
      });

      console.log(`✅ Profesionales encontrados: ${profesionales.length}`);

      // 3. Si se especifica una fecha, obtener turnos agendados para esa fecha
      let turnosAgendados: any[] = [];
      if (fecha) {
        const fechaInicio = new Date(fecha);
        const fechaFin = new Date(fecha);
        fechaFin.setDate(fechaFin.getDate() + 1);

        turnosAgendados = await this.prisma.turno.findMany({
          where: {
            clinicaId: clinica.id,
            fecha: {
              gte: fechaInicio,
              lt: fechaFin,
            },
            estado: {
              not: 'cancelado'
            }
          },
          select: {
            id: true,
            professionalId: true,
            doctor: true,
            fecha: true,
            hora: true,
            duracionMin: true,
            estado: true,
            paciente: true,
            motivo: true,
          },
          orderBy: {
            hora: 'asc',
          },
        });

        console.log(`🔍 Turnos encontrados en DB para ${fecha} (URL):`, turnosAgendados.length);
        console.log(`🔍 Detalles de turnos (URL):`, turnosAgendados.map(t => ({
          id: t.id,
          professionalId: t.professionalId,
          fecha: t.fecha,
          hora: t.hora,
          estado: t.estado
        })));

        console.log(`✅ Turnos agendados para ${fecha}: ${turnosAgendados.length}`);
      }

      // 4. Procesar datos para cada profesional
      const profesionalesConDisponibilidad = profesionales.map(profesional => {
        // Horarios de trabajo del profesional
        const horariosTrabajo = profesional.agendas.map(agenda => ({
          dia: agenda.dia,
          horaInicio: agenda.horaInicio,
          horaFin: agenda.horaFin,
          duracionMin: agenda.duracionMin,
        }));

        // Turnos agendados del profesional (si se especificó fecha)
        // Buscar por professionalId o por nombre del doctor
        const turnosProfesional = turnosAgendados.filter(turno => 
          turno.professionalId === profesional.id || 
          turno.doctor === profesional.name
        ).map(turno => ({
          id: turno.id,
          fecha: turno.fecha,
          hora: turno.hora,
          duracionMin: turno.duracionMin,
          estado: turno.estado,
          paciente: turno.paciente,
          motivo: turno.motivo,
        }));

        console.log(`🔍 Profesional ${profesional.name} (${profesional.id}):`);
        console.log(`🔍 - Turnos totales encontrados: ${turnosAgendados.length}`);
        console.log(`🔍 - Turnos filtrados para este profesional: ${turnosProfesional.length}`);
        console.log(`🔍 - Comparando nombres: profesional.name="${profesional.name}" vs turnos.doctor:`);
        turnosAgendados.forEach(turno => {
          console.log(`🔍   - Turno ${turno.id}: doctor="${turno.doctor}", professionalId="${turno.professionalId}"`);
        });
        if (turnosProfesional.length > 0) {
          console.log(`🔍 - Turnos del profesional:`, turnosProfesional.map(t => ({
            id: t.id,
            hora: t.hora,
            paciente: t.paciente
          })));
        }

        // Especialidades del profesional
        const especialidades = profesional.especialidades.map(esp => esp.especialidad.name);

        // Tratamientos del profesional
        const tratamientos = profesional.tratamientos.map(trat => ({
          name: trat.tratamiento.name,
          precio: trat.precio || trat.tratamiento.precio,
          duracionPorSesion: trat.duracionMin || trat.tratamiento.duracionPorSesion,
          cantidadSesiones: trat.tratamiento.cantidadSesiones,
          duracionTotal: (trat.duracionMin || trat.tratamiento.duracionPorSesion) * trat.tratamiento.cantidadSesiones,
        }));

        return {
          id: profesional.id,
          name: profesional.name,
          user: profesional.user,
          horariosTrabajo: horariosTrabajo,
          turnosAgendados: turnosProfesional,
          especialidades: especialidades,
          tratamientos: tratamientos,
          defaultDurationMin: profesional.defaultDurationMin,
          bufferMin: profesional.bufferMin,
          notes: profesional.notes,
          sucursal: (profesional as any).sucursalId || null,
          // Información adicional para el frontend
          totalTurnosAgendados: turnosProfesional.length,
          diasTrabajo: horariosTrabajo.map(h => h.dia),
          horarioCompleto: horariosTrabajo.length > 0,
        };
      });

      console.log(`✅ Profesionales procesados: ${profesionalesConDisponibilidad.length}`);

      return {
        success: true,
        data: profesionalesConDisponibilidad,
        message: 'Disponibilidad de profesionales obtenida exitosamente',
        clinica: {
          id: clinica.id,
          name: clinica.name,
          url: clinica.url,
        },
        metadata: {
          totalProfesionales: profesionalesConDisponibilidad.length,
          fechaConsultada: fecha || null,
          especialidadFiltrada: especialidad || null,
          profesionalesConHorarios: profesionalesConDisponibilidad.filter(p => p.horariosTrabajo.length > 0).length,
          profesionalesConTurnos: profesionalesConDisponibilidad.filter(p => p.turnosAgendados.length > 0).length,
        }
      };
    } catch (error) {
      console.error('Error obteniendo disponibilidad de profesionales por URL:', error);
      throw new BadRequestException('Error al obtener la disponibilidad de profesionales');
    }
  }


  @Get('clinica/:clinicaId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener profesionales de una clínica específica' })
  @ApiResponse({ status: 200, description: 'Profesionales de la clínica obtenidos exitosamente' })
  @ApiQuery({ name: 'especialidad', required: false, description: 'Filtrar por especialidad' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findByClinica(
    @Param('clinicaId') clinicaId: string,
    @Query('especialidad') especialidad?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const where: any = {
        user: {
          clinicaId: clinicaId,
        },
      };

      if (especialidad) {
        where.specialties = {
          has: especialidad,
        };
      }

      const profesionales = await this.prisma.professional.findMany({
        where,
        take: limitNum,
        skip: offsetNum,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              estado: true,
              clinicaId: true,
              clinica: {
                select: {
                  id: true,
                  name: true,
                  url: true,
                },
              },
            },
          },
          agendas: {
            select: {
              id: true,
              dia: true,
              horaInicio: true,
              horaFin: true,
              duracionMin: true,
            },
            orderBy: {
              dia: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transformar los datos para incluir horariosDetallados y sucursal en el formato esperado
      const profesionalesTransformados = profesionales.map(profesional => {
        const horariosDetallados = (profesional as any).agendas?.map((agenda: any) => ({
          dia: agenda.dia,
          horaInicio: agenda.horaInicio,
          horaFin: agenda.horaFin,
        })) || [];

        return {
          ...profesional,
          horariosDetallados,
          sucursal: (profesional as any).sucursalId || null,
        };
      });

      console.log('🔍 Profesionales de clínica encontrados:', profesionales.length);
      console.log('🔍 Profesionales de clínica transformados:', profesionalesTransformados.length);

      return {
        success: true,
        data: profesionalesTransformados,
        message: 'Profesionales de la clínica obtenidos exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.professional.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo profesionales de la clínica:', error);
      throw new BadRequestException('Error al obtener los profesionales de la clínica');
    }
  }
} 