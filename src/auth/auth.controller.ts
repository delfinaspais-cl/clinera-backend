import { Body, Controller, Post, Headers, UseGuards, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { OwnerLoginDto } from './dto/owner-login.dto';
import { ClinicaLoginDto } from './dto/clinica-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.auth.guard';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterAuthDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
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

  @Post('clinica/logout')
  @UseGuards(JwtAuthGuard)
  clinicaLogout(@Headers('authorization') auth: string) {
    const token = auth.replace('Bearer ', '');
    return this.authService.clinicaLogout(token);
  }

  // Endpoints de recuperación de contraseña
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email de recuperación enviado (si el email existe)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña' }
      }
    }
  })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('validate-reset-token/:token')
  validateResetToken(@Param('token') token: string) {
    return this.authService.validateResetToken(token);
  }
}

