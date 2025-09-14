import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MediosPagoService } from './medios-pago.service';
import { CreateMedioPagoDto } from './dto/create-medio-pago.dto';
import { UpdateMedioPagoDto } from './dto/update-medio-pago.dto';

@Controller('api/medios-pago')
export class GlobalMediosPagoController {
  constructor(private readonly mediosPagoService: MediosPagoService) {}

  @Post()
  create(@Body() createMedioPagoDto: CreateMedioPagoDto) {
    return this.mediosPagoService.create(createMedioPagoDto);
  }

  @Get()
  findAll(
    @Query('clinicaId') clinicaId: string,
    @Query('activo') activo?: string,
  ) {
    const activoBoolean = activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.mediosPagoService.findAll(clinicaId, activoBoolean);
  }

  @Get('stats/:clinicaId')
  getStats(@Param('clinicaId') clinicaId: string) {
    return this.mediosPagoService.getStats(clinicaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediosPagoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMedioPagoDto: UpdateMedioPagoDto) {
    return this.mediosPagoService.update(id, updateMedioPagoDto);
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.mediosPagoService.toggleStatus(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediosPagoService.remove(id);
  }
}
