import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppointmentWebhookService } from './appointment-webhook.service';

@Module({
  imports: [ConfigModule],
  providers: [AppointmentWebhookService],
  exports: [AppointmentWebhookService],
})
export class WebhooksModule {}

