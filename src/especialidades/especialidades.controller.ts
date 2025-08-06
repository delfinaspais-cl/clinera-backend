import { Controller, Get, Param, Put, Body } from '@nestjs/common';
import { EspecialidadesService } from './especialidades.service';
import { UpdateEspecialidadesDto } from './dto/update-especialidades.dto';

@Controller('clinica/:clinicaUrl/especialidades')
export class EspecialidadesController {
  constructor(private readonly especialidadesService: EspecialidadesService) {}

  @Get()
  getEspecialidades(@Param('clinicaUrl') clinicaUrl: string) {
    return this.especialidadesService.getEspecialidades(clinicaUrl);
  }

  @Put()
  updateEspecialidades(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() body: UpdateEspecialidadesDto,
  ) {
    return this.especialidadesService.updateEspecialidades(
      clinicaUrl,
      body.especialidades,
    );
  }
}
