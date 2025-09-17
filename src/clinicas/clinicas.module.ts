import { Module } from '@nestjs/common';
import { ClinicasController } from './clinicas.controller';
import { ClinicasService } from './clinicas.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { OwnersService } from '../owners/owners.service';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [ClinicasController],
  providers: [ClinicasService, OwnersService],
  exports: [ClinicasService],
})
export class ClinicasModule {}
