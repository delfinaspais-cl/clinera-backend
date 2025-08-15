import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ClinicasModule } from '../clinicas/clinicas.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ClinicasModule, AuthModule, PrismaModule],
  controllers: [PublicController],
})
export class PublicModule {}
