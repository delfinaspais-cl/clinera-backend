import { Controller, Get, Post, Patch, Put, Delete, Param, Body, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ClinicasService } from './clinicas.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { CreateUsuarioClinicaDto } from './dto/create-usuario-clinica.dto';
import { UpdateUsuarioEstadoDto } from './dto/update-usuario-estado.dto';
import { GetTurnosFiltersDto } from './dto/get-turnos-filters.dto';
import { UpdateTurnoEstadoDto } from './dto/update-turno-estado.dto';
import { UpdateClinicaConfiguracionDto } from './dto/update-clinica-configuracion.dto';
import { CreateTurnoDto } from './dto/create-turno.dto';


@Controller('clinica')
export class ClinicasController {
  constructor(private clinicasService: ClinicasService) {}

  @Get(':clinicaUrl/usuarios')
  @UseGuards(JwtAuthGuard)
  async getUsuariosByClinicaUrl(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getUsuariosByClinicaUrl(clinicaUrl);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getUsuariosByClinicaUrl(clinicaUrl);
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
      throw new Error('Acceso denegado. No tienes permisos para crear usuarios en esta clínica.');
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
      throw new Error('Acceso denegado. No tienes permisos para actualizar usuarios en esta clínica.');
    }
  }

  @Get(':clinicaUrl/turnos')
  @UseGuards(JwtAuthGuard)
  async getTurnosByClinicaUrl(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: GetTurnosFiltersDto
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getTurnosByClinicaUrl(clinicaUrl, filters);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getTurnosByClinicaUrl(clinicaUrl, filters);
    } else {
      throw new Error('Acceso denegado. No tienes permisos para acceder a esta clínica.');
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
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.deleteTurno(clinicaUrl, turnoId);
    } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.deleteTurno(clinicaUrl, turnoId);
    } else {
      throw new Error('Acceso denegado. No tienes permisos para eliminar turnos en esta clínica.');
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
      throw new Error('Acceso denegado. No tienes permisos para acceder a esta clínica.');
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
      throw new Error('Acceso denegado. No tienes permisos para actualizar esta clínica.');
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