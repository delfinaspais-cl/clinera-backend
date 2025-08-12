import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';

@Injectable()
export class ExportService {
  
  // Generar PDF de turnos
  async generateTurnosPDF(turnos: any[], clinicaName: string, res: Response): Promise<void> {
    const doc = new PDFDocument();
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-turnos-${clinicaName}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    // Pipe el documento a la respuesta
    doc.pipe(res);
    
    // Agregar contenido al PDF
    doc.fontSize(20).text(`Reporte de Turnos - ${clinicaName}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
    doc.moveDown(2);
    
    // Tabla de turnos
    let yPosition = doc.y;
    const startX = 50;
    const colWidth = 80;
    
    // Headers de la tabla
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Paciente', startX, yPosition);
    doc.text('Email', startX + colWidth, yPosition);
    doc.text('Doctor', startX + colWidth * 2, yPosition);
    doc.text('Especialidad', startX + colWidth * 3, yPosition);
    doc.text('Fecha', startX + colWidth * 4, yPosition);
    doc.text('Hora', startX + colWidth * 5, yPosition);
    doc.text('Estado', startX + colWidth * 6, yPosition);
    
    yPosition += 20;
    doc.moveTo(startX, yPosition).lineTo(startX + colWidth * 7, yPosition).stroke();
    yPosition += 10;
    
    // Datos de turnos
    doc.fontSize(9).font('Helvetica');
    turnos.forEach((turno, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      
      doc.text(turno.paciente || '', startX, yPosition);
      doc.text(turno.email || '', startX + colWidth, yPosition);
      doc.text(turno.doctor || '', startX + colWidth * 2, yPosition);
      doc.text(turno.especialidad || '', startX + colWidth * 3, yPosition);
      doc.text(turno.fecha || '', startX + colWidth * 4, yPosition);
      doc.text(turno.hora || '', startX + colWidth * 5, yPosition);
      doc.text(turno.estado || '', startX + colWidth * 6, yPosition);
      
      yPosition += 15;
    });
    
    // Estadísticas al final
    doc.addPage();
    doc.fontSize(16).text('Estadísticas', { align: 'center' });
    doc.moveDown();
    
    const stats = this.calculateTurnosStats(turnos);
    doc.fontSize(12).text(`Total de turnos: ${stats.total}`);
    doc.text(`Pendientes: ${stats.pendientes}`);
    doc.text(`Confirmados: ${stats.confirmados}`);
    doc.text(`Cancelados: ${stats.cancelados}`);
    doc.text(`Completados: ${stats.completados}`);
    
    doc.end();
  }
  
  // Generar Excel de turnos
  async generateTurnosExcel(turnos: any[], clinicaName: string, res: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Turnos');
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-turnos-${clinicaName}-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // Agregar título
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = `Reporte de Turnos - ${clinicaName}`;
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    // Agregar fecha
    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `Generado el: ${new Date().toLocaleDateString('es-ES')}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    
    // Headers de columnas
    const headers = ['Paciente', 'Email', 'Teléfono', 'Doctor', 'Especialidad', 'Fecha', 'Hora', 'Estado', 'Motivo'];
    worksheet.addRow([]); // Fila vacía
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Datos de turnos
    turnos.forEach(turno => {
      worksheet.addRow([
        turno.paciente || '',
        turno.email || '',
        turno.telefono || '',
        turno.doctor || '',
        turno.especialidad || '',
        turno.fecha || '',
        turno.hora || '',
        turno.estado || '',
        turno.motivo || ''
      ]);
    });
    
    // Autoajustar columnas
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Agregar hoja de estadísticas
    const statsSheet = workbook.addWorksheet('Estadísticas');
    const stats = this.calculateTurnosStats(turnos);
    
    statsSheet.addRow(['Estadísticas de Turnos']);
    statsSheet.addRow(['']);
    statsSheet.addRow(['Total de turnos', stats.total]);
    statsSheet.addRow(['Pendientes', stats.pendientes]);
    statsSheet.addRow(['Confirmados', stats.confirmados]);
    statsSheet.addRow(['Cancelados', stats.cancelados]);
    statsSheet.addRow(['Completados', stats.completados]);
    
    // Enviar archivo
    await workbook.xlsx.write(res);
  }
  
  // Generar PDF de pacientes
  async generatePacientesPDF(pacientes: any[], clinicaName: string, res: Response): Promise<void> {
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-pacientes-${clinicaName}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    doc.pipe(res);
    
    doc.fontSize(20).text(`Reporte de Pacientes - ${clinicaName}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
    doc.moveDown(2);
    
    let yPosition = doc.y;
    const startX = 50;
    const colWidth = 100;
    
    // Headers
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Nombre', startX, yPosition);
    doc.text('Email', startX + colWidth, yPosition);
    doc.text('Teléfono', startX + colWidth * 2, yPosition);
    doc.text('Ubicación', startX + colWidth * 3, yPosition);
    doc.text('Estado', startX + colWidth * 4, yPosition);
    
    yPosition += 20;
    doc.moveTo(startX, yPosition).lineTo(startX + colWidth * 5, yPosition).stroke();
    yPosition += 10;
    
    // Datos
    doc.fontSize(9).font('Helvetica');
    pacientes.forEach(paciente => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      
      doc.text(paciente.nombre || '', startX, yPosition);
      doc.text(paciente.email || '', startX + colWidth, yPosition);
      doc.text(paciente.telefono || '', startX + colWidth * 2, yPosition);
      doc.text(paciente.ubicacion || '', startX + colWidth * 3, yPosition);
      doc.text(paciente.estado || '', startX + colWidth * 4, yPosition);
      
      yPosition += 15;
    });
    
    // Estadísticas
    doc.addPage();
    doc.fontSize(16).text('Estadísticas de Pacientes', { align: 'center' });
    doc.moveDown();
    
    const stats = this.calculatePacientesStats(pacientes);
    doc.fontSize(12).text(`Total de pacientes: ${stats.total}`);
    doc.text(`Activos: ${stats.activos}`);
    doc.text(`Inactivos: ${stats.inactivos}`);
    
    doc.end();
  }
  
  // Generar Excel de pacientes
  async generatePacientesExcel(pacientes: any[], clinicaName: string, res: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pacientes');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-pacientes-${clinicaName}-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // Título
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = `Reporte de Pacientes - ${clinicaName}`;
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    // Fecha
    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = `Generado el: ${new Date().toLocaleDateString('es-ES')}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    
    // Headers
    const headers = ['Nombre', 'Email', 'Teléfono', 'Ubicación', 'Estado', 'Fecha de Nacimiento', 'Notas'];
    worksheet.addRow([]);
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Datos
    pacientes.forEach(paciente => {
      worksheet.addRow([
        paciente.nombre || '',
        paciente.email || '',
        paciente.telefono || '',
        paciente.ubicacion || '',
        paciente.estado || '',
        paciente.fechaNacimiento || '',
        paciente.notas || ''
      ]);
    });
    
    // Autoajustar
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Estadísticas
    const statsSheet = workbook.addWorksheet('Estadísticas');
    const stats = this.calculatePacientesStats(pacientes);
    
    statsSheet.addRow(['Estadísticas de Pacientes']);
    statsSheet.addRow(['']);
    statsSheet.addRow(['Total de pacientes', stats.total]);
    statsSheet.addRow(['Activos', stats.activos]);
    statsSheet.addRow(['Inactivos', stats.inactivos]);
    
    await workbook.xlsx.write(res);
  }
  
  // Calcular estadísticas de turnos
  private calculateTurnosStats(turnos: any[]) {
    const stats = {
      total: turnos.length,
      pendientes: 0,
      confirmados: 0,
      cancelados: 0,
      completados: 0
    };
    
    turnos.forEach(turno => {
      switch (turno.estado?.toLowerCase()) {
        case 'pendiente':
          stats.pendientes++;
          break;
        case 'confirmado':
          stats.confirmados++;
          break;
        case 'cancelado':
          stats.cancelados++;
          break;
        case 'completado':
          stats.completados++;
          break;
      }
    });
    
    return stats;
  }
  
  // Calcular estadísticas de pacientes
  private calculatePacientesStats(pacientes: any[]) {
    const stats = {
      total: pacientes.length,
      activos: 0,
      inactivos: 0
    };
    
    pacientes.forEach(paciente => {
      if (paciente.estado?.toLowerCase() === 'activo') {
        stats.activos++;
      } else {
        stats.inactivos++;
      }
    });
    
    return stats;
  }
}
