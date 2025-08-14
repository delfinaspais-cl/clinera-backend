import { Controller, Get, Post, Patch, Put, Delete, Param, Body, Query, UseGuards, Request, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
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


@ApiTags('Gestión de Clínicas')
@Controller('clinica')
export class ClinicasController {
  constructor(private clinicasService: ClinicasService) {}

  @Get(':clinicaUrl/usuarios')
  @UseGuards(JwtAuthGuard)
  async getUsuariosByClinicaUrl(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: GetUsuariosFiltersDto
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getUsuariosByClinicaUrl(clinicaUrl, filters);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getUsuariosByClinicaUrl(clinicaUrl, filters);
    } else {
      throw new Error('Acceso denegado. No tienes permisos para acceder a esta clínica.');
    }
  }

  @Post(':clinicaUrl/usuarios')
  @UseGuards(JwtAuthGuard)
  async createUsuarioClinica(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateUsuarioClinicaDto
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede crear usuarios
    if (req.user.role === 'OWNER') {
      // OWNER puede crear usuarios en cualquier clínica
      return this.clinicasService.createUsuarioClinica(clinicaUrl, dto);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      // ADMIN solo puede crear usuarios en su propia clínica
      return this.clinicasService.createUsuarioClinica(clinicaUrl, dto);
    } else {
      throw new UnauthorizedException('Acceso denegado. No tienes permisos para crear usuarios en esta clínica.');
    }
  }

  @Patch(':clinicaUrl/usuarios/:userId/estado')
  @UseGuards(JwtAuthGuard)
  async updateUsuarioEstado(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateUsuarioEstadoDto
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede actualizar usuarios
    if (req.user.role === 'OWNER') {
      // OWNER puede actualizar usuarios en cualquier clínica
      return this.clinicasService.updateUsuarioEstado(clinicaUrl, userId, dto);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      // ADMIN solo puede actualizar usuarios en su propia clínica
      return this.clinicasService.updateUsuarioEstado(clinicaUrl, userId, dto);
    } else {
      throw new UnauthorizedException('Acceso denegado. No tienes permisos para actualizar usuarios en esta clínica.');
    }
  }

  @Get(':clinicaUrl/turnos')
  @UseGuards(JwtAuthGuard)
  async getTurnosByClinicaUrl(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: any
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
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getTurnosByClinicaUrl(clinicaUrl, filters);
    } else {
      throw new UnauthorizedException('Acceso denegado. No tienes permisos para acceder a esta clínica.');
    }
  }

  @Patch(':clinicaUrl/turnos/:turnoId/estado')
  @UseGuards(JwtAuthGuard)
  async updateTurnoEstado(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
    @Body() dto: UpdateTurnoEstadoDto
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.updateTurnoEstado(clinicaUrl, turnoId, dto);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.updateTurnoEstado(clinicaUrl, turnoId, dto);
    } else {
      throw new UnauthorizedException('Acceso denegado. No tienes permisos para actualizar turnos en esta clínica.');
    }
  }

  @Put(':clinicaUrl/turnos/:turnoId')
  @UseGuards(JwtAuthGuard)
  async updateTurno(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
    @Body() dto: CreateTurnoDto
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.updateTurno(clinicaUrl, turnoId, dto);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      return this.clinicasService.updateTurno(clinicaUrl, turnoId, dto);
    } else {
      throw new Error('Acceso denegado. No tienes permisos para actualizar turnos en esta clínica.');
    }
  }

  @Delete(':clinicaUrl/turnos/:turnoId')
  @UseGuards(JwtAuthGuard)
  async deleteTurno(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.deleteTurno(clinicaUrl, turnoId);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      return this.clinicasService.deleteTurno(clinicaUrl, turnoId);
    } else {
      throw new UnauthorizedException('Acceso denegado. No tienes permisos para eliminar turnos en esta clínica.');
    }
  }

  @Get(':clinicaUrl/turnos/stats')
  @UseGuards(JwtAuthGuard)
  async getTurnosStats(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.getTurnosStats(clinicaUrl);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      return this.clinicasService.getTurnosStats(clinicaUrl);
    } else {
      throw new UnauthorizedException('Acceso denegado. No tienes permisos para ver estadísticas de esta clínica.');
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
        filters: { type: 'object' }
      }
    }
  })
  @ApiBearerAuth()
  @Get(':clinicaUrl/turnos/search')
  @UseGuards(JwtAuthGuard)
  async searchTurnos(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() searchDto: SearchTurnosDto
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.searchTurnos(clinicaUrl, searchDto);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      return this.clinicasService.searchTurnos(clinicaUrl, searchDto);
    } else {
      throw new UnauthorizedException('Acceso denegado. No tienes permisos para buscar turnos en esta clínica.');
    }
  }

  @Get(':clinicaUrl/debug-user')
  @UseGuards(JwtAuthGuard)
  async debugUser(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string
  ) {
    return {
      user: req.user,
      clinicaUrl: clinicaUrl,
      userClinicaUrl: req.user?.clinicaUrl,
      role: req.user?.role,
      match: req.user?.clinicaUrl === clinicaUrl,
      timestamp: new Date().toISOString()
    };
  }

  @Get(':clinicaUrl/debug-turnos-simple')
  @UseGuards(JwtAuthGuard)
  async debugTurnosSimple(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string
  ) {
    try {
      console.log('=== DEBUG TURNOS SIMPLE ===');
      console.log('req.user:', req.user);
      console.log('clinicaUrl:', clinicaUrl);
      
      // Verificar que el usuario tenga acceso a esta clínica
      if (req.user.role === 'OWNER') {
        console.log('Usuario es OWNER - permitido');
      } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
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
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error en debug-turnos-simple:', error);
      return {
        success: false,
        error: error.message,
        user: req.user,
        clinicaUrl: clinicaUrl,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get(':clinicaUrl')
  @UseGuards(JwtAuthGuard)
  async getClinicaInfo(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getClinicaInfo(clinicaUrl);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getClinicaInfo(clinicaUrl);
    } else {
      throw new UnauthorizedException('Acceso denegado. No tienes permisos para acceder a esta clínica.');
    }
  }

  @Get(':clinicaUrl/configuracion')
  @UseGuards(JwtAuthGuard)
  async getClinicaConfiguracion(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getClinicaConfiguracion(clinicaUrl);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getClinicaConfiguracion(clinicaUrl);
    } else {
      throw new UnauthorizedException('Acceso denegado. No tienes permisos para acceder a esta clínica.');
    }
  }

  @Put(':clinicaUrl/configuracion')
  @UseGuards(JwtAuthGuard)
  async updateClinicaConfiguracion(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: UpdateClinicaConfiguracionDto
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.updateClinicaConfiguracion(clinicaUrl, dto);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.updateClinicaConfiguracion(clinicaUrl, dto);
    } else {
      throw new UnauthorizedException('Acceso denegado. No tienes permisos para actualizar esta clínica.');
    }
  }

  @Get(':clinicaUrl/stats')
  @UseGuards(JwtAuthGuard)
  async getClinicaStats(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getClinicaStats(clinicaUrl);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getClinicaStats(clinicaUrl);
    } else {
      throw new BadRequestException('Acceso denegado. No tienes permisos para acceder a las estadísticas de esta clínica.');
    }
  }

  @Get(':clinicaUrl/analytics')
  @UseGuards(JwtAuthGuard)
  async getClinicaAnalytics(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.getClinicaAnalytics(clinicaUrl);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      return this.clinicasService.getClinicaAnalytics(clinicaUrl);
    } else {
      throw new BadRequestException('Acceso denegado. No tienes permisos para acceder a los analytics de esta clínica.');
    }
  }

@Post(':clinicaUrl/turnos')
@UseGuards(JwtAuthGuard)
async createTurno(
  @Request() req,
  @Param('clinicaUrl') clinicaUrl: string,
  @Body() dto: CreateTurnoDto
) {
  const role = req.user.role;

  if (role !== 'OWNER' && role !== 'ADMIN' && role !== 'PATIENT') {
    throw new BadRequestException('No tienes permiso para crear un turno.');
  }

  return this.clinicasService.createTurno(clinicaUrl, dto);
}

// @Get(':clinicaUrl/turnos')
// @UseGuards(JwtAuthGuard)
// async getTurnosByClinicaUrl(
//   @Request() req,
//   @Param('clinicaUrl') clinicaUrl: string,
//   @Query() filters: GetTurnosFiltersDto
// ) {
//   // OWNER o ADMIN puede ver turnos
//   if (req.user.role === 'OWNER' || (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl)) {
//     return this.clinicasService.getTurnosByClinicaUrl(clinicaUrl, filters);
//   } else {
//     throw new Error('No tienes permisos para ver los turnos de esta clínica');
//   }
// }

} 