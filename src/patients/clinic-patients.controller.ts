import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
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

@ApiTags('Pacientes por Clínica')
@Controller('clinica/:clinicaUrl/pacientes')
export class ClinicPatientsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadísticas de pacientes de una clínica' })
  @ApiResponse({ status: 200, description: 'Estadísticas de pacientes obtenidas exitosamente' })
  async getStats(@Param('clinicaUrl') clinicaUrl: string) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      const where = {
        user: {
          clinicaId: clinica.id,
        },
      };

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
              clinicaId: clinica.id,
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
          clinica: {
            id: clinica.id,
            name: clinica.name,
            url: clinica.url,
          },
        },
        message: 'Estadísticas de pacientes obtenidas exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo estadísticas de pacientes:', error);
      throw new BadRequestException('Error al obtener las estadísticas de pacientes');
    }
  }

  @Get(':pacienteId/turnos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener turnos de un paciente específico' })
  @ApiResponse({ status: 200, description: 'Turnos del paciente obtenidos exitosamente' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async getTurnosByPaciente(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Query('estado') estado?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Obtener el paciente
      const paciente = await this.prisma.patient.findUnique({
        where: { id: pacienteId },
        include: {
          user: {
            select: {
              email: true,
              clinicaId: true,
            },
          },
        },
      });

      if (!paciente) {
        throw new NotFoundException('Paciente no encontrado');
      }

      // Verificar que el paciente pertenece a la clínica
      if (paciente.user.clinicaId !== clinica.id) {
        throw new NotFoundException('Paciente no encontrado en esta clínica');
      }

      const where: any = { 
        email: paciente.user.email,
        clinicaId: clinica.id,
      };
      if (estado) where.estado = estado;

      const turnos = await this.prisma.turno.findMany({
        where,
        take: limitNum,
        skip: offsetNum,
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
          fecha: 'desc',
        },
      });

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
          ...turno,
          montoTotal,
          montoAbonado,
          montoPendiente,
          estadoPago,
          // Agregar campos calculados para el frontend
          porcentajePagado: montoTotal > 0 ? Math.round((montoAbonado / montoTotal) * 100) : 0,
          porcentajePendiente: montoTotal > 0 ? Math.round((montoPendiente / montoTotal) * 100) : 0,
        };
      });

      return {
        success: true,
        data: turnosProcesados,
        message: 'Turnos del paciente obtenidos exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.turno.count({ where }),
        },
        paciente: {
          id: paciente.id,
          name: paciente.name,
          email: paciente.user.email,
        },
        clinica: {
          id: clinica.id,
          name: clinica.name,
          url: clinica.url,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo turnos del paciente:', error);
      throw new BadRequestException('Error al obtener los turnos del paciente');
    }
  }
}
