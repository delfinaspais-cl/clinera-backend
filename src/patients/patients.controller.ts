import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-client.dto';

@UseGuards(JwtAuthGuard)
@Controller('clinica/:clinicaUrl/pacientes')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findAll(@Param('clinicaUrl') clinicaUrl: string) {
    return this.patientsService.findAll(clinicaUrl);
  }

  @Post()
  create(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreatePatientDto,
  ) {
    return this.patientsService.create(clinicaUrl, dto);
  }

  @Get(':id')
  findOne(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
  ) {
    return this.patientsService.findOne(clinicaUrl, id);
  }

  @Patch(':id')
  update(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(clinicaUrl, id, dto);
  }

  @Get('mis-turnos')
async getMisTurnos(@Request() req) {
  return this.patientsService.getMisTurnos(req.user.email);
}
}