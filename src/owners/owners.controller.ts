import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { OwnersService } from './owners.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { CreateClinicaDto } from './dto/create-clinica.dto';
import { UpdateClinicaEstadoDto } from './dto/update-clinica-estado.dto';
import { UpdateClinicaDto } from './dto/update-clinica.dto';
import { SendMensajeDto } from './dto/send-mensaje.dto';

@Controller('owner')
@UseGuards(JwtAuthGuard)
export class OwnersController {
  constructor(private ownersService: OwnersService) {}

  @Get('clinicas')
  async getAllClinicas(@Request() req) {
    if (req.user.role !== 'OWNER') {
      throw new Error('Acceso denegado. Solo propietarios pueden acceder.');
    }

    return this.ownersService.getAllClinicas();
  }

  @Post('clinicas')
  async createClinica(@Request() req, @Body() dto: CreateClinicaDto) {
    if (req.user.role !== 'OWNER') {
      throw new Error('Acceso denegado. Solo propietarios pueden acceder.');
    }

    return this.ownersService.createClinica(dto);
  }

  // ✅ Nuevo método para actualizar datos completos de la clínica
  @Put('clinicas/:clinicaId')
  async updateClinica(
    @Request() req,
    @Param('clinicaId') clinicaId: string,
    @Body() dto: UpdateClinicaDto
  ) {
    if (req.user.role !== 'OWNER') {
      throw new Error('Acceso denegado. Solo propietarios pueden acceder.');
    }

    return this.ownersService.updateClinica(clinicaId, dto);
  }

  // ⛔️ Este PATCH opcionalmente podés eliminarlo si no vas a usarlo por separado
  @Patch('clinicas/:clinicaId/estado')
  async updateClinicaEstado(
    @Request() req,
    @Param('clinicaId') clinicaId: string,
    @Body() dto: UpdateClinicaEstadoDto
  ) {
    if (req.user.role !== 'OWNER') {
      throw new Error('Acceso denegado. Solo propietarios pueden acceder.');
    }

    return this.ownersService.updateClinica(clinicaId, {
      estado: dto.estado,
    } as any); // ⚠️ Podés separar esta lógica si no querés castear
  }

  @Post('clinicas/:clinicaId/mensajes')
  async sendMensaje(
    @Request() req,
    @Param('clinicaId') clinicaId: string,
    @Body() dto: SendMensajeDto
  ) {
    if (req.user.role !== 'OWNER') {
      throw new Error('Acceso denegado. Solo propietarios pueden acceder.');
    }

    return this.ownersService.sendMensaje(clinicaId, dto);
  }

  @Get('stats')
  async getOwnerStats(@Request() req) {
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException(
        'Acceso denegado. Solo los propietarios pueden acceder a las estadísticas.'
      );
    }

    return this.ownersService.getOwnerStats();
  }
}
