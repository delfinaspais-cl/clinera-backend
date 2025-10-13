import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Obtener el token del header Authorization
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException('Token de autorización requerido');
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    try {
      // Decodificar el token JWT
      const decoded = this.jwtService.decode(token) as any;
      
      if (!decoded) {
        throw new ForbiddenException('Token inválido');
      }

      // Verificar que el usuario tiene rol ADMIN
      if (decoded.role !== 'ADMIN') {
        throw new ForbiddenException('Solo los administradores pueden realizar esta acción');
      }

      // Agregar información del usuario al request para uso posterior
      request.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        clinicaId: decoded.clinicaId
      };

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Token inválido o expirado');
    }
  }
}
