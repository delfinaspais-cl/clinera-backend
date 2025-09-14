import { Controller, Get, Param, UseGuards, Res, Query, Request, UnauthorizedException } from '@nestjs/common';
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
@Controller('clinica/:clinicaUrl/reportes')
export class ReportsController {
  constructor(
    private readonly reportesService: ReportsService,
    private readonly exportService: ExportService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('turnos')
  getTurnos(@Param('clinicaUrl') clinicaUrl: string) {
    return this.reportesService.turnosPorEstado(clinicaUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('ingresos')
  getIngresos(@Param('clinicaUrl') clinicaUrl: string) {
    return this.reportesService.totalIngresos(clinicaUrl);
  }

  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
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

  // Endpoint para exportar ventas a PDF
  @ApiOperation({ summary: 'Exportar ventas a PDF' })
  @ApiParam({ name: 'clinicaUrl', description: 'URL de la clínica' })
  @ApiResponse({
    status: 200,
    description: 'Archivo PDF de ventas descargado',
    content: {
      'application/pdf': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @Get('export/ventas/pdf')
  async exportVentasPDF(
    @Param('clinicaUrl') clinicaUrl: string,
    @Res() res: Response,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('estado') estado?: string,
    @Query('paciente') paciente?: string,
    @Query('profesional') profesional?: string,
    @Query('sucursal') sucursal?: string,
  ) {
    const ventas = await this.reportesService.getVentasForExport(clinicaUrl, {
      fechaDesde,
      fechaHasta,
      estado,
      paciente,
      profesional,
      sucursal,
    });
    const clinica = await this.reportesService.getClinicaInfo(clinicaUrl);
    await this.exportService.generateVentasPDF(ventas, clinica.name, res);
  }

  // Endpoint para obtener estadísticas de ventas
  @ApiOperation({ summary: 'Obtener estadísticas de ventas' })
  @ApiParam({ name: 'clinicaUrl', description: 'URL de la clínica' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de ventas obtenidas',
  })
  @UseGuards(JwtAuthGuard)
  @Get('ventas/stats')
  async getVentasStats(@Param('clinicaUrl') clinicaUrl: string) {
    return await this.reportesService.getVentasStats(clinicaUrl);
  }
}
