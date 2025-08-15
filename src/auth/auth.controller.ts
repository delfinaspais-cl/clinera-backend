import {
  Body,
  Controller,
  Post,
  Headers,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { OwnerLoginDto } from './dto/owner-login.dto';
import { ClinicaLoginDto } from './dto/clinica-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterAuthDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Crear usuario OWNER temporal para Railway' })
  @ApiResponse({ status: 201, description: 'OWNER creado exitosamente' })
  @Post('create-owner')
  createOwner() {
    return this.authService.createOwnerForRailway();
  }

  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @Post('login')
  login(@Body() dto: LoginAuthDto) {
    return this.authService.loginWithDto(dto);
  }

  @Post('owner/login')
  ownerLogin(@Body() dto: OwnerLoginDto) {
    return this.authService.ownerLogin(dto);
  }

  @Post('owner/logout')
  @UseGuards(JwtAuthGuard)
  ownerLogout(@Headers('authorization') auth: string) {
    const token = auth.replace('Bearer ', '');
    return this.authService.ownerLogout(token);
  }

  @Post('clinica/login')
  clinicaLogin(@Body() dto: ClinicaLoginDto) {
    return this.authService.clinicaLogin(dto);
  }

  @ApiOperation({
    summary: 'Generar token temporal con secreto hardcodeado (TEMPORAL)',
  })
  @ApiResponse({ status: 200, description: 'Token temporal' })
  @Post('temp-token')
  async generateTempToken(@Body() body: any) {
    try {
      const { clinicaUrl, username, password } = body;

      // Usar el mismo proceso de login pero con secreto hardcodeado
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new UnauthorizedException('Clínica no encontrada');
      }

      const user = await this.prisma.user.findFirst({
        where: {
          email: username,
          clinicaId: clinica.id,
        },
        include: {
          clinica: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Generar token con secreto hardcodeado
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        clinicaId: user.clinicaId,
        clinicaUrl: clinica.url,
      };

      // Usar JWT_SECRET hardcodeado
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(payload, 'supersecret123', { expiresIn: '1d' });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          clinicaId: user.clinicaId,
          clinicaUrl: clinica.url,
        },
        note: 'Token generado con secreto hardcodeado - SOLO PARA PRUEBAS',
      };
    } catch (error) {
      console.error('Error en temp-token:', error);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Verificar configuración JWT (TEMPORAL)' })
  @ApiResponse({ status: 200, description: 'Configuración JWT' })
  @Get('jwt-config')
  jwtConfig() {
    return {
      jwtSecret: process.env.JWT_SECRET ? 'CONFIGURADO' : 'NO CONFIGURADO',
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      usingFallback: !process.env.JWT_SECRET,
      fallbackSecret: 'supersecret123',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Verificar token JWT' })
  @ApiResponse({ status: 200, description: 'Token válido' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('verify-token')
  verifyToken() {
    return {
      success: true,
      message: 'Token válido',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('clinica/logout')
  @UseGuards(JwtAuthGuard)
  clinicaLogout(@Headers('authorization') auth: string) {
    const token = auth.replace('Bearer ', '');
    return this.authService.clinicaLogout(token);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('validate/email/:email')
  validateEmail(@Param('email') email: string) {
    return this.authService.validateEmail(email);
  }
}
