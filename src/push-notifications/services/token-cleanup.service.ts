import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PushNotificationsService } from '../push-notifications.service';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupInactiveTokens() {
    this.logger.log('Iniciando limpieza de tokens inactivos...');

    try {
      await this.pushNotificationsService.cleanupInactiveTokens();
      this.logger.log('Limpieza de tokens inactivos completada');
    } catch (error) {
      this.logger.error(
        'Error durante la limpieza de tokens inactivos:',
        error,
      );
    }
  }
}
