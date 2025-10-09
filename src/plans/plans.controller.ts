import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@ApiTags('Planes')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener todos los planes',
    description: 'Retorna la lista completa de planes de suscripción disponibles. No requiere autenticación.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de planes obtenida exitosamente',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'core',
            nombre: 'Core',
            descripcion: 'Plan básico para clínicas pequeñas',
            precio: 29.99,
            caracteristicas: ['Hasta 5 profesionales', 'Gestión básica de turnos'],
            limitaciones: { profesionales: 5, turnosPorMes: 100 }
          }
        ]
      }
    }
  })
  async getAllPlans() {
    return await this.plansService.getAllPlans();
  }

  @Get('popular')
  @ApiOperation({ 
    summary: 'Obtener plan popular',
    description: 'Retorna el plan marcado como popular o más vendido'
  })
  @ApiResponse({ status: 200, description: 'Plan popular obtenido exitosamente' })
  async getPopularPlan() {
    return await this.plansService.getPopularPlan();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener plan por ID',
    description: 'Retorna los detalles completos de un plan específico'
  })
  @ApiParam({ name: 'id', description: 'ID del plan', example: 'core' })
  @ApiResponse({ status: 200, description: 'Plan encontrado' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  async getPlanById(@Param('id') planId: string) {
    return await this.plansService.getPlanById(planId);
  }

  @Get('name/:name')
  @ApiOperation({ 
    summary: 'Obtener plan por nombre',
    description: 'Busca un plan por su nombre exacto'
  })
  @ApiParam({ name: 'name', description: 'Nombre del plan', example: 'Premium' })
  @ApiResponse({ status: 200, description: 'Plan encontrado' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  async getPlanByName(@Param('name') planName: string) {
    return await this.plansService.getPlanByName(planName);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Crear nuevo plan',
    description: 'Crea un nuevo plan de suscripción. Requiere autenticación JWT.'
  })
  @ApiBody({
    schema: {
      example: {
        nombre: 'Premium',
        tagline: 'El mejor plan para clínicas grandes',
        descripcion: 'Plan completo con todas las funcionalidades',
        precio: 99.99,
        moneda: 'USD',
        intervalo: 'mensual',
        popular: true,
        icono: '⭐',
        caracteristicas: ['Profesionales ilimitados', 'Reportes avanzados', 'Soporte 24/7'],
        limitaciones: { profesionales: -1, turnosPorMes: -1, almacenamiento: '100GB' },
        orden: 3
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Plan creado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Actualizar plan',
    description: 'Actualiza los datos de un plan existente. Requiere autenticación JWT.'
  })
  @ApiParam({ name: 'id', description: 'ID del plan a actualizar', example: 'core' })
  @ApiResponse({ status: 200, description: 'Plan actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Eliminar plan',
    description: 'Elimina un plan del sistema. Requiere autenticación JWT.'
  })
  @ApiParam({ name: 'id', description: 'ID del plan a eliminar', example: 'core' })
  @ApiResponse({ status: 200, description: 'Plan eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  async deletePlan(@Param('id') planId: string) {
    return await this.plansService.deletePlan(planId);
  }
}
