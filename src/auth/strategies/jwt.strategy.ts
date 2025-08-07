import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    // Logs temporales para debuggear
    console.log('=== JWT DEBUG INFO ===');
    console.log('JWT_SECRET value:', process.env.JWT_SECRET);
    console.log('JWT_SECRET type:', typeof process.env.JWT_SECRET);
    console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('JWT')));
    console.log('========================');
    
    // Solución temporal: usar valor hardcodeado si la variable no está disponible
    const jwtSecret = process.env.JWT_SECRET || 'supersecret123';
    console.log('Using JWT secret:', jwtSecret);
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret
    });
  }

  async validate(payload: any) {
    // @Request() como req.user
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}