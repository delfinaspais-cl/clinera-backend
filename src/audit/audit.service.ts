import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogData {
  userId?: string;
  clinicaId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQueryFilters {
  userId?: string;
  clinicaId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Registra una acción de auditoría
   */
  async logAuditEvent(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          clinicaId: data.clinicaId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
          newValues: data.newValues ? JSON.stringify(data.newValues) : null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      this.logger.log(`Audit log created: ${data.action} on ${data.resource}`);
    } catch (error) {
      this.logger.error('Error creating audit log:', error);
      // No lanzamos el error para no interrumpir el flujo principal
    }
  }

  /**
   * Registra una acción de creación
   */
  async logCreate(
    userId: string,
    clinicaId: string,
    resource: string,
    resourceId: string,
    newValues: any,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuditEvent({
      userId,
      clinicaId,
      action: 'CREATE',
      resource,
      resourceId,
      newValues,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra una acción de actualización
   */
  async logUpdate(
    userId: string,
    clinicaId: string,
    resource: string,
    resourceId: string,
    oldValues: any,
    newValues: any,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuditEvent({
      userId,
      clinicaId,
      action: 'UPDATE',
      resource,
      resourceId,
      oldValues,
      newValues,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra una acción de eliminación
   */
  async logDelete(
    userId: string,
    clinicaId: string,
    resource: string,
    resourceId: string,
    oldValues: any,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuditEvent({
      userId,
      clinicaId,
      action: 'DELETE',
      resource,
      resourceId,
      oldValues,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra una acción de login
   */
  async logLogin(
    userId: string,
    clinicaId: string,
    success: boolean,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuditEvent({
      userId,
      clinicaId,
      action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      resource: 'AUTH',
      metadata: { ...metadata, success },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Registra una acción de logout
   */
  async logLogout(
    userId: string,
    clinicaId: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logAuditEvent({
      userId,
      clinicaId,
      action: 'LOGOUT',
      resource: 'AUTH',
      metadata,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Obtiene logs de auditoría con filtros
   */
  async getAuditLogs(filters: AuditQueryFilters) {
    const {
      userId,
      clinicaId,
      action,
      resource,
      resourceId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) where.userId = userId;
    if (clinicaId) where.clinicaId = clinicaId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map(log => ({
        ...log,
        oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
        newValues: log.newValues ? JSON.parse(log.newValues) : null,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene estadísticas de auditoría
   */
  async getAuditStats(clinicaId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (clinicaId) where.clinicaId = clinicaId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalLogs, actionsByType, resourcesByType, usersByActivity] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      this.prisma.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: true,
      }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      actionsByType,
      resourcesByType,
      topUsers: usersByActivity,
    };
  }

  /**
   * Exporta logs de auditoría
   */
  async exportAuditLogs(filters: AuditQueryFilters, format: 'csv' | 'json' = 'json') {
    const { logs } = await this.getAuditLogs({ ...filters, limit: 10000 });

    if (format === 'csv') {
      return this.convertToCSV(logs);
    }

    return logs;
  }

  private convertToCSV(logs: any[]): string {
    const headers = [
      'ID',
      'Usuario',
      'Clínica',
      'Acción',
      'Recurso',
      'ID Recurso',
      'Valores Anteriores',
      'Valores Nuevos',
      'Metadatos',
      'IP',
      'User Agent',
      'Fecha',
    ];

    const rows = logs.map(log => [
      log.id,
      log.user?.name || log.userId || 'N/A',
      log.clinica?.name || log.clinicaId || 'N/A',
      log.action,
      log.resource,
      log.resourceId || 'N/A',
      log.oldValues ? JSON.stringify(log.oldValues) : '',
      log.newValues ? JSON.stringify(log.newValues) : '',
      log.metadata ? JSON.stringify(log.metadata) : '',
      log.ipAddress || 'N/A',
      log.userAgent || 'N/A',
      log.createdAt.toISOString(),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}
