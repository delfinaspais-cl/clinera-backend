import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { ClinicSubscriptionIntegrationService } from './clinic-subscription-integration.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, ClinicSubscriptionIntegrationService],
  exports: [SubscriptionsService, ClinicSubscriptionIntegrationService],
})
export class SubscriptionsModule {}
