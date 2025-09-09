import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
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
}
