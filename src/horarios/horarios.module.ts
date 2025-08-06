import { Module } from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { HorariosController } from './horarios.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [HorariosController],
  providers: [HorariosService, PrismaService],
})
export class HorariosModule {}
