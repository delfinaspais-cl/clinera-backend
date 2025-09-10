import { Module } from '@nestjs/common';
import { ClinicasController } from './clinicas.controller';
import { ClinicasService } from './clinicas.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [ClinicasController],
  providers: [ClinicasService],
  exports: [ClinicasService],
})
export class ClinicasModule {}
