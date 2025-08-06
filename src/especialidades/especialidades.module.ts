import { Module } from '@nestjs/common';
import { EspecialidadesService } from './especialidades.service';
import { EspecialidadesController } from './especialidades.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [EspecialidadesController],
  providers: [EspecialidadesService, PrismaService],
})
export class EspecialidadesModule {}
