// src/schedule/schedule.module.ts

import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.controller';
import { ScheduleController } from './schedule.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
