import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { CreateClinicaDto } from './dto/create-clinica.dto';
import { UpdateClinicaEstadoDto } from './dto/update-clinica-estado.dto';
import { SendMensajeDto } from './dto/send-mensaje.dto';

@Controller('owner')
@UseGuards(JwtAuthGuard)
export class OwnersController {
  constructor(private ownersService: OwnersService) {}

  @Get('clinicas')
  async getAllClinicas(@Request() req) {
    // Verificar que el usuario sea OWNER
    if (req.user.role !== 'OWNER') {
      throw new Error('Acceso denegado. Solo propietarios pueden acceder.');
    }

    return this.ownersService.getAllClinicas();
  }

  @Post('clinicas')
  async createClinica(@Request() req, @Body() dto: CreateClinicaDto) {
    // Verificar que el usuario sea OWNER
    if (req.user.role !== 'OWNER') {
      throw new Error('Acceso denegado. Solo propietarios pueden acceder.');
    }

    return this.ownersService.createClinica(dto);
  }

  @Patch('clinicas/:clinicaId/estado')
  async updateClinicaEstado(
    @Request() req,
    @Param('clinicaId') clinicaId: string,
    @Body() dto: UpdateClinicaEstadoDto
  ) {
    // Verificar que el usuario sea OWNER
    if (req.user.role !== 'OWNER') {
      throw new Error('Acceso denegado. Solo propietarios pueden acceder.');
    }

    return this.ownersService.updateClinicaEstado(clinicaId, dto);
  }

  @Post('clinicas/:clinicaId/mensajes')
  async sendMensaje(
    @Request() req,
    @Param('clinicaId') clinicaId: string,
    @Body() dto: SendMensajeDto
  ) {
    // Verificar que el usuario sea OWNER
    if (req.user.role !== 'OWNER') {
      throw new Error('Acceso denegado. Solo propietarios pueden acceder.');
    }

    return this.ownersService.sendMensaje(clinicaId, dto);
  }

  @Get('stats')
  async getOwnerStats(@Request() req) {
    // Verificar que el usuario sea OWNER
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException('Acceso denegado. Solo los propietarios pueden acceder a las estadísticas.');
    }

    return this.ownersService.getOwnerStats();
  }
} 