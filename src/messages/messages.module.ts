import { Module } from '@nestjs/common';
import { MensajesController, MensajesDebugController } from './messages.controller';
import { ChatMessagingController } from './chat-messaging.controller';
import { MensajesService } from './messages.service';
import { ChatMessagingService } from './chat-messaging.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MensajesController, MensajesDebugController, ChatMessagingController],
  providers: [MensajesService, ChatMessagingService],
  exports: [ChatMessagingService],
})
export class MensajesModule {}
