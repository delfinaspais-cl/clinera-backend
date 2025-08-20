import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WebhookService } from './services/webhook.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WebhookService],
  exports: [WhatsAppService, WebhookService],
})
export class WhatsAppModule {}
