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
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.createUserForClinica(clinicaUrl, createUserDto);
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
}
