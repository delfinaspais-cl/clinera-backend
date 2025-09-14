import { Controller, Get, Post, Put, Param, Body, Delete, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { EspecialidadesService } from './especialidades.service';
import { UpdateEspecialidadesDto } from './dto/update-especialidades.dto';
import { CreateEspecialidadDto } from './dto/create-especialidad.dto';
import { UpdateEspecialidadDto as UpdateSingleEspecialidadDto } from './dto/update-especialidad.dto';
import { AssignProfessionalsDto } from './dto/assign-professionals.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Controller('clinica/:clinicaUrl/especialidades')
export class EspecialidadesController {
  constructor(private readonly especialidadesService: EspecialidadesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() createEspecialidadDto: CreateEspecialidadDto,
  ) {
    return this.especialidadesService.createEspecialidad(clinicaUrl, createEspecialidadDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getEspecialidades(@Param('clinicaUrl') clinicaUrl: string) {
    return this.especialidadesService.getEspecialidades(clinicaUrl);
  }

  @Get('profesionales')
  @UseGuards(JwtAuthGuard)
  getAvailableProfessionals(@Param('clinicaUrl') clinicaUrl: string) {
    return this.especialidadesService.getAvailableProfessionals(clinicaUrl);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getEspecialidadById(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
  ) {
    return this.especialidadesService.getEspecialidadById(clinicaUrl, parseInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  updateEspecialidad(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() updateEspecialidadDto: UpdateSingleEspecialidadDto,
  ) {
    return this.especialidadesService.updateEspecialidad(clinicaUrl, parseInt(id), updateEspecialidadDto);
  }

  @Post(':id/profesionales')
  @UseGuards(JwtAuthGuard)
  assignProfessionals(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() assignProfessionalsDto: AssignProfessionalsDto,
  ) {
    return this.especialidadesService.assignProfessionals(clinicaUrl, parseInt(id), assignProfessionalsDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  removeEspecialidad(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
  ) {
    return this.especialidadesService.removeEspecialidad(clinicaUrl, parseInt(id));
  }

  // Mantener compatibilidad con el método existente
  @Put()
  @UseGuards(JwtAuthGuard)
  updateEspecialidades(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() body: UpdateEspecialidadesDto,
  ) {
    return this.especialidadesService.updateEspecialidades(
      clinicaUrl,
      body.especialidades,
    );
  }
}
