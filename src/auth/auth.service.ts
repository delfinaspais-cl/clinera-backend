import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async loginWithDto(dto: LoginAuthDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.login(user);
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(dto: RegisterAuthDto) {
    try {
      const role = dto.role.toUpperCase(); // normaliza
      if (!['ADMIN', 'PROFESSIONAL', 'PATIENT'].includes(role)) {
        throw new BadRequestException('Rol inválido');
      }

      // Verificar si el email ya existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email }
      });

      if (existingUser) {
        throw new BadRequestException('El email ya está registrado');
      }

      const hashed = await bcrypt.hash(dto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashed,
          name: dto.name,
          role: role as any,
        },
      });

      return this.login(user);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error en registro:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

}

