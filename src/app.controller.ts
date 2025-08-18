import {
  Controller,
  Get,
  Param,
  BadRequestException,
  Body,
  Res,
} from '@nestjs/common';
import { ClinicasService } from './clinicas/clinicas.service';
import { NotificationsService } from './notifications/notifications.service';
import { OwnersService } from './owners/owners.service';
import { AppService } from './app.service';
import type { Response } from 'express';

@Controller()
export class RootController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return {
      message: 'Clinera Backend API',
      version: '1.0.0',
      status: 'running',
      documentation: '/docs',
      health: '/api/health',
    };
  }

  @Get('manifest.json')
  getManifest() {
    return {
      name: 'Clinera Backend API',
      short_name: 'Clinera',
      description: 'API Backend para el sistema de gestión de clínicas',
      version: '1.0.0',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#3B82F6',
      icons: [],
    };
  }

  @Get('robots.txt')
  getRobots() {
    return `User-agent: *
Allow: /api/
Disallow: /api/auth/
Disallow: /api/admin/`;
  }

  @Get('favicon.ico')
  getFavicon(@Res() res: Response) {
    res.status(204).send(); // No content
  }
}

@Controller('api')
export class AppController {
  constructor(
    private readonly clinicasService: ClinicasService,
    private readonly notificationsService: NotificationsService,
    private readonly ownersService: OwnersService,
    private readonly appService: AppService,
  ) {}

  @Get('health')
  healthCheck() {
    return this.appService.healthCheck();
  }

  @Get('plans')
  getPlans() {
    try {
      // Definir los planes disponibles (formato esperado por frontend)
      const plans = [
        {
          id: 'core',
          name: 'CORE',
          price: 29,
          features: [
            'Hasta 5 profesionales',
            'Gestión básica de turnos',
            'Notificaciones por email',
            'Soporte por email',
          ],
        },
        {
          id: 'flow',
          name: 'FLOW',
          price: 59,
          features: [
            'Hasta 15 profesionales',
            'Gestión avanzada de turnos',
            'Notificaciones por email y SMS',
            'Reportes básicos',
            'Soporte prioritario',
          ],
        },
        {
          id: 'nexus',
          name: 'NEXUS',
          price: 99,
          features: [
            'Profesionales ilimitados',
            'Gestión completa de turnos',
            'Notificaciones por email, SMS y WhatsApp',
            'Reportes avanzados',
            'Integración con sistemas externos',
            'Soporte 24/7',
          ],
        },
      ];

      return {
        success: true,
        plans,
        message: 'Planes obtenidos exitosamente',
      };
    } catch (error) {
      console.error('Error obteniendo planes:', error);
      throw new BadRequestException('Error al obtener los planes');
    }
  }

  // Endpoint para landing público (sin autenticación)
  @Get('landing/:clinicaUrl')
  async getLanding(@Param('clinicaUrl') clinicaUrl: string) {
    try {
      return await this.clinicasService.getClinicaLanding(clinicaUrl);
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al obtener datos del landing',
      );
    }
  }
}
