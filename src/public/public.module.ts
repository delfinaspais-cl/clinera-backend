import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ClinicasModule } from '../clinicas/clinicas.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfessionalsModule } from '../professionals/professionals.module';

@Module({
  imports: [ClinicasModule, AuthModule, PrismaModule, ProfessionalsModule],
  controllers: [PublicController],
})
export class PublicModule {}
