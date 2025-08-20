import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ClinicasService } from './clinicas.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { CreateUsuarioClinicaDto } from './dto/create-usuario-clinica.dto';
import { UpdateUsuarioEstadoDto } from './dto/update-usuario-estado.dto';
import { GetTurnosFiltersDto } from './dto/get-turnos-filters.dto';
import { GetUsuariosFiltersDto } from './dto/get-usuarios-filters.dto';
import { UpdateTurnoEstadoDto } from './dto/update-turno-estado.dto';
import { UpdateClinicaConfiguracionDto } from './dto/update-clinica-configuracion.dto';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { SearchTurnosDto } from './dto/search-turnos.dto';
import { GetNotificacionesFiltersDto } from './dto/get-notificaciones-filters.dto';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';

@ApiTags('Gestión de Clínicas')
@Controller('clinica')
export class ClinicasController {
  constructor(private clinicasService: ClinicasService) {}

  @Get(':clinicaUrl/usuarios')
  @UseGuards(JwtAuthGuard)
  async getUsuariosByClinicaUrl(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: GetUsuariosFiltersDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getUsuariosByClinicaUrl(clinicaUrl, filters);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getUsuariosByClinicaUrl(clinicaUrl, filters);
    } else {
      throw new Error(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  @Post(':clinicaUrl/usuarios')
  @UseGuards(JwtAuthGuard)
  async createUsuarioClinica(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateUsuarioClinicaDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede crear usuarios
    if (req.user.role === 'OWNER') {
      // OWNER puede crear usuarios en cualquier clínica
      return this.clinicasService.createUsuarioClinica(clinicaUrl, dto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede crear usuarios en su propia clínica
      return this.clinicasService.createUsuarioClinica(clinicaUrl, dto);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para crear usuarios en esta clínica.',
      );
    }
  }

  @Patch(':clinicaUrl/usuarios/:userId/estado')
  @UseGuards(JwtAuthGuard)
  async updateUsuarioEstado(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateUsuarioEstadoDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede actualizar usuarios
    if (req.user.role === 'OWNER') {
      // OWNER puede actualizar usuarios en cualquier clínica
      return this.clinicasService.updateUsuarioEstado(clinicaUrl, userId, dto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede actualizar usuarios en su propia clínica
      return this.clinicasService.updateUsuarioEstado(clinicaUrl, userId, dto);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para actualizar usuarios en esta clínica.',
      );
    }
  }

  @Put(':clinicaUrl/usuarios/:id')
  @UseGuards(JwtAuthGuard)
  async updateUsuario(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') userId: string,
    @Body() dto: CreateUsuarioClinicaDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      // OWNER puede actualizar usuarios en cualquier clínica
      return this.clinicasService.updateUsuario(clinicaUrl, userId, dto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede actualizar usuarios en su propia clínica
      return this.clinicasService.updateUsuario(clinicaUrl, userId, dto);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para actualizar usuarios en esta clínica.',
      );
    }
  }

  @Delete(':clinicaUrl/usuarios/:id')
  @UseGuards(JwtAuthGuard)
  async deleteUsuario(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') userId: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      // OWNER puede eliminar usuarios en cualquier clínica
      return this.clinicasService.deleteUsuario(clinicaUrl, userId);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede eliminar usuarios en su propia clínica
      return this.clinicasService.deleteUsuario(clinicaUrl, userId);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para eliminar usuarios en esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/turnos')
  @UseGuards(JwtAuthGuard)
  async getTurnosByClinicaUrl(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: any,
  ) {
    console.log('=== DEBUG TURNOS ===');
    console.log('req.user:', req.user);
    console.log('clinicaUrl:', clinicaUrl);
    console.log('filters:', filters);
    console.log('===================');

    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getTurnosByClinicaUrl(clinicaUrl, filters);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getTurnosByClinicaUrl(clinicaUrl, filters);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  @Post(':clinicaUrl/turnos')
  @UseGuards(JwtAuthGuard)
  async createTurno(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateTurnoDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      // OWNER puede crear turnos en cualquier clínica
      return this.clinicasService.createTurno(clinicaUrl, dto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede crear turnos en su propia clínica
      return this.clinicasService.createTurno(clinicaUrl, dto);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para crear turnos en esta clínica.',
      );
    }
  }

  @Put(':clinicaUrl/turnos/:id')
  @UseGuards(JwtAuthGuard)
  async updateTurno(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') turnoId: string,
    @Body() dto: CreateTurnoDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      // OWNER puede actualizar turnos en cualquier clínica
      return this.clinicasService.updateTurno(clinicaUrl, turnoId, dto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede actualizar turnos en su propia clínica
      return this.clinicasService.updateTurno(clinicaUrl, turnoId, dto);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para actualizar turnos en esta clínica.',
      );
    }
  }

  @Delete(':clinicaUrl/turnos/:id')
  @UseGuards(JwtAuthGuard)
  async deleteTurno(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') turnoId: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      // OWNER puede eliminar turnos en cualquier clínica
      return this.clinicasService.deleteTurno(clinicaUrl, turnoId);
      } else if (
        req.user.role === 'ADMIN' &&
        req.user.clinicaUrl === clinicaUrl
      ) {
        // ADMIN solo puede eliminar turnos en su propia clínica
        return this.clinicasService.deleteTurno(clinicaUrl, turnoId);
      } else {
        throw new UnauthorizedException(
          'Acceso denegado. No tienes permisos para eliminar turnos en esta clínica.',
        );
      }
  }

