import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PlansService } from '../plans/plans.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ClinicSubscriptionIntegrationService } from '../subscriptions/clinic-subscription-integration.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Controller('clinicas')
export class ClinicPlansController {
  constructor(
    private readonly plansService: PlansService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly clinicSubscriptionIntegrationService: ClinicSubscriptionIntegrationService,
  ) {}

  @Get('plans')
  async getAvailablePlans() {
    return await this.plansService.getAllPlans();
  }

  @Get('plans/popular')
  async getPopularPlan() {
    return await this.plansService.getPopularPlan();
  }

  @Get(':clinicaId/subscription')
  @UseGuards(JwtAuthGuard)
  async getClinicaSubscription(@Param('clinicaId') clinicaId: string) {
    return await this.subscriptionsService.getSubscriptionByClinicaId(clinicaId);
  }

  @Get(':clinicaId/subscription/usage')
  @UseGuards(JwtAuthGuard)
  async getSubscriptionUsage(@Param('clinicaId') clinicaId: string) {
    return await this.subscriptionsService.getSubscriptionUsage(clinicaId);
  }

  @Post(':clinicaId/subscription/trial')
  @UseGuards(JwtAuthGuard)
  async startTrialSubscription(
    @Param('clinicaId') clinicaId: string,
    @Body() body: { planId: string }
  ) {
    return await this.subscriptionsService.createTrialSubscription(
      clinicaId,
      body.planId
    );
  }

  @Post(':clinicaId/subscription/upgrade')
  @UseGuards(JwtAuthGuard)
  async upgradeSubscription(
    @Param('clinicaId') clinicaId: string,
    @Body() body: { 
      planId: string; 
      metodoPago?: string;
    }
  ) {
    return await this.subscriptionsService.upgradeSubscription(
      clinicaId,
      body.planId,
      body.metodoPago
    );
  }

  @Post(':clinicaId/subscription/cancel')
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

  @Get(':clinicaId/complete-info')
  @UseGuards(JwtAuthGuard)
  async getClinicaCompleteInfo(@Param('clinicaId') clinicaId: string) {
    return await this.clinicSubscriptionIntegrationService.getClinicaWithSubscription(clinicaId);
  }
}
