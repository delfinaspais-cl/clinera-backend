import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async getAllPlans() {
    return await this.plansService.getAllPlans();
  }

  @Get('popular')
  async getPopularPlan() {
    return await this.plansService.getPopularPlan();
  }

  @Get(':id')
  async getPlanById(@Param('id') planId: string) {
    return await this.plansService.getPlanById(planId);
  }

  @Get('name/:name')
  async getPlanByName(@Param('name') planName: string) {
    return await this.plansService.getPlanByName(planName);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPlan(@Body() planData: {
    nombre: string;
    tagline?: string;
    descripcion: string;
    precio: number;
    moneda?: string;
    intervalo?: string;
    popular?: boolean;
    icono?: string;
    caracteristicas: string[];
    limitaciones: any;
    orden?: number;
  }) {
    return await this.plansService.createPlan(planData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updatePlan(
    @Param('id') planId: string,
    @Body() planData: Partial<{
      nombre: string;
      tagline: string;
      descripcion: string;
      precio: number;
      moneda: string;
      intervalo: string;
      popular: boolean;
      icono: string;
      caracteristicas: string[];
      limitaciones: any;
      orden: number;
      activo: boolean;
    }>
  ) {
    return await this.plansService.updatePlan(planId, planData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePlan(@Param('id') planId: string) {
    return await this.plansService.deletePlan(planId);
  }
}