import { Controller, Post, Body, Get } from '@nestjs/common';
import { ExternalEmailService } from './external-email.service';

@Controller('email-test')
export class EmailTestController {
  constructor(private readonly externalEmailService: ExternalEmailService) {}

  @Get('health')
  async testConnection() {
    return await this.externalEmailService.testConnection();
  }

  @Post('test-welcome')
  async testWelcomeEmail(@Body() body: {
    to: string;
    name: string;
    role: string;
    clinicaName?: string;
  }) {
    const generatedPassword = 'TestPassword123!'; // Contraseña de prueba
    
    return await this.externalEmailService.sendWelcomeEmail({
      to: body.to,
      name: body.name,
      email: body.to,
      password: generatedPassword,
      role: body.role,
      clinicaName: body.clinicaName || 'Clinera',
    });
  }
}

