import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clinica/:clinicaUrl/reportes')
export class ReportsController {
  constructor(private readonly reportesService: ReportsService) {}

  @Get('turnos')
  getTurnos(@Param('clinicaUrl') clinicaUrl: string) {
    return this.reportesService.turnosPorEstado(clinicaUrl);
  }

  @Get('ingresos')
  getIngresos(@Param('clinicaUrl') clinicaUrl: string) {
    return this.reportesService.totalIngresos(clinicaUrl);
  }

  @Get('pacientes')
  getPacientes(@Param('clinicaUrl') clinicaUrl: string) {
    return this.reportesService.pacientesPorMes(clinicaUrl);
  }
}
