import { Module } from '@nestjs/common';
import { MensajesController } from './messages.controller';
import { MensajesService } from './messages.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MensajesController],
  providers: [MensajesService],
})
export class MensajesModule {}
