import {
  Controller,
  Post,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmarCitaDto } from './dto/confirmar-cita.dto';

@ApiTags('Turnos Públicos')
@Controller('citas')
export class PublicTurnosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('estado/:token')
  @ApiOperation({ 
    summary: 'Obtener estado de cita mediante token',
    description: 'Endpoint público para consultar el estado y detalles de una cita usando su token de confirmación'
  })
  @ApiParam({ 
    name: 'token', 
    description: 'Token único de confirmación de la cita',
    example: 'abc123def456ghi789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado de la cita obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Estado de la cita obtenido exitosamente' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            paciente: { type: 'string' },
            doctor: { type: 'string' },
            fecha: { type: 'string', format: 'date-time' },
            hora: { type: 'string' },
            estado: { type: 'string', example: 'pendiente' },
            motivo: { type: 'string' },
            clinica: {
              type: 'object',
              properties: {
                nombre: { type: 'string' },
                telefono: { type: 'string' },
                email: { type: 'string' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cita no encontrada',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Cita no encontrada' }
      }
    }
  })
  async obtenerEstadoCita(@Param('token') token: string) {
    try {
      console.log(`🔍 Consultando estado de cita con token: ${token}`);

      // Buscar la cita por el token de confirmación
      const cita = await this.prisma.turno.findUnique({
        where: { confirmationToken: token },
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

      if (!cita) {
        console.log(`❌ Cita no encontrada con token: ${token}`);
        throw new NotFoundException('Cita no encontrada');
      }

      console.log(`✅ Estado de cita obtenido: ${cita.estado}`);

      return {
        success: true,
        message: 'Estado de la cita obtenido exitosamente',
        data: {
          id: cita.id,
          paciente: cita.paciente,
          doctor: cita.doctor,
          fecha: cita.fecha,
          hora: cita.hora,
          estado: cita.estado,
          motivo: cita.motivo,
          clinica: {
            nombre: cita.clinica.name,
            telefono: cita.clinica.phone,
            email: cita.clinica.email,
          },
        },
      };
    } catch (error) {
      console.error('❌ Error obteniendo estado de cita:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new HttpException(
        'Error interno del servidor al obtener el estado de la cita',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('confirmar/:token')
  @ApiOperation({ 
    summary: 'Confirmar cita mediante token',
    description: 'Endpoint público para que los pacientes confirmen sus citas usando un token de confirmación'
  })
  @ApiParam({ 
    name: 'token', 
    description: 'Token único de confirmación de la cita',
    example: 'abc123def456ghi789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cita confirmada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Cita confirmada exitosamente' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            paciente: { type: 'string' },
            doctor: { type: 'string' },
            fecha: { type: 'string', format: 'date-time' },
            hora: { type: 'string' },
            estado: { type: 'string', example: 'confirmada' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Token inválido o cita ya confirmada',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Token inválido o cita ya confirmada' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cita no encontrada',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Cita no encontrada' }
      }
    }
  })
  async confirmarCita(
    @Param('token') token: string,
    @Body() confirmarCitaDto: ConfirmarCitaDto
  ) {
    try {
      console.log(`🔍 Buscando cita con token: ${token}`);

      // Buscar la cita por el token de confirmación
      const cita = await this.prisma.turno.findUnique({
        where: { confirmationToken: token },
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

      if (!cita) {
        console.log(`❌ Cita no encontrada con token: ${token}`);
        throw new NotFoundException('Cita no encontrada');
      }

      // Verificar que la cita esté en estado pendiente
      if (cita.estado !== 'pendiente') {
        console.log(`⚠️ Cita ya procesada. Estado actual: ${cita.estado}`);
        throw new BadRequestException(
          `Esta cita ya ha sido ${cita.estado === 'confirmada' ? 'confirmada' : 'cancelada'} anteriormente`
        );
      }

      // Verificar que la cita no haya expirado (opcional: 7 días de validez)
      const fechaExpiracion = new Date(cita.createdAt);
      fechaExpiracion.setDate(fechaExpiracion.getDate() + 7);
      
      if (new Date() > fechaExpiracion) {
        console.log(`⏰ Token expirado para cita: ${cita.id}`);
        throw new BadRequestException('El enlace de confirmación ha expirado');
      }

      // Actualizar el estado de la cita a confirmada
      const citaActualizada = await this.prisma.turno.update({
        where: { id: cita.id },
        data: { 
          estado: 'confirmada',
          updatedAt: new Date()
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

      console.log(`✅ Cita confirmada exitosamente: ${cita.id}`);

      return {
        success: true,
        message: 'Cita confirmada exitosamente',
        data: {
          id: citaActualizada.id,
          paciente: citaActualizada.paciente,
          doctor: citaActualizada.doctor,
          fecha: citaActualizada.fecha,
          hora: citaActualizada.hora,
          estado: citaActualizada.estado,
          clinica: {
            nombre: citaActualizada.clinica.name,
            telefono: citaActualizada.clinica.phone,
            email: citaActualizada.clinica.email,
          },
        },
      };
    } catch (error) {
      console.error('❌ Error confirmando cita:', error);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new HttpException(
        'Error interno del servidor al confirmar la cita',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('cancelar/:token')
  @ApiOperation({ 
    summary: 'Cancelar cita mediante token',
    description: 'Endpoint público para que los pacientes cancelen sus citas usando un token de confirmación'
  })
  @ApiParam({ 
    name: 'token', 
    description: 'Token único de confirmación de la cita',
    example: 'abc123def456ghi789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cita cancelada exitosamente'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Token inválido o cita ya procesada'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cita no encontrada'
  })
  async cancelarCita(
    @Param('token') token: string,
    @Body() cancelarCitaDto: { motivo?: string }
  ) {
    try {
      console.log(`🔍 Buscando cita para cancelar con token: ${token}`);

      // Buscar la cita por el token de confirmación
      const cita = await this.prisma.turno.findUnique({
        where: { confirmationToken: token },
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

      if (!cita) {
        console.log(`❌ Cita no encontrada con token: ${token}`);
        throw new NotFoundException('Cita no encontrada');
      }

      // Verificar que la cita esté en estado pendiente
      if (cita.estado !== 'pendiente') {
        console.log(`⚠️ Cita ya procesada. Estado actual: ${cita.estado}`);
        throw new BadRequestException(
          `Esta cita ya ha sido ${cita.estado === 'confirmada' ? 'confirmada' : 'cancelada'} anteriormente`
        );
      }

      // Actualizar el estado de la cita a cancelada
      const citaActualizada = await this.prisma.turno.update({
        where: { id: cita.id },
        data: { 
          estado: 'cancelada',
          motivo: cancelarCitaDto.motivo || 'Cancelada por el paciente',
          updatedAt: new Date()
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

      console.log(`✅ Cita cancelada exitosamente: ${cita.id}`);

      return {
        success: true,
        message: 'Cita cancelada exitosamente',
        data: {
          id: citaActualizada.id,
          paciente: citaActualizada.paciente,
          doctor: citaActualizada.doctor,
          fecha: citaActualizada.fecha,
          hora: citaActualizada.hora,
          estado: citaActualizada.estado,
          motivo: citaActualizada.motivo,
          clinica: {
            nombre: citaActualizada.clinica.name,
            telefono: citaActualizada.clinica.phone,
            email: citaActualizada.clinica.email,
          },
        },
      };
    } catch (error) {
      console.error('❌ Error cancelando cita:', error);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new HttpException(
        'Error interno del servidor al cancelar la cita',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
