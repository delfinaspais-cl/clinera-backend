import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    // Modo testing para desarrollo y Railway
    if ((process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.ENABLE_TEST_TOKEN === 'true') && token === 'test_token') {
      request.user = {
        id: 'test_user_id',
        email: 'test@example.com',
        role: 'OWNER',
        sub: 'test_user_id',
      };
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o expirado');
    }
    return user;
  }
}
