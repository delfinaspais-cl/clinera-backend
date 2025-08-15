import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clinica/:clinicaUrl/profesionales')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  findAll(@Param('clinicaUrl') clinicaUrl: string) {
    return this.professionalsService.findAll(clinicaUrl);
  }

  @Post()
  create(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateProfessionalDto,
  ) {
    return this.professionalsService.create(clinicaUrl, dto);
  }

  @Get(':id')
  findOne(@Param('clinicaUrl') clinicaUrl: string, @Param('id') id: string) {
    return this.professionalsService.findOne(clinicaUrl, id);
  }

  @Patch(':id')
  update(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() dto: UpdateProfessionalDto,
  ) {
    return this.professionalsService.update(clinicaUrl, id, dto);
  }

  @Delete(':id')
  remove(@Param('clinicaUrl') clinicaUrl: string, @Param('id') id: string) {
    return this.professionalsService.remove(clinicaUrl, id);
  }
}
