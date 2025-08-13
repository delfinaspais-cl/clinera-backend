import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    const method = request.method;
    const url = request.url;
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];

    // Determinar la acción basada en el método HTTP
    let action = 'UNKNOWN';
    let resource = 'UNKNOWN';
    let resourceId: string | undefined;

    switch (method) {
      case 'POST':
        action = 'CREATE';
        break;
      case 'PUT':
      case 'PATCH':
        action = 'UPDATE';
        break;
      case 'DELETE':
        action = 'DELETE';
        break;
      case 'GET':
        action = 'READ';
        break;
    }

    // Determinar el recurso basado en la URL
    const urlParts = url.split('/').filter(part => part);
    if (urlParts.length > 0) {
      resource = urlParts[0].toUpperCase();
      
      // Extraer ID del recurso si está presente
      if (urlParts.length > 1 && this.isValidId(urlParts[1])) {
        resourceId = urlParts[1];
      }
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          // Solo registrar si hay un usuario autenticado
          if (user && user.id) {
            const clinicaId = user.clinicaId || this.extractClinicaIdFromUrl(url);
            
            await this.auditService.logAuditEvent({
              userId: user.id,
              clinicaId,
              action,
              resource,
              resourceId,
              metadata: {
                method,
                url,
                statusCode: context.switchToHttp().getResponse().statusCode,
                responseType: typeof response,
              },
              ipAddress,
              userAgent,
            });
          }
        } catch (error) {
          // No lanzamos el error para no interrumpir el flujo principal
          console.error('Error en audit interceptor:', error);
        }
      }),
    );
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
    // Validar si es un ID válido (CUID, UUID, o número)
    return /^[a-zA-Z0-9-_]+$/.test(id) && id.length > 5;
  }

  private extractClinicaIdFromUrl(url: string): string | undefined {
    // Extraer clinicaId de URLs como /clinica/:clinicaUrl/...
    const match = url.match(/\/clinica\/([^\/]+)/);
    return match ? match[1] : undefined;
  }
}