  @Get(':clinicaUrl/turnos-simple')
  @UseGuards(JwtAuthGuard)
  async getTurnosSimple(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    try {
      console.log('=== TURNOS SIMPLE ===');
      console.log('req.user:', req.user);
      console.log('clinicaUrl:', clinicaUrl);

      // Verificar que el usuario tenga acceso a esta clínica
      if (req.user.role === 'OWNER') {
        console.log('Usuario es OWNER - permitido');
      } else if (
        req.user.role === 'ADMIN' &&
        req.user.clinicaUrl === clinicaUrl
      ) {
        console.log('Usuario es ADMIN de esta clínica - permitido');
      } else {
        console.log('Usuario NO tiene permisos');
        throw new UnauthorizedException('Acceso denegado.');
      }

      // Usar filtros mínimos para evitar problemas de validación
      const filters = {
        page: 1,
        limit: 10,
      };

      console.log('Llamando a getTurnosByClinicaUrl con filtros:', filters);
      const result = await this.clinicasService.getTurnosByClinicaUrl(
        clinicaUrl,
        filters,
      );
      console.log('Resultado obtenido exitosamente');

      return result;
    } catch (error) {
      console.error('Error en turnos-simple:', error);
      console.error('Stack trace:', error.stack);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        turnos: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
        stats: {
          total: 0,
          confirmados: 0,
          pendientes: 0,
          cancelados: 0,
        },
      };
    }
  }

  @Get(':clinicaUrl/turnos-basic')
  @UseGuards(JwtAuthGuard)
  async getTurnosBasic(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    try {
      console.log('=== TURNOS BASIC ===');
      console.log('req.user:', req.user);
      console.log('clinicaUrl:', clinicaUrl);

      // Verificar que el usuario tenga acceso a esta clínica
      if (req.user.role === 'OWNER') {
        console.log('Usuario es OWNER - permitido');
      } else if (
        req.user.role === 'ADMIN' &&
        req.user.clinicaUrl === clinicaUrl
      ) {
        console.log('Usuario es ADMIN de esta clínica - permitido');
      } else {
        console.log('Usuario NO tiene permisos');
        throw new UnauthorizedException('Acceso denegado.');
      }

      // Buscar la clínica directamente
      const clinica = await this.clinicasService.getClinicaInfo(clinicaUrl);
      console.log('Clínica encontrada:', !!clinica);

      // Contar turnos directamente
      const turnosCount = await this.clinicasService.getTurnosCount(clinicaUrl);
      console.log('Cantidad de turnos:', turnosCount);

      // Retornar respuesta básica
      return {
        success: true,
        turnos: [],
        pagination: {
          page: 1,
          limit: 10,
          total: turnosCount,
          totalPages: Math.ceil(turnosCount / 10),
        },
        stats: {
          total: turnosCount,
          confirmados: 0,
          pendientes: 0,
          cancelados: 0,
        },
        message: 'Endpoint básico funcionando correctamente',
      };
    } catch (error) {
      console.error('Error en turnos-basic:', error);
      return {
        success: false,
        error: error.message,
        turnos: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
        stats: {
          total: 0,
          confirmados: 0,
          pendientes: 0,
          cancelados: 0,
        },
      };
    }
  }

  @Patch(':clinicaUrl/turnos/:turnoId/estado')
  @UseGuards(JwtAuthGuard)
  async updateTurnoEstado(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
    @Body() dto: UpdateTurnoEstadoDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.updateTurnoEstado(clinicaUrl, turnoId, dto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.updateTurnoEstado(clinicaUrl, turnoId, dto);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para actualizar turnos en esta clínica.',
      );
    }
  }

  @Put(':clinicaUrl/turnos/:turnoId')
  @UseGuards(JwtAuthGuard)
  async updateTurno(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
    @Body() dto: CreateTurnoDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.updateTurno(clinicaUrl, turnoId, dto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.updateTurno(clinicaUrl, turnoId, dto);
    } else {
      throw new Error(
        'Acceso denegado. No tienes permisos para actualizar turnos en esta clínica.',
      );
    }
  }

  @Delete(':clinicaUrl/turnos/:turnoId')
  @UseGuards(JwtAuthGuard)
  async deleteTurno(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.deleteTurno(clinicaUrl, turnoId);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.deleteTurno(clinicaUrl, turnoId);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para eliminar turnos en esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/turnos/stats')
  @UseGuards(JwtAuthGuard)
  async getTurnosStats(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.getTurnosStats(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.getTurnosStats(clinicaUrl);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para ver estadísticas de esta clínica.',
      );
    }
  }

  @ApiOperation({ summary: 'Búsqueda avanzada de turnos con filtros' })
  @ApiParam({ name: 'clinicaUrl', description: 'URL de la clínica' })
  @ApiResponse({
    status: 200,
    description: 'Lista de turnos filtrados con paginación',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        turnos: { type: 'array' },
        pagination: { type: 'object' },
        filters: { type: 'object' },
      },
    },
  })
  @ApiBearerAuth()
  @Get(':clinicaUrl/turnos/search')
  @UseGuards(JwtAuthGuard)
  async searchTurnos(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() searchDto: SearchTurnosDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.searchTurnos(clinicaUrl, searchDto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.searchTurnos(clinicaUrl, searchDto);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para buscar turnos en esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/debug-user')
  @UseGuards(JwtAuthGuard)
  async debugUser(@Request() req, @Param('clinicaUrl') clinicaUrl: string) {
    return {
      user: req.user,
      clinicaUrl: clinicaUrl,
      userClinicaUrl: req.user?.clinicaUrl,
      role: req.user?.role,
      match: req.user?.clinicaUrl === clinicaUrl,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':clinicaUrl/debug-turnos-simple')
  @UseGuards(JwtAuthGuard)
  async debugTurnosSimple(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    try {
      console.log('=== DEBUG TURNOS SIMPLE ===');
      console.log('req.user:', req.user);
      console.log('clinicaUrl:', clinicaUrl);

      // Verificar que el usuario tenga acceso a esta clínica
      if (req.user.role === 'OWNER') {
        console.log('Usuario es OWNER - permitido');
      } else if (
        req.user.role === 'ADMIN' &&
        req.user.clinicaUrl === clinicaUrl
      ) {
        console.log('Usuario es ADMIN de esta clínica - permitido');
      } else {
        console.log('Usuario NO tiene permisos');
        throw new UnauthorizedException('Acceso denegado.');
      }

      // Intentar obtener información básica de la clínica
      const clinica = await this.clinicasService.getClinicaInfo(clinicaUrl);
      console.log('Clínica encontrada:', !!clinica);

      // Intentar contar turnos sin filtros complejos
      const turnosCount = await this.clinicasService.getTurnosCount(clinicaUrl);
      console.log('Cantidad de turnos:', turnosCount);

      return {
        success: true,
        user: req.user,
        clinicaUrl: clinicaUrl,
        clinica: clinica,
        turnosCount: turnosCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error en debug-turnos-simple:', error);
      return {
        success: false,
        error: error.message,
        user: req.user,
        clinicaUrl: clinicaUrl,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get(':clinicaUrl')
  @UseGuards(JwtAuthGuard)
  async getClinicaInfo(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getClinicaInfo(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getClinicaInfo(clinicaUrl);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/configuracion')
  @UseGuards(JwtAuthGuard)
  async getClinicaConfiguracion(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getClinicaConfiguracion(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getClinicaConfiguracion(clinicaUrl);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  @Put(':clinicaUrl/configuracion')
  @UseGuards(JwtAuthGuard)
  async updateClinicaConfiguracion(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: UpdateClinicaConfiguracionDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.updateClinicaConfiguracion(clinicaUrl, dto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.updateClinicaConfiguracion(clinicaUrl, dto);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para actualizar esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/stats')
  @UseGuards(JwtAuthGuard)
  async getClinicaStats(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getClinicaStats(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getClinicaStats(clinicaUrl);
    } else {
      throw new BadRequestException(
        'Acceso denegado. No tienes permisos para acceder a las estadísticas de esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/analytics')
  @UseGuards(JwtAuthGuard)
  async getClinicaAnalytics(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.getClinicaAnalytics(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.getClinicaAnalytics(clinicaUrl);
    } else {
      throw new BadRequestException(
        'Acceso denegado. No tienes permisos para acceder a los analytics de esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/plan')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener información del plan de la clínica' })
  @ApiResponse({ status: 200, description: 'Plan obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async getClinicaPlan(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.getClinicaPlan(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.getClinicaPlan(clinicaUrl);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/turnos')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener turnos de la clínica' })
  @ApiResponse({ status: 200, description: 'Turnos obtenidos exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async getTurnos(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: GetTurnosFiltersDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.getTurnos(clinicaUrl, filters);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.getTurnos(clinicaUrl, filters);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  @Post(':clinicaUrl/turnos')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear nuevo turno' })
  @ApiResponse({ status: 201, description: 'Turno creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async createTurno(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateTurnoDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.createTurno(clinicaUrl, dto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.createTurno(clinicaUrl, dto);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para crear turnos en esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener datos de clínica específica' })
  @ApiResponse({ status: 200, description: 'Datos de clínica obtenidos exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async getClinicaByUrl(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.getClinicaByUrl(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.getClinicaByUrl(clinicaUrl);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/notificaciones')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener notificaciones de la clínica' })
  @ApiResponse({ status: 200, description: 'Notificaciones obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async getNotificaciones(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: GetNotificacionesFiltersDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.getNotificaciones(clinicaUrl, filters);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.getNotificaciones(clinicaUrl, filters);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  @Post(':clinicaUrl/notificaciones')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear nueva notificación' })
  @ApiResponse({ status: 201, description: 'Notificación creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async createNotificacion(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateNotificacionDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.createNotificacion(clinicaUrl, dto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.createNotificacion(clinicaUrl, dto);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para crear notificaciones en esta clínica.',
      );
    }
  }
}
