import {
  Body,
  Controller,
  Post,
  Get,
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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { CreateClinicaDto } from '../owners/dto/create-clinica.dto';

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
    return this.usersService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión con username/email y password' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: UserLoginDto) {
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
}