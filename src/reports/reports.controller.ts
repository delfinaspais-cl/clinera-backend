import { Controller, Get, Param, UseGuards, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ExportService } from './services/export.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@ApiTags('Reportes y Exportación')
@UseGuards(JwtAuthGuard)
@Controller('clinica/:clinicaUrl/reportes')
export class ReportsController {
  constructor(
    private readonly reportesService: ReportsService,
    private readonly exportService: ExportService,
  ) {}

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

  // Endpoints de exportación
  @ApiOperation({ summary: 'Exportar turnos a PDF' })
  @ApiParam({ name: 'clinicaUrl', description: 'URL de la clínica' })
  @ApiResponse({
    status: 200,
    description: 'Archivo PDF descargado',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiBearerAuth()
  @Get('export/turnos/pdf')
  async exportTurnosPDF(
    @Param('clinicaUrl') clinicaUrl: string,
    @Res() res: Response,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('estado') estado?: string,
  ) {
    const turnos = await this.reportesService.getTurnosForExport(clinicaUrl, {
      fechaDesde,
      fechaHasta,
      estado,
    });
    const clinica = await this.reportesService.getClinicaInfo(clinicaUrl);
    await this.exportService.generateTurnosPDF(turnos, clinica.name, res);
  }

  @Get('export/turnos/excel')
  async exportTurnosExcel(
    @Param('clinicaUrl') clinicaUrl: string,
    @Res() res: Response,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('estado') estado?: string,
  ) {
    const turnos = await this.reportesService.getTurnosForExport(clinicaUrl, {
      fechaDesde,
      fechaHasta,
      estado,
    });
    const clinica = await this.reportesService.getClinicaInfo(clinicaUrl);
    await this.exportService.generateTurnosExcel(turnos, clinica.name, res);
  }

  @Get('export/pacientes/pdf')
  async exportPacientesPDF(
    @Param('clinicaUrl') clinicaUrl: string,
    @Res() res: Response,
    @Query('estado') estado?: string,
  ) {
    const pacientes = await this.reportesService.getPacientesForExport(
      clinicaUrl,
      { estado },
    );
    const clinica = await this.reportesService.getClinicaInfo(clinicaUrl);
    await this.exportService.generatePacientesPDF(pacientes, clinica.name, res);
  }

  @Get('export/pacientes/excel')
  async exportPacientesExcel(
    @Param('clinicaUrl') clinicaUrl: string,
    @Res() res: Response,
    @Query('estado') estado?: string,
  ) {
    const pacientes = await this.reportesService.getPacientesForExport(
      clinicaUrl,
      { estado },
    );
    const clinica = await this.reportesService.getClinicaInfo(clinicaUrl);
    await this.exportService.generatePacientesExcel(
      pacientes,
      clinica.name,
      res,
    );
  }
}
