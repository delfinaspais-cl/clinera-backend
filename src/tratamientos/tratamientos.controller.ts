import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { TratamientosService } from './tratamientos.service';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';
import { AssignProfessionalsDto } from './dto/assign-professionals.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Controller('clinica/:clinicaUrl/tratamientos')
export class TratamientosController {
  constructor(private readonly tratamientosService: TratamientosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() createTratamientoDto: CreateTratamientoDto,
  ) {
    return this.tratamientosService.createTratamiento(clinicaUrl, createTratamientoDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Param('clinicaUrl') clinicaUrl: string) {
    return this.tratamientosService.findAllTratamientos(clinicaUrl);
  }

  @Get('profesionales')
  @UseGuards(JwtAuthGuard)
  getAvailableProfessionals(@Param('clinicaUrl') clinicaUrl: string) {
    return this.tratamientosService.getAvailableProfessionals(clinicaUrl);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('clinicaUrl') clinicaUrl: string, @Param('id') id: string) {
    return this.tratamientosService.findTratamientoById(clinicaUrl, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() updateTratamientoDto: UpdateTratamientoDto,
  ) {
    return this.tratamientosService.updateTratamiento(clinicaUrl, id, updateTratamientoDto);
  }

  @Post(':id/profesionales')
  @UseGuards(JwtAuthGuard)
  assignProfessionals(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() assignProfessionalsDto: AssignProfessionalsDto,
  ) {
    return this.tratamientosService.assignProfessionals(clinicaUrl, id, assignProfessionalsDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('clinicaUrl') clinicaUrl: string, @Param('id') id: string) {
    return this.tratamientosService.removeTratamiento(clinicaUrl, id);
  }
}
