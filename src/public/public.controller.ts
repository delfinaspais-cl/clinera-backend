import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ClinicasService } from '../clinicas/clinicas.service';
import { CreateTurnoLandingDto } from './dto/create-turno-landing.dto';

@Controller('public')
export class PublicController {
  constructor(private readonly clinicasService: ClinicasService) {}

  @Get('clinica/:clinicaUrl/landing')
  async getClinicaLanding(@Param('clinicaUrl') clinicaUrl: string) {
    // Este endpoint es público, no requiere autenticación
    return this.clinicasService.getClinicaLanding(clinicaUrl);
  }

  @Post('clinica/:clinicaUrl/landing/turnos')
  async createTurnoFromLanding(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateTurnoLandingDto
  ) {
    // Este endpoint es público, no requiere autenticación
    return this.clinicasService.createTurnoFromLanding(clinicaUrl, dto);
  }
} 