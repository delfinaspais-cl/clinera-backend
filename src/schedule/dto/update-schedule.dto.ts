import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './create-schedule.dto';

export class UpdateAgendaDto extends PartialType(CreateScheduleDto) {}
