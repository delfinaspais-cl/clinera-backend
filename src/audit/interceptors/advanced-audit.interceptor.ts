import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { Audit, AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';
import { Request } from 'express';

@Injectable()
export class AdvancedAuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditOptions>(
      AUDIT_KEY,
      context.getHandler(),
    );

    // Si el decorador indica que se debe saltar la auditoría
    if (auditOptions?.skip) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    const method = request.method;
    const url = request.url;
    const body = request.body;
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];

    // Usar opciones del decorador o valores por defecto
    const action = auditOptions?.action || this.getActionFromMethod(method);
    const resource = auditOptions?.resource || this.getResourceFromUrl(url);
    const resourceId = this.extractResourceId(url);

    return next.handle().pipe(
      tap(async (response) => {
        try {
          // Solo registrar si hay un usuario autenticado
          if (user && user.id) {
            const clinicaId = user.clinicaId || this.extractClinicaIdFromUrl(url);
            
            const metadata: any = {
              method,
              url,
              statusCode: context.switchToHttp().getResponse().statusCode,
            };

            // Incluir body si se especifica en las opciones
            if (auditOptions?.includeBody && body) {
              metadata.requestBody = this.sanitizeBody(body);
            }

            // Incluir response si se especifica en las opciones
            if (auditOptions?.includeResponse && response) {
              metadata.response = this.sanitizeResponse(response);
            }

            await this.auditService.logAuditEvent({
              userId: user.id,
              clinicaId,
              action,
              resource,
              resourceId,
              metadata,
              ipAddress,
              userAgent,
            });
          }
        } catch (error) {
          // No lanzamos el error para no interrumpir el flujo principal
          console.error('Error en advanced audit interceptor:', error);
        }
      }),
    );
  }

  private getActionFromMethod(method: string): string {
    switch (method) {
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      case 'GET':
        return 'READ';
      default:
        return 'UNKNOWN';
    }
  }

  private getResourceFromUrl(url: string): string {
    const urlParts = url.split('/').filter(part => part);
    if (urlParts.length > 0) {
      return urlParts[0].toUpperCase();
    }
    return 'UNKNOWN';
  }

  private extractResourceId(url: string): string | undefined {
    const urlParts = url.split('/').filter(part => part);
    if (urlParts.length > 1 && this.isValidId(urlParts[1])) {
      return urlParts[1];
    }
    return undefined;
  }

  private extractClinicaIdFromUrl(url: string): string | undefined {
    const match = url.match(/\/clinica\/([^\/]+)/);
    return match ? match[1] : undefined;
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for']?.toString() ||
      request.headers['x-real-ip']?.toString() ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private isValidId(id: string): boolean {
    return /^[a-zA-Z0-9-_]+$/.test(id) && id.length > 5;
  }

  private sanitizeBody(body: any): any {
    // Remover campos sensibles del body
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeResponse(response: any): any {
    // Limitar el tamaño de la respuesta para evitar logs muy grandes
    if (typeof response === 'object' && response !== null) {
      const sanitized = { ...response };
      
      // Limitar arrays a los primeros 10 elementos
      Object.keys(sanitized).forEach(key => {
        if (Array.isArray(sanitized[key]) && sanitized[key].length > 10) {
          sanitized[key] = sanitized[key].slice(0, 10);
          sanitized[`${key}_truncated`] = true;
        }
      });

      return sanitized;
    }

    return response;
  }
}
