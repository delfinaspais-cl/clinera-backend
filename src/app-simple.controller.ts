import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppSimpleController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    console.log('🌐 Endpoint raíz llamado');
    return {
      message: 'Clinera Backend API',
      version: '1.0.0',
      status: 'running',
      health: '/health',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  healthCheck() {
    return this.appService.healthCheck();
  }
}
