import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { MensajesService } from './messages.service';
import { CreateMensajeDto } from './dto/create-message.dto';
import { UpdateMensajeDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clinica/:clinicaUrl/mensajes')
export class MensajesController {
  private readonly logger = new Logger(MensajesController.name);
  
  constructor(private readonly mensajesService: MensajesService) {}

  @Get()
  findAll(@Param('clinicaUrl') clinicaUrl: string) {
    this.logger.log(`Solicitud GET para mensajes de clínica: ${clinicaUrl}`);
    return this.mensajesService.findAll(clinicaUrl);
  }

  @Get('test/:clinicaUrl')
  testFindAll(@Param('clinicaUrl') clinicaUrl: string) {
    this.logger.log(`Solicitud GET de prueba para mensajes de clínica: ${clinicaUrl}`);
    return this.mensajesService.findAll(clinicaUrl);
  }

  @Post()
  create(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateMensajeDto,
  ) {
    return this.mensajesService.create(clinicaUrl, dto);
  }

  @Patch(':mensajeId')
  update(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('mensajeId') id: string,
    @Body() dto: UpdateMensajeDto,
  ) {
    return this.mensajesService.update(clinicaUrl, id, dto);
  }

  @Delete(':mensajeId')
  remove(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('mensajeId') id: string,
  ) {
    return this.mensajesService.remove(clinicaUrl, id);
  }
}

@Controller('debug/clinica/:clinicaUrl/mensajes')
export class MensajesDebugController {
  private readonly logger = new Logger(MensajesDebugController.name);
  
  constructor(private readonly mensajesService: MensajesService) {}

  @Get()
  debugFindAll(@Param('clinicaUrl') clinicaUrl: string) {
    this.logger.log(`Solicitud GET de debug (sin auth) para mensajes de clínica: ${clinicaUrl}`);
    return this.mensajesService.findAll(clinicaUrl);
  }
}
