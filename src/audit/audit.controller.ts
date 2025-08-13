import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService, AuditQueryFilters } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../permissions/guards/roles.guard';
import { Roles } from '../permissions/decorators/roles.decorator';

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Obtener logs de auditoría con filtros' })
  @ApiResponse({ status: 200, description: 'Logs de auditoría obtenidos exitosamente' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID del usuario' })
  @ApiQuery({ name: 'clinicaId', required: false, description: 'ID de la clínica' })
  @ApiQuery({ name: 'action', required: false, description: 'Tipo de acción' })
  @ApiQuery({ name: 'resource', required: false, description: 'Recurso afectado' })
  @ApiQuery({ name: 'resourceId', required: false, description: 'ID del recurso' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (ISO)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (ISO)' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados', type: Number })
  async getAuditLogs(@Query() query: any) {
    const filters: AuditQueryFilters = {
      userId: query.userId,
      clinicaId: query.clinicaId,
      action: query.action,
      resource: query.resource,
      resourceId: query.resourceId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    };

    // Parsear fechas si están presentes
    if (query.startDate) {
      filters.startDate = new Date(query.startDate);
      if (isNaN(filters.startDate.getTime())) {
        throw new BadRequestException('Fecha de inicio inválida');
      }
    }

    if (query.endDate) {
      filters.endDate = new Date(query.endDate);
      if (isNaN(filters.endDate.getTime())) {
        throw new BadRequestException('Fecha de fin inválida');
      }
    }

    return this.auditService.getAuditLogs(filters);
  }

  @Get('stats')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Obtener estadísticas de auditoría' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  @ApiQuery({ name: 'clinicaId', required: false, description: 'ID de la clínica' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (ISO)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (ISO)' })
  async getAuditStats(@Query() query: any) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (query.startDate) {
      startDate = new Date(query.startDate);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Fecha de inicio inválida');
      }
    }

    if (query.endDate) {
      endDate = new Date(query.endDate);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Fecha de fin inválida');
      }
    }

    return this.auditService.getAuditStats(query.clinicaId, startDate, endDate);
  }

  @Get('export')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Exportar logs de auditoría' })
  @ApiResponse({ status: 200, description: 'Logs exportados exitosamente' })
  @ApiQuery({ name: 'format', required: false, description: 'Formato de exportación (csv/json)', enum: ['csv', 'json'] })
  async exportAuditLogs(
    @Query() query: any,
    @Res() res: Response,
  ) {
    const filters: AuditQueryFilters = {
      userId: query.userId,
      clinicaId: query.clinicaId,
      action: query.action,
      resource: query.resource,
      resourceId: query.resourceId,
    };

    // Parsear fechas si están presentes
    if (query.startDate) {
      filters.startDate = new Date(query.startDate);
      if (isNaN(filters.startDate.getTime())) {
        throw new BadRequestException('Fecha de inicio inválida');
      }
    }

    if (query.endDate) {
      filters.endDate = new Date(query.endDate);
      if (isNaN(filters.endDate.getTime())) {
        throw new BadRequestException('Fecha de fin inválida');
      }
    }

    const format = query.format || 'json';

    if (format === 'csv') {
      const csvData = await this.auditService.exportAuditLogs(filters, 'csv');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.status(HttpStatus.OK).send(csvData);
    } else {
      const jsonData = await this.auditService.exportAuditLogs(filters, 'json');
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
      res.status(HttpStatus.OK).json(jsonData);
    }
  }

  @Get('logs/:clinicaUrl')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener logs de auditoría por clínica' })
  @ApiResponse({ status: 200, description: 'Logs de auditoría de la clínica obtenidos exitosamente' })
  @ApiParam({ name: 'clinicaUrl', description: 'URL de la clínica' })
  async getAuditLogsByClinica(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() query: any,
  ) {
    // Primero necesitamos obtener el ID de la clínica por su URL
    // Esto requeriría inyectar PrismaService o crear un método en el servicio
    // Por ahora, asumimos que el clinicaId viene en el query o se obtiene de otra manera
    
    const filters: AuditQueryFilters = {
      clinicaId: query.clinicaId, // En un caso real, obtendríamos esto de la URL
      userId: query.userId,
      action: query.action,
      resource: query.resource,
      resourceId: query.resourceId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    };

    // Parsear fechas si están presentes
    if (query.startDate) {
      filters.startDate = new Date(query.startDate);
      if (isNaN(filters.startDate.getTime())) {
        throw new BadRequestException('Fecha de inicio inválida');
      }
    }

    if (query.endDate) {
      filters.endDate = new Date(query.endDate);
      if (isNaN(filters.endDate.getTime())) {
        throw new BadRequestException('Fecha de fin inválida');
      }
    }

    return this.auditService.getAuditLogs(filters);
  }

  @Get('stats/:clinicaUrl')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener estadísticas de auditoría por clínica' })
  @ApiResponse({ status: 200, description: 'Estadísticas de la clínica obtenidas exitosamente' })
  @ApiParam({ name: 'clinicaUrl', description: 'URL de la clínica' })
  async getAuditStatsByClinica(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() query: any,
  ) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (query.startDate) {
      startDate = new Date(query.startDate);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Fecha de inicio inválida');
      }
    }

    if (query.endDate) {
      endDate = new Date(query.endDate);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Fecha de fin inválida');
      }
    }

    // En un caso real, obtendríamos el clinicaId de la URL
    return this.auditService.getAuditStats(query.clinicaId, startDate, endDate);
  }
}
