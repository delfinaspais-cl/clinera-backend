import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  UseGuards,
  Request,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRegisterDto } from '../auth/dto/user-register.dto';
import { UserLoginDto } from '../auth/dto/user-login.dto';
import { ForgotPasswordDto } from '../auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '../auth/dto/reset-password.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { CreateClinicaDto } from '../owners/dto/create-clinica.dto';
import { UpdateUserLanguageDto } from '../auth/dto/update-user-language.dto';

@ApiTags('Usuarios')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email o username ya existe' })
  async register(@Body() dto: UserRegisterDto) {
    console.log('📝 Registro de usuario recibido:', JSON.stringify(dto, null, 2));
    return this.usersService.register(dto);
  }

  @Post('test')
  @ApiOperation({ summary: 'Endpoint de prueba' })
  @ApiResponse({ status: 200, description: 'Prueba exitosa' })
  async test() {
    return {
      success: true,
      message: 'Endpoint de usuarios funcionando',
      timestamp: new Date().toISOString()
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión con username/email y password' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: UserLoginDto) {
    console.log('🔥 USERS CONTROLLER - Login endpoint llamado');
    console.log('📋 Datos recibidos:', dto);
    return this.usersService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Get('clinicas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener clínicas del usuario' })
  @ApiResponse({ status: 200, description: 'Clínicas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserClinicas(@Request() req) {
    return this.usersService.getUserClinicas(req.user.id);
  }

  @Post('clinicas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nueva clínica para el usuario' })
  @ApiResponse({ status: 201, description: 'Clínica creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createClinica(@Request() req, @Body() dto: CreateClinicaDto) {
    console.log('🏥 USERS CONTROLLER - createClinica llamado');
    console.log('🔍 DTO recibido:', JSON.stringify(dto, null, 2));
    console.log('🔍 PlanId en DTO:', dto.planId);
    console.log('🔍 User ID:', req.user.id);
    
    return this.usersService.createClinica(req.user.id, dto);
  }

  @Get('clinicas/:clinicaUrl/access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar acceso a una clínica específica' })
  @ApiResponse({ status: 200, description: 'Acceso verificado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a esta clínica' })
  async checkClinicaAccess(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    return this.usersService.checkClinicaAccess(req.user.id, clinicaUrl);
  }

  @Put('language')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar idioma preferido del usuario' })
  @ApiResponse({ status: 200, description: 'Idioma actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async updateLanguage(@Request() req, @Body() dto: UpdateUserLanguageDto) {
    return this.usersService.updateUserLanguage(req.user.id, dto.preferredLanguage);
  }

  @Get('language')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener idioma preferido del usuario' })
  @ApiResponse({ status: 200, description: 'Idioma obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserLanguage(@Request() req) {
    return this.usersService.getUserLanguage(req.user.id);
  }

  // ===== ENDPOINTS DE VALIDACIÓN =====

  @Get('validate/email/:email')
  @ApiOperation({ summary: 'Validar disponibilidad de email' })
  @ApiResponse({ 
    status: 200, 
    description: 'Validación completada',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        available: { type: 'boolean', example: true },
        message: { type: 'string', example: 'El email está disponible' }
      }
    }
  })
  async validateEmail(@Param('email') email: string, @Query('clinicaId') clinicaId?: string) {
    return this.usersService.validateEmail(email, clinicaId);
  }

  @Get('validate/username/:username')
  @ApiOperation({ summary: 'Validar disponibilidad de username' })
  @ApiResponse({ 
    status: 200, 
    description: 'Validación completada',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        available: { type: 'boolean', example: true },
        message: { type: 'string', example: 'El username está disponible' }
      }
    }
  })
  async validateUsername(@Param('username') username: string, @Query('clinicaId') clinicaId?: string) {
    return this.usersService.validateUsername(username, clinicaId);
  }

  // ===== ENDPOINTS DE RECUPERACIÓN DE CONTRASEÑA =====

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña por email' })
  @ApiResponse({
    status: 200,
    description: 'Solicitud de recuperación procesada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { 
          type: 'string', 
          example: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña' 
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o error interno' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    console.log('🔑 USERS CONTROLLER - Solicitud de recuperación de contraseña para:', dto.email);
    return this.usersService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña con token de recuperación' })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Contraseña actualizada exitosamente' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Token inválido, expirado o contraseña inválida' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    console.log('🔑 USERS CONTROLLER - Restableciendo contraseña con token:', dto.token ? dto.token.substring(0, 10) + '...' : 'undefined');
    return this.usersService.resetPassword(dto);
  }
}