import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    console.log('🔐 JWT Guard - Verificando token:', {
      hasAuthHeader: !!request.headers.authorization,
      token: token ? `${token.substring(0, 10)}...` : 'null',
      nodeEnv: process.env.NODE_ENV,
      enableTestToken: process.env.ENABLE_TEST_TOKEN,
      isTestToken: token === 'test_token'
    });

    // Modo testing para desarrollo y Railway
    if ((process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.ENABLE_TEST_TOKEN === 'true') && token === 'test_token') {
      console.log('✅ Token de prueba válido, creando usuario de prueba');
      request.user = {
        id: 'test_user_id',
        email: 'test@example.com',
        role: 'OWNER',
        sub: 'test_user_id',
      };
      return true;
    }

    console.log('🔍 Token no es de prueba, verificando con JWT normal');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('🔍 JWT Guard - handleRequest:', {
      hasError: !!err,
      hasUser: !!user,
      errorMessage: err?.message,
      info: info?.message
    });

    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o expirado');
    }
    return user;
  }
}
