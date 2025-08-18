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
          agendas: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: profesionales,
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
          agendas: true,
        },
      });

      if (!profesional) {
        throw new NotFoundException('Profesional no encontrado');
      }

      return {
        success: true,
        data: profesional,
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
      // Validar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: createProfesionalDto.clinicaId },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Crear usuario primero
      const user = await this.prisma.user.create({
        data: {
          email: createProfesionalDto.email,
          password: createProfesionalDto.password || 'defaultPassword123', // En producción, generar password seguro
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
          specialties: createProfesionalDto.specialties || [],
          defaultDurationMin: createProfesionalDto.defaultDurationMin || 30,
          bufferMin: createProfesionalDto.bufferMin || 10,
          notes: createProfesionalDto.notes,
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
          agendas: true,
        },
      });

      return {
        success: true,
        data: profesional,
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
          specialties: updateProfesionalDto.specialties,
          defaultDurationMin: updateProfesionalDto.defaultDurationMin,
          bufferMin: updateProfesionalDto.bufferMin,
          notes: updateProfesionalDto.notes,
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
          agendas: true,
        },
      });

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

      return {
        success: true,
        data: updatedProfesional,
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
          agendas: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: profesionales,
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