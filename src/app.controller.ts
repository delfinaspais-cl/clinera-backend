import { Controller, Get, Post, Delete, Param, Query, UseGuards, Request, BadRequestException, UnauthorizedException, Body } from '@nestjs/common';
import { ClinicasService } from './clinicas/clinicas.service';
import { NotificationsService } from './notifications/notifications.service';
import { OwnersService } from './owners/owners.service';
import { JwtAuthGuard } from './auth/jwt.auth.guard';
import { AppService } from './app.service';

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

  // Endpoint para landing público (sin autenticación)
  @Get('landing/:clinicaUrl')
  async getLanding(@Param('clinicaUrl') clinicaUrl: string) {
    try {
      return await this.clinicasService.getClinicaLanding(clinicaUrl);
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al obtener datos del landing');
    }
  }

  // Endpoint para turnos (con autenticación)
  @Get('turnos')
  @UseGuards(JwtAuthGuard)
  async getTurnos(@Query('clinicaUrl') clinicaUrl: string, @Request() req) {
    try {
      // Verificar que el usuario tenga acceso a esta clínica
      if (req.user.role === 'OWNER') {
        return await this.clinicasService.getTurnosByClinicaUrl(clinicaUrl, {});
      } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
        return await this.clinicasService.getTurnosByClinicaUrl(clinicaUrl, {});
      } else {
        throw new UnauthorizedException('Acceso denegado. No tienes permisos para acceder a esta clínica.');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Error al obtener turnos');
    }
  }

  // Endpoint para notificaciones (con autenticación)
  @Get('clinica/:clinicaUrl/notifications')
  @UseGuards(JwtAuthGuard)
  async getNotifications(@Param('clinicaUrl') clinicaUrl: string, @Request() req) {
    try {
      // Verificar que el usuario tenga acceso a esta clínica
      if (req.user.role === 'OWNER') {
        return await this.notificationsService.findAll(clinicaUrl, req.user.id);
      } else if (req.user.role === 'ADMIN' && req.user.clinicaUrl === clinicaUrl) {
        return await this.notificationsService.findAll(clinicaUrl, req.user.id);
      } else {
        throw new UnauthorizedException('Acceso denegado. No tienes permisos para acceder a esta clínica.');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Error al obtener notificaciones');
    }
  }

  // Endpoint para clínicas del owner (dashboard) - GET
  @Get('clinicas')
  @UseGuards(JwtAuthGuard)
  async getClinicas(@Request() req) {
    try {
      // Verificar que el usuario sea OWNER
      if (req.user.role !== 'OWNER') {
        throw new UnauthorizedException('Acceso denegado. Solo los propietarios pueden acceder a las clínicas.');
      }
      
      return await this.ownersService.getAllClinicas();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error al obtener clínicas:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  // Endpoint para crear clínicas del owner (dashboard) - POST
  @Post('clinicas')
  @UseGuards(JwtAuthGuard)
  async createClinica(@Body() createClinicaDto: any, @Request() req) {
    try {
      // Verificar que el usuario sea OWNER
      if (req.user.role !== 'OWNER') {
        throw new UnauthorizedException('Acceso denegado. Solo los propietarios pueden crear clínicas.');
      }
      
      return await this.ownersService.createClinica(createClinicaDto);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error al crear clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  // Endpoint para borrar clínicas del owner (dashboard) - DELETE
  @Delete('clinicas/:clinicaId')
  @UseGuards(JwtAuthGuard)
  async deleteClinica(@Param('clinicaId') clinicaId: string, @Request() req) {
    try {
      // Verificar que el usuario sea OWNER
      if (req.user.role !== 'OWNER') {
        throw new UnauthorizedException('Acceso denegado. Solo los propietarios pueden borrar clínicas.');
      }
      
      return await this.ownersService.deleteClinica(clinicaId);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error al borrar clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  // Endpoint para mensajes del owner (dashboard)
  @Get('messages')
  @UseGuards(JwtAuthGuard)
  async getMessages(@Request() req) {
    try {
      // Verificar que el usuario sea OWNER
      if (req.user.role !== 'OWNER') {
        throw new UnauthorizedException('Acceso denegado. Solo los propietarios pueden acceder a los mensajes.');
      }
      
      return await this.ownersService.getOwnerMessages();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error al obtener mensajes:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }
}
