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
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!
    });
  }

  async validate(payload: any) {
    // @Request() como req.user
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}