import { Controller, Get, Param, Put, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { UpdateHorariosDto } from './dto/update-horario.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Controller('clinica/:clinicaUrl/horarios')
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getHorarios(@Param('clinicaUrl') clinicaUrl: string) {
    return this.horariosService.getHorarios(clinicaUrl);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  updateHorarios(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() body: UpdateHorariosDto,
  ) {
    return this.horariosService.updateHorarios(clinicaUrl, body.horarios);
  }
}
