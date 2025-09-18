import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Controller('clinica/:clinicaUrl/usuarios')
export class ClinicaUsuariosController {
  constructor(private readonly usersService: UsersService) {}

  // Endpoint público para crear usuarios (sin autenticación JWT)
  @Post()
  createUser(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() createUserDto: any, // Cambiado a any para evitar problemas de validación
  ) {
    console.log(`🔍 CONTROLLER: createUser llamado con clinicaUrl: ${clinicaUrl}`);
    console.log(`🔍 CONTROLLER: DTO recibido:`, JSON.stringify(createUserDto, null, 2));
    
    // Si el frontend envía clinicaId o clinicalId en el payload, usarlo; si no, usar el de la URL
    const clinicaIdFromPayload = createUserDto?.clinicaId || createUserDto?.clinicalId;
    const finalClinicaUrl = clinicaIdFromPayload ? clinicaIdFromPayload : clinicaUrl;
    
    console.log(`🔍 CONTROLLER: clinicaId del payload: ${clinicaIdFromPayload}`);
    console.log(`🔍 CONTROLLER: clinicaUrl de la URL: ${clinicaUrl}`);
    console.log(`🔍 CONTROLLER: Usando clínica: ${finalClinicaUrl}`);
    
    try {
      const result = this.usersService.createUserForClinica(finalClinicaUrl, createUserDto);
      console.log(`✅ CONTROLLER: Usuario creado exitosamente`);
      return result;
    } catch (error) {
      console.error('❌ CONTROLLER: Error en createUser:', error);
      console.error('❌ CONTROLLER: Stack trace:', error.stack);
      throw error;
    }
  }

  // Endpoint público para listar usuarios (sin autenticación JWT)
  @Get()
  findAll(@Param('clinicaUrl') clinicaUrl: string) {
    return this.usersService.findAllForClinica(clinicaUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMe(@Request() req, @Param('clinicaUrl') clinicaUrl: string) {
    return this.usersService.findMeForClinica(req.user.id, clinicaUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfileForClinica(req.user.id, clinicaUrl, dto);
  }

  // Endpoint público para listar pacientes (sin autenticación JWT)
  @Get('patients')
  async findAllPatients(@Param('clinicaUrl') clinicaUrl: string) {
    return this.usersService.findPatientsForClinica(clinicaUrl);
  }

  // Endpoint público para actualizar un usuario específico
  @Put(':userId')
  updateUser(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUserForClinica(clinicaUrl, userId, updateUserDto);
  }

  // Endpoint público para eliminar un usuario específico
  @Delete(':userId')
  deleteUser(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('userId') userId: string,
  ) {
    return this.usersService.deleteUserForClinica(clinicaUrl, userId);
  }

  // Endpoint de debug para verificar el estado de la base de datos
  @Get('debug/check-email/:email')
  async debugCheckEmail(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('email') email: string,
  ) {
    return this.usersService.debugCheckEmail(clinicaUrl, email);
  }

  // Endpoint de prueba simple
  @Get('debug/test')
  async debugTest(@Param('clinicaUrl') clinicaUrl: string) {
    console.log(`🔍 DEBUG TEST: Endpoint llamado con clinicaUrl: ${clinicaUrl}`);
    return {
      message: 'Debug test endpoint funcionando',
      clinicaUrl,
      timestamp: new Date().toISOString()
    };
  }
}
