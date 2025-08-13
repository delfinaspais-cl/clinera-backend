import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { PushNotificationsController } from './push-notifications.controller';
import { PushNotificationsService } from './push-notifications.service';
import { FirebaseService } from './services/firebase.service';
import { TokenCleanupService } from './services/token-cleanup.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [PushNotificationsController],
  providers: [PushNotificationsService, FirebaseService, TokenCleanupService],
  exports: [PushNotificationsService, FirebaseService],
})
export class PushNotificationsModule {}
