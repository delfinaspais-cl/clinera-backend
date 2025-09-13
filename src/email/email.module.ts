import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ExternalEmailService } from './external-email.service';
import { EmailTestController } from './email-test.controller';

@Module({
  controllers: [EmailTestController],
  providers: [EmailService, ExternalEmailService],
  exports: [EmailService, ExternalEmailService],
})
export class EmailModule {}
