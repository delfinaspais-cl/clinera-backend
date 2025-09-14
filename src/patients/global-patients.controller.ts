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

@ApiTags('Pacientes Globales')
@Controller('pacientes')
export class GlobalPatientsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los pacientes' })
  @ApiResponse({ status: 200, description: 'Lista de pacientes obtenida exitosamente' })
  @ApiQuery({ name: 'clinicaId', required: false, description: 'Filtrar por clínica' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findAll(
    @Query('clinicaId') clinicaId?: string,
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

      const pacientes = await this.prisma.patient.findMany({
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: pacientes,
        message: 'Pacientes obtenidos exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.patient.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo pacientes:', error);
      throw new BadRequestException('Error al obtener los pacientes');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener paciente específico' })
  @ApiResponse({ status: 200, description: 'Paciente obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async findOne(@Param('id') id: string) {
    try {
      const paciente = await this.prisma.patient.findUnique({
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
        },
      });

      if (!paciente) {
        throw new NotFoundException('Paciente no encontrado');
      }

      return {
        success: true,
        data: paciente,
        message: 'Paciente obtenido exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo paciente:', error);
      throw new BadRequestException('Error al obtener el paciente');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo paciente' })
  @ApiResponse({ status: 201, description: 'Paciente creado exitosamente' })
  async create(@Body() createPacienteDto: any) {
    try {
      // Validar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: createPacienteDto.clinicaId },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Crear usuario primero
      const user = await this.prisma.user.create({
        data: {
          email: createPacienteDto.email,
          password: createPacienteDto.password || 'defaultPassword123', // En producción, generar password seguro
          name: createPacienteDto.name,
          phone: createPacienteDto.phone,
          role: 'PATIENT',
          clinicaId: createPacienteDto.clinicaId,
        },
      });

      // Crear paciente
      const paciente = await this.prisma.patient.create({
        data: {
          userId: user.id,
          name: createPacienteDto.name,
          birthDate: createPacienteDto.birthDate ? new Date(createPacienteDto.birthDate) : null,
          phone: createPacienteDto.phone,
          notes: createPacienteDto.notes,
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
        },
      });

      return {
        success: true,
        data: paciente,
        message: 'Paciente creado exitosamente',
      };
    } catch (error) {
      console.error('Error creando paciente:', error);
      throw new BadRequestException('Error al crear el paciente');
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar paciente' })
  @ApiResponse({ status: 200, description: 'Paciente actualizado exitosamente' })
  async update(@Param('id') id: string, @Body() updatePacienteDto: any) {
    try {
      const paciente = await this.prisma.patient.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      if (!paciente) {
        throw new NotFoundException('Paciente no encontrado');
      }

      // Actualizar datos del paciente
      const updatedPaciente = await this.prisma.patient.update({
        where: { id },
        data: {
          name: updatePacienteDto.name,
          birthDate: updatePacienteDto.birthDate ? new Date(updatePacienteDto.birthDate) : null,
          phone: updatePacienteDto.phone,
          notes: updatePacienteDto.notes,
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
        },
      });

      // Actualizar datos del usuario si se proporcionan
      if (updatePacienteDto.email || updatePacienteDto.name || updatePacienteDto.phone) {
        await this.prisma.user.update({
          where: { id: paciente.userId },
          data: {
            email: updatePacienteDto.email,
            name: updatePacienteDto.name,
            phone: updatePacienteDto.phone,
          },
        });
      }

      return {
        success: true,
        data: updatedPaciente,
        message: 'Paciente actualizado exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error actualizando paciente:', error);
      throw new BadRequestException('Error al actualizar el paciente');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar paciente' })
  @ApiResponse({ status: 200, description: 'Paciente eliminado exitosamente' })
  async remove(@Param('id') id: string) {
    try {
      const paciente = await this.prisma.patient.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      if (!paciente) {
        throw new NotFoundException('Paciente no encontrado');
      }

      // Eliminar paciente (esto también eliminará el usuario por la relación)
      await this.prisma.patient.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Paciente eliminado exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error eliminando paciente:', error);
      throw new BadRequestException('Error al eliminar el paciente');
    }
  }

  @Get('clinica/:clinicaId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener pacientes de una clínica específica' })
  @ApiResponse({ status: 200, description: 'Pacientes de la clínica obtenidos exitosamente' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findByClinica(
    @Param('clinicaId') clinicaId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const pacientes = await this.prisma.patient.findMany({
        where: {
          user: {
            clinicaId: clinicaId,
          },
        },
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: pacientes,
        message: 'Pacientes de la clínica obtenidos exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.patient.count({
            where: {
              user: {
                clinicaId: clinicaId,
              },
            },
          }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo pacientes de la clínica:', error);
      throw new BadRequestException('Error al obtener los pacientes de la clínica');
    }
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadísticas de pacientes' })
  @ApiResponse({ status: 200, description: 'Estadísticas de pacientes obtenidas exitosamente' })
  @ApiQuery({ name: 'clinicaId', required: false, description: 'Filtrar por clínica' })
  async getStats(@Query('clinicaId') clinicaId?: string) {
    try {
      const where: any = {};
      if (clinicaId) {
        where.user = {
          clinicaId: clinicaId,
        };
      }

      // Contar total de pacientes
      const totalPacientes = await this.prisma.patient.count({ where });

      // Contar pacientes por estado
      const pacientesActivos = await this.prisma.patient.count({
        where: {
          ...where,
          user: {
            ...where.user,
            estado: 'activo',
          },
        },
      });

      const pacientesInactivos = await this.prisma.patient.count({
        where: {
          ...where,
          user: {
            ...where.user,
            estado: 'inactivo',
          },
        },
      });

      // Obtener pacientes con turnos
      const pacientesConTurnos = await this.prisma.patient.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      // Contar turnos por paciente
      const turnosPorPaciente = await Promise.all(
        pacientesConTurnos.map(async (paciente) => {
          const turnosCount = await this.prisma.turno.count({
            where: {
              email: paciente.user.email,
              ...(clinicaId && { clinicaId }),
            },
          });
          return {
            pacienteId: paciente.id,
            pacienteName: paciente.name,
            email: paciente.user.email,
            turnosCount,
          };
        })
      );

      // Estadísticas de turnos
      const totalTurnos = turnosPorPaciente.reduce((sum, p) => sum + p.turnosCount, 0);
      const pacientesConTurnosCount = turnosPorPaciente.filter(p => p.turnosCount > 0).length;

      return {
        success: true,
        data: {
          totalPacientes,
          pacientesActivos,
          pacientesInactivos,
          pacientesConTurnos: pacientesConTurnosCount,
          pacientesSinTurnos: totalPacientes - pacientesConTurnosCount,
          totalTurnos,
          promedioTurnosPorPaciente: totalPacientes > 0 ? Math.round((totalTurnos / totalPacientes) * 100) / 100 : 0,
          turnosPorPaciente: turnosPorPaciente.filter(p => p.turnosCount > 0),
        },
        message: 'Estadísticas de pacientes obtenidas exitosamente',
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de pacientes:', error);
      throw new BadRequestException('Error al obtener las estadísticas de pacientes');
    }
  }
} 