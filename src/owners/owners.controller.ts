import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { OwnersService } from './owners.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { CreateClinicaDto } from './dto/create-clinica.dto';
import { UpdateClinicaEstadoDto } from './dto/update-clinica-estado.dto';
import { UpdateClinicaDto } from './dto/update-clinica.dto';
import { SendMensajeDto } from './dto/send-mensaje.dto';
import { UpdateOwnerConfigDto } from './dto/update-owner-config.dto';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('owner')
@UseGuards(JwtAuthGuard)
export class OwnersController {
  constructor(
    private ownersService: OwnersService,
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post('clinicas')
  async createClinica(@Request() req, @Body() dto: CreateClinicaDto) {
    console.log('🔍 DEBUG - Controlador createClinica llamado');
    console.log('🔍 DEBUG - Usuario:', req.user);
    console.log('🔍 DEBUG - DTO recibido en controlador:', JSON.stringify(dto, null, 2));
    
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException(
        'Acceso denegado. Solo propietarios pueden acceder.',
      );
    }

    return this.ownersService.createClinica(dto);
  }

  // ✅ Nuevo método para actualizar datos completos de la clínica
  @Put('clinicas/:clinicaId')
  async updateClinica(
    @Request() req,
    @Param('clinicaId') clinicaId: string,
    @Body() dto: UpdateClinicaDto,
  ) {
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException(
        'Acceso denegado. Solo propietarios pueden acceder.',
      );
    }

    return this.ownersService.updateClinica(clinicaId, dto);
  }

  // ⛔️ Este PATCH opcionalmente podés eliminarlo si no vas a usarlo por separado
  @Patch('clinicas/:clinicaId/estado')
  async updateClinicaEstado(
    @Request() req,
    @Param('clinicaId') clinicaId: string,
    @Body() dto: UpdateClinicaEstadoDto,
  ) {
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException(
        'Acceso denegado. Solo propietarios pueden acceder.',
      );
    }

    return this.ownersService.updateClinica(clinicaId, {
      estado: dto.estado,
    });
  }

  // ✅ Nuevo endpoint para borrar clínicas
  @Delete('clinicas/:clinicaId')
  async deleteClinica(@Request() req, @Param('clinicaId') clinicaId: string) {
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException(
        'Acceso denegado. Solo propietarios pueden borrar clínicas.',
      );
    }

    return this.ownersService.deleteClinica(clinicaId);
  }

  @Post('clinicas/:clinicaId/mensajes')
  async sendMensaje(
    @Request() req,
    @Param('clinicaId') clinicaId: string,
    @Body() dto: SendMensajeDto,
  ) {
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException(
        'Acceso denegado. Solo propietarios pueden acceder.',
      );
    }

    return this.ownersService.sendMensaje(clinicaId, dto);
  }

  @Get('stats')
  async getOwnerStats(@Request() req) {
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException(
        'Acceso denegado. Solo los propietarios pueden acceder a las estadísticas.',
      );
    }

    return this.ownersService.getOwnerStats();
  }

  @Post('messages')
  async createOwnerMessage(@Request() req, @Body() dto: SendMensajeDto) {
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException(
        'Acceso denegado. Solo los propietarios pueden crear mensajes.',
      );
    }

    return this.ownersService.createOwnerMessage(dto);
  }

  @Get('analytics')
  async getOwnerAnalytics(@Request() req) {
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException(
        'Acceso denegado. Solo los propietarios pueden acceder a los analytics.',
      );
    }

    return this.ownersService.getOwnerAnalytics();
  }

  @Get('clinicas/:clinicaId/admin-credentials')
  async getAdminCredentials(
    @Request() req,
    @Param('clinicaId') clinicaId: string,
  ) {
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException(
        'Acceso denegado. Solo los propietarios pueden acceder a las credenciales de administrador.',
      );
    }

    return this.ownersService.getAdminCredentials(clinicaId);
  }

  @Post('clinicas/:clinicaId/reset-admin-password')
  async resetAdminPassword(
    @Request() req,
    @Param('clinicaId') clinicaId: string,
  ) {
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException(
        'Acceso denegado. Solo los propietarios pueden resetear contraseñas de administrador.',
      );
    }

    return this.ownersService.resetAdminPassword(clinicaId);
  }

  @Get('notifications')
  async getOwnerNotifications(@Request() req) {
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException(
        'Acceso denegado. Solo los propietarios pueden acceder a las notificaciones.',
      );
    }

    return this.ownersService.getOwnerNotifications();
  }

  @Post('register-complete')
  async registerComplete(@Body() body: any) {
    // Endpoint para registro completo: admin + clínica + plan
    const { admin, clinica, planId, simulatePayment } = body;

    // Validar datos requeridos
    if (!admin || !clinica) {
      throw new BadRequestException('Datos de admin y clínica son requeridos');
    }

    // Crear la clínica
    const clinicaData = {
      nombre: clinica.nombre,
      url: clinica.url,
      colorPrimario: clinica.color_primario || '#3B82F6',
      colorSecundario: clinica.color_secundario || '#1E40AF',
      direccion: clinica.direccion,
      telefono: clinica.telefono,
      email: clinica.email,
      password: admin.password, // Usar la contraseña del admin
    };

    const clinicaCreada = await this.ownersService.createClinica(clinicaData);

    if (!clinicaCreada.clinica) {
      throw new BadRequestException('Error al crear la clínica');
    }

    // Crear el usuario admin
    const adminData = {
      email: admin.email,
      password: admin.password,
      name: admin.nombre,
      role: 'ADMIN' as const,
      clinicaId: clinicaCreada.clinica.id,
    };

    // Crear el usuario admin usando AuthService
    const adminUser = await this.authService.register({
      email: admin.email,
      password: admin.password,
      name: admin.nombre,
      role: 'ADMIN',
    });

    // Actualizar el usuario con la clínica
    await this.prisma.user.update({
      where: { email: admin.email },
      data: { clinicaId: clinicaCreada.clinica.id },
    });

    return {
      success: true,
      message: 'Registro completo exitoso',
      clinica: clinicaCreada.clinica,
      plan: planId,
      paymentSimulated: simulatePayment,
      adminCreated: true,
      adminToken: adminUser.access_token,
    };
  }

  // Endpoints de validación
  @Get('validate/clinica-url/:url')
  async validateClinicaUrl(@Param('url') url: string) {
    return this.ownersService.validateClinicaUrl(url);
  }

  @Get('validate/email/:email')
  async validateEmail(@Param('email') email: string) {
    return this.ownersService.validateEmail(email);
  }

  // Endpoint para actualizar configuración del propietario
  @Post('config')
  async updateOwnerConfig(@Request() req, @Body() dto: UpdateOwnerConfigDto) {
    if (req.user.role !== 'OWNER') {
      throw new BadRequestException(
        'Acceso denegado. Solo propietarios pueden actualizar su configuración.',
      );
    }

    return this.ownersService.updateOwnerConfig(req.user.id, dto);
  }
}
