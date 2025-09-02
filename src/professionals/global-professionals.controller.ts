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

      // Crear usuario primero
      const user = await this.prisma.user.create({
        data: {
          email: createProfesionalDto.email,
          password: hashedPassword,
          name: createProfesionalDto.name,
          phone: createProfesionalDto.phone,
          role: 'PROFESSIONAL',
          clinicaId: createProfesionalDto.clinicaId,
        },
      });

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