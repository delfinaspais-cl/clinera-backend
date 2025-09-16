import {
  Controller,
  Get,
  Request,
  UseGuards,
  Patch,
  Body,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Endpoint inteligente que detecta automáticamente la clínica del contexto
  @Post()
  createUser(@Request() req, @Body() createUserDto: CreateUserDto) {
    // Verificar si hay un token de autorización en el header
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Intentar decodificar el token para obtener información de la clínica
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'supersecret123';
        const decoded = jwt.verify(token, secret);
        
        // Si el token tiene información de clínica, crear usuario en esa clínica
        if (decoded.clinicaId && decoded.clinicaUrl) {
          console.log(`🔍 Token detectado con clínica: ${decoded.clinicaUrl} (ID: ${decoded.clinicaId})`);
          return this.usersService.createUserForClinica(decoded.clinicaUrl, createUserDto);
        }
        
        // Si el token tiene clinicaId pero no clinicaUrl, buscar la clínica
        if (decoded.clinicaId && !decoded.clinicaUrl) {
          console.log(`🔍 Token detectado con clinicaId: ${decoded.clinicaId}, buscando URL de la clínica`);
          return this.usersService.createUser(createUserDto, decoded.clinicaId);
        }
      } catch (error) {
        console.warn('Error decodificando token:', error.message);
      }
    }
    
    // Si no hay token válido o no tiene información de clínica, crear usuario sin clínica específica
    console.log('🔍 No se detectó token válido con clínica, creando usuario sin clínica específica');
    return this.usersService.createUser(createUserDto);
  }


  // Endpoint autenticado para crear usuarios en la clínica del usuario logueado
  @UseGuards(JwtAuthGuard)
  @Post('auth')
  createUserWithAuth(@Request() req, @Body() createUserDto: CreateUserDto) {
    // Verificar que el usuario autenticado tenga una clínica asociada
    if (!req.user.clinicaId && req.user.role !== 'OWNER') {
      throw new Error('No tienes una clínica asociada para crear usuarios');
    }
    
    // Si es OWNER, usar la clínica del contexto o permitir crear sin clínica específica
    if (req.user.role === 'OWNER') {
      return this.usersService.createUser(createUserDto, req.user.clinicaId);
    }
    
    // Para otros roles, crear usuario en la clínica del usuario autenticado
    return this.usersService.createUserForClinica(req.user.clinicaUrl, createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMe(@Request() req) {
    return this.usersService.findMe(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('patients')
  async findAllPatients() {
    return this.usersService.findPatients();
  }

  // Endpoint público para crear usuario ADMIN (sin autenticación)
  @Post('admin')
  async createAdminUser(@Body() createUserDto: CreateUserDto & { clinicaId: string }) {
    console.log('🔓 Creando usuario ADMIN (endpoint público)');
    console.log('Datos recibidos:', JSON.stringify(createUserDto, null, 2));
    
    // Validar que se proporcione clinicaId
    if (!createUserDto.clinicaId) {
      throw new BadRequestException('clinicaId es requerido para crear usuario ADMIN');
    }
    
    // Forzar el tipo a ADMIN
    createUserDto.tipo = 'ADMIN' as any;
    
    return this.usersService.createUser(createUserDto, createUserDto.clinicaId);
  }
}
