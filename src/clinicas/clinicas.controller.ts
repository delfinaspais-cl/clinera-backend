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
import { UpdateTurnoDto } from './dto/update-turno.dto';
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

  @Get(':clinicaUrl/turnos/hoy')
  @UseGuards(JwtAuthGuard)
  async getTurnosHoy(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    console.log('=== DEBUG TURNOS HOY ===');
    console.log('req.user:', req.user);
    console.log('clinicaUrl:', clinicaUrl);
    console.log('===================');

    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getTurnosHoy(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getTurnosHoy(clinicaUrl);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/calendario/stats')
  @UseGuards(JwtAuthGuard)
  async getCalendarioStats(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    console.log('=== DEBUG CALENDARIO STATS ===');
    console.log('req.user:', req.user);
    console.log('clinicaUrl:', clinicaUrl);
    console.log('fechaDesde:', fechaDesde);
    console.log('fechaHasta:', fechaHasta);
    console.log('===================');

    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getCalendarioStats(clinicaUrl, fechaDesde, fechaHasta);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getCalendarioStats(clinicaUrl, fechaDesde, fechaHasta);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
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

  @Get(':clinicaUrl')
  async getClinicaInfo(
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    return this.clinicasService.getClinicaInfo(clinicaUrl);
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
  @ApiOperation({ summary: 'Obtener turnos de la clínica' })
  @ApiResponse({ status: 200, description: 'Turnos obtenidos exitosamente' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async getTurnos(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: GetTurnosFiltersDto,
  ) {
    return this.clinicasService.getTurnos(clinicaUrl, filters);
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
    console.log('=== DEBUG CONTROLLER CREATE TURNO ===');
    console.log('req.user:', req.user);
    console.log('clinicaUrl:', clinicaUrl);
    console.log('dto recibido:', JSON.stringify(dto, null, 2));
    console.log('=====================================');

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

  @Get(':clinicaUrl/turnos/:turnoId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener detalles de un turno específico' })
  @ApiResponse({ status: 200, description: 'Detalles del turno obtenidos exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Clínica o turno no encontrado' })
  async getTurnoById(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.getTurnoById(clinicaUrl, turnoId);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.getTurnoById(clinicaUrl, turnoId);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  @Put(':clinicaUrl/turnos/:turnoId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar un turno existente' })
  @ApiResponse({ status: 200, description: 'Turno actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Clínica o turno no encontrado' })
  async updateTurno(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
    @Body() dto: UpdateTurnoDto,
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
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para editar turnos en esta clínica.',
      );
    }
  }

  @Delete(':clinicaUrl/turnos/:turnoId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Eliminar un turno' })
  @ApiResponse({ status: 200, description: 'Turno eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Clínica o turno no encontrado' })
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

  @Get(':clinicaUrl/notificaciones')
  @ApiOperation({ summary: 'Obtener notificaciones de la clínica' })
  @ApiResponse({ status: 200, description: 'Notificaciones obtenidas exitosamente' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async getNotificaciones(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: GetNotificacionesFiltersDto,
  ) {
    return this.clinicasService.getNotificaciones(clinicaUrl, filters);
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
