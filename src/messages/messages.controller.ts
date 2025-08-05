import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { MensajesService } from './messages.service';
import { CreateMensajeDto } from './dto/create-message.dto';
import { UpdateMensajeDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clinica/:clinicaUrl/mensajes')
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Get()
  findAll(@Param('clinicaUrl') clinicaUrl: string) {
    return this.mensajesService.findAll(clinicaUrl);
  }

  @Post()
  create(@Param('clinicaUrl') clinicaUrl: string, @Body() dto: CreateMensajeDto) {
    return this.mensajesService.create(clinicaUrl, dto);
  }

  @Patch(':mensajeId')
  update(@Param('clinicaUrl') clinicaUrl: string, @Param('mensajeId') id: string, @Body() dto: UpdateMensajeDto) {
    return this.mensajesService.update(clinicaUrl, id, dto);
  }
}