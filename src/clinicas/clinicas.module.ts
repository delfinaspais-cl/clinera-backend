import { Module } from '@nestjs/common';
import { ClinicasController } from './clinicas.controller';
import { ClinicPlansController } from './clinic-plans.controller';
import { ClinicasService } from './clinicas.service';
import { ClinicaLogoService } from './services/clinica-logo.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { PlansModule } from '../plans/plans.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { OwnersService } from '../owners/owners.service';
import { StorageService } from '../fichas-medicas/services/storage.service';
import { FileMicroserviceService } from '../fichas-medicas/services/file-microservice.service';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [PrismaModule, EmailModule, PlansModule, SubscriptionsModule, WebhooksModule],
  controllers: [ClinicasController, ClinicPlansController],
  providers: [
    ClinicasService, 
    OwnersService, 
    ClinicaLogoService,
    StorageService,
    FileMicroserviceService
  ],
  exports: [ClinicasService],
})
export class ClinicasModule {}
