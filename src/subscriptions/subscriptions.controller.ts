import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@ApiTags('Suscripciones')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('trial')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Crear suscripción trial',
    description: 'Crea una suscripción de prueba para una clínica. Requiere autenticación JWT.'
  })
  @ApiBody({
    schema: {
      example: {
        clinicaId: 'uuid-de-clinica',
        planId: 'core'
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Suscripción trial creada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createTrialSubscription(
    @Body() body: { clinicaId: string; planId: string }
  ) {
    return await this.subscriptionsService.createTrialSubscription(
      body.clinicaId,
      body.planId
    );
  }

  @Post('trial-public')
  @ApiOperation({ 
    summary: 'Crear suscripción trial (público)',
    description: 'Crea una suscripción de prueba sin necesidad de autenticación. Usado durante el registro.'
  })
  @ApiBody({
    schema: {
      example: {
        clinicaId: 'uuid-de-clinica',
        planId: 'core'
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Suscripción trial creada exitosamente' })
  async createTrialSubscriptionPublic(
    @Body() body: { clinicaId: string; planId: string }
  ) {
    console.log('🔓 Endpoint público de suscripción trial llamado:', body);
    return await this.subscriptionsService.createTrialSubscription(
      body.clinicaId,
      body.planId
    );
  }

  @Put('upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Actualizar/Mejorar suscripción',
    description: 'Actualiza el plan de suscripción de una clínica a uno superior o diferente.'
  })
  @ApiBody({
    schema: {
      example: {
        clinicaId: 'uuid-de-clinica',
        planId: 'premium',
        metodoPago: 'tarjeta'
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Suscripción actualizada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obtener suscripción de clínica',
    description: 'Retorna la suscripción activa de una clínica específica con detalles del plan.'
  })
  @ApiParam({ name: 'clinicaId', description: 'ID de la clínica', example: 'uuid-de-clinica' })
  @ApiResponse({ 
    status: 200, 
    description: 'Suscripción obtenida exitosamente',
    schema: {
      example: {
        success: true,
        subscription: {
          id: 'sub-id',
          planId: 'core',
          status: 'active',
          startDate: '2024-01-01',
          endDate: '2024-02-01',
          plan: {
            nombre: 'Core',
            precio: 29.99
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Suscripción no encontrada' })
  async getSubscriptionByClinicaId(@Param('clinicaId') clinicaId: string) {
    return await this.subscriptionsService.getSubscriptionByClinicaId(clinicaId);
  }

  @Put('cancel/:clinicaId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Cancelar suscripción',
    description: 'Cancela la suscripción activa de una clínica.'
  })
  @ApiParam({ name: 'clinicaId', description: 'ID de la clínica', example: 'uuid-de-clinica' })
  @ApiBody({
    schema: {
      example: {
        motivo: 'No necesito más el servicio'
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Suscripción cancelada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obtener uso de suscripción',
    description: 'Retorna estadísticas de uso y límites del plan actual de una clínica.'
  })
  @ApiParam({ name: 'clinicaId', description: 'ID de la clínica', example: 'uuid-de-clinica' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas de uso obtenidas',
    schema: {
      example: {
        success: true,
        usage: {
          profesionales: { used: 3, limit: 5 },
          turnos: { used: 45, limit: 100 },
          almacenamiento: { used: '256MB', limit: '1GB' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getSubscriptionUsage(@Param('clinicaId') clinicaId: string) {
    return await this.subscriptionsService.getSubscriptionUsage(clinicaId);
  }

  @Post('check-trial-expiration')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Verificar expiración de trials',
    description: 'Verifica y procesa suscripciones trial que han expirado.'
  })
  @ApiResponse({ status: 200, description: 'Verificación completada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async checkTrialExpiration() {
    return await this.subscriptionsService.checkTrialExpiration();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Listar todas las suscripciones (Admin)',
    description: 'Lista todas las suscripciones del sistema. Solo para administradores.'
  })
  @ApiResponse({ status: 200, description: 'Lista de suscripciones' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async getAllSubscriptions() {
    // Implementar si necesitas listar todas las suscripciones
    return { message: 'Endpoint para listar todas las suscripciones' };
  }
}
