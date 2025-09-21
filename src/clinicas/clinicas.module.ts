import { Module } from '@nestjs/common';
import { ClinicasController } from './clinicas.controller';
import { ClinicPlansController } from './clinic-plans.controller';
import { ClinicasService } from './clinicas.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { PlansModule } from '../plans/plans.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { OwnersService } from '../owners/owners.service';

@Module({
  imports: [PrismaModule, EmailModule, PlansModule, SubscriptionsModule],
  controllers: [ClinicasController, ClinicPlansController],
  providers: [ClinicasService, OwnersService],
  exports: [ClinicasService],
})
export class ClinicasModule {}
