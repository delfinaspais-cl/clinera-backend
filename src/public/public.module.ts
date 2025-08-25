import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicClinicasPendientesService } from './public-clinicas-pendientes.service';
import { ClinicasModule } from '../clinicas/clinicas.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfessionalsModule } from '../professionals/professionals.module';

@Module({
  imports: [ClinicasModule, AuthModule, PrismaModule, ProfessionalsModule],
  controllers: [PublicController],
  providers: [PublicClinicasPendientesService],
})
export class PublicModule {}
