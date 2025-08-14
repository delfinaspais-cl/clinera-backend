import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    // Logs temporales para debuggear
    console.log('=== JWT DEBUG INFO ===');
    console.log('JWT_SECRET from ConfigService:', configService.get<string>('JWT_SECRET'));
    console.log('JWT_SECRET from process.env:', process.env.JWT_SECRET);
    console.log('========================');
    
    // Usar ConfigService para obtener el JWT_SECRET (igual que JwtService)
    const jwtSecret = configService.get<string>('JWT_SECRET') || 'supersecret123';
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