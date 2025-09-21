import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('trial')
  @UseGuards(JwtAuthGuard)
  async createTrialSubscription(
    @Body() body: { clinicaId: string; planId: string }
  ) {
    return await this.subscriptionsService.createTrialSubscription(
      body.clinicaId,
      body.planId
    );
  }

  @Put('upgrade')
  @UseGuards(JwtAuthGuard)
  async upgradeSubscription(
    @Body() body: { 
      clinicaId: string; 
      planId: string; 
      metodoPago?: string;
    }
  ) {
    return await this.subscriptionsService.upgradeSubscription(
      body.clinicaId,
      body.planId,
      body.metodoPago
    );
  }

  @Get('clinica/:clinicaId')
  @UseGuards(JwtAuthGuard)
  async getSubscriptionByClinicaId(@Param('clinicaId') clinicaId: string) {
    return await this.subscriptionsService.getSubscriptionByClinicaId(clinicaId);
  }

  @Put('cancel/:clinicaId')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(
    @Param('clinicaId') clinicaId: string,
    @Body() body: { motivo?: string }
  ) {
    return await this.subscriptionsService.cancelSubscription(
      clinicaId,
      body.motivo
    );
  }

  @Get('usage/:clinicaId')
  @UseGuards(JwtAuthGuard)
  async getSubscriptionUsage(@Param('clinicaId') clinicaId: string) {
    return await this.subscriptionsService.getSubscriptionUsage(clinicaId);
  }

  @Post('check-trial-expiration')
  @UseGuards(JwtAuthGuard)
  async checkTrialExpiration() {
    return await this.subscriptionsService.checkTrialExpiration();
  }

  // Endpoint para que el admin pueda gestionar suscripciones
  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  async getAllSubscriptions() {
    // Implementar si necesitas listar todas las suscripciones
    return { message: 'Endpoint para listar todas las suscripciones' };
  }
}
