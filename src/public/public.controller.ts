import { Controller, Get, Post, Param, Body, BadRequestException } from '@nestjs/common';
import { ClinicasService } from '../clinicas/clinicas.service';
import { CreateTurnoLandingDto } from './dto/create-turno-landing.dto';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public')
export class PublicController {
  constructor(
    private readonly clinicasService: ClinicasService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {}

  @Get('clinica/:clinicaUrl/landing')
  async getClinicaLanding(@Param('clinicaUrl') clinicaUrl: string) {
    // Este endpoint es público, no requiere autenticación
    return this.clinicasService.getClinicaLanding(clinicaUrl);
  }

  @Get('clinica/:clinicaUrl/exists')
  async checkClinicaExists(@Param('clinicaUrl') clinicaUrl: string) {
    // Este endpoint es público, no requiere autenticación
    return this.clinicasService.checkClinicaExists(clinicaUrl);
  }

  @Post('clinica/:clinicaUrl/landing/turnos')
  async createTurnoFromLanding(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateTurnoLandingDto
  ) {
    // Este endpoint es público, no requiere autenticación
    return this.clinicasService.createTurnoFromLanding(clinicaUrl, dto);
  }

  // 🚨 ENDPOINT TEMPORAL - SOLO PARA PRUEBAS
  // ⚠️ REMOVER EN PRODUCCIÓN
  @Post('register-clinica-temp')
  async registerClinicaTemp(@Body() body: any) {
    console.log('🚨 Endpoint temporal usado:', body);
    
    try {
      const { admin, clinica, planId = 'professional', simulatePayment = true } = body;
      
      // Validar datos requeridos
      if (!admin || !clinica) {
        throw new BadRequestException('Datos de admin y clínica son requeridos');
      }

      // Verificar si la URL de clínica ya existe
      const existingClinica = await this.prisma.clinica.findUnique({
        where: { url: clinica.url }
      });

      if (existingClinica) {
        throw new BadRequestException(`La URL "${clinica.url}" ya está en uso`);
      }

      // Verificar si el email del admin ya existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: admin.email }
      });

      if (existingUser) {
        throw new BadRequestException(`El email "${admin.email}" ya está registrado`);
      }

      // Crear la clínica
      const clinicaData = {
        nombre: clinica.nombre,
        url: clinica.url,
        colorPrimario: clinica.color_primario || '#3B82F6',
        colorSecundario: clinica.color_secundario || '#1E40AF',
        direccion: clinica.direccion || '',
        telefono: clinica.telefono || '',
        email: clinica.email || ''
      };

      const clinicaCreada = await this.prisma.clinica.create({
        data: {
          name: clinicaData.nombre,
          url: clinicaData.url,
          colorPrimario: clinicaData.colorPrimario,
          colorSecundario: clinicaData.colorSecundario,
          address: clinicaData.direccion,
          phone: clinicaData.telefono,
          email: clinicaData.email,
          estado: 'activa',
          estadoPago: 'pagado'
        }
      });

      // Crear el usuario admin
      const adminUser = await this.authService.register({
        email: admin.email,
        password: admin.password,
        name: admin.nombre,
        role: 'ADMIN'
      });

      // Actualizar el usuario con la clínica
      await this.prisma.user.update({
        where: { email: admin.email },
        data: { clinicaId: clinicaCreada.id }
      });

      return {
        success: true,
        message: '🚨 Registro temporal exitoso - REMOVER EN PRODUCCIÓN',
        clinica: {
          id: clinicaCreada.id,
          name: clinicaCreada.name,
          url: clinicaCreada.url,
          colorPrimario: clinicaCreada.colorPrimario,
          colorSecundario: clinicaCreada.colorSecundario,
          especialidades: [],
          horarios: []
        },
        plan: planId,
        paymentSimulated: simulatePayment,
        adminCreated: true,
        adminToken: adminUser.access_token,
        warning: '⚠️ Este es un endpoint temporal solo para pruebas'
      };
    } catch (error) {
      console.error('Error en registro temporal:', error);
      throw error;
    }
  }
} 