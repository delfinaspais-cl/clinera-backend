import { Controller, Get, Param, Put, Body } from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { UpdateHorariosDto } from './dto/update-horario.dto';

@Controller('clinica/:clinicaUrl/horarios')
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Get()
  getHorarios(@Param('clinicaUrl') clinicaUrl: string) {
    return this.horariosService.getHorarios(clinicaUrl);
  }

  @Put()
  updateHorarios(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() body: UpdateHorariosDto,
  ) {
    return this.horariosService.updateHorarios(clinicaUrl, body.horarios);
  }
}
