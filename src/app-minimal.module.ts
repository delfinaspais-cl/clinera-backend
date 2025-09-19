import { Module } from '@nestjs/common';
import { AppSimpleController } from './app-simple.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppSimpleController],
  providers: [AppService],
})
export class AppMinimalModule {}
