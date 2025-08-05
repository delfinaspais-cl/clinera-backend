import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clinica/:clinicaUrl/schedules')
export class ScheduleController {
  constructor(private readonly ScheduleService: ScheduleService) {}

  @Get()
  findAll(@Param('clinicaUrl') clinicaUrl: string) {
    return this.ScheduleService.findAll(clinicaUrl);
  }

  @Get(':professionalId')
  findByProfessional(@Param('clinicaUrl') clinicaUrl: string, @Param('professionalId') profId: string) {
    return this.ScheduleService.findByProfessional(clinicaUrl, profId);
  }

  @Post()
  create(@Param('clinicaUrl') clinicaUrl: string, @Body() dto: CreateScheduleDto) {
    return this.ScheduleService.create(clinicaUrl, dto);
  }
}
export { ScheduleService };

