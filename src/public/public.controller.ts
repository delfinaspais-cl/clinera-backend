import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  BadRequestException,
  Headers,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ClinicasService } from '../clinicas/clinicas.service';
import { CreateTurnoLandingDto } from './dto/create-turno-landing.dto';
import { CreateClinicaPendienteDto } from './dto/create-clinica-pendiente.dto';
import { PublicClinicasPendientesService } from './public-clinicas-pendientes.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfessionalsService } from '../professionals/professionals.service';
import { CreateProfessionalDto } from '../professionals/dto/create-professional.dto';
import { UpdateProfessionalDto } from '../professionals/dto/update-professional.dto';

@Controller('public')
export class PublicController {
  constructor(
    private readonly clinicasService: ClinicasService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly professionalsService: ProfessionalsService,
    private readonly publicClinicasPendientesService: PublicClinicasPendientesService,
  ) {}

  // ===== ENDPOINT DE REDIRECCIÓN TEMPORAL =====
  // Para manejar URLs sin /api/ desde el frontend
  // REMOVIDO: Este endpoint causaba redirección infinita
  // @Get('redirect/:clinicaUrl/exists')
  // async redirectClinicaExists(
  //   @Param('clinicaUrl') clinicaUrl: string,
  //   @Res() res: Response,
  // ) {
  //   // Redirigir a la URL correcta
  //   const correctUrl = `/api/public/clinica/${clinicaUrl}/exists`;
  //   return res.redirect(HttpStatus.MOVED_PERMANENTLY, correctUrl);
  // }

  @Get('clinica/:clinicaUrl/landing')
  async getClinicaLanding(@Param('clinicaUrl') clinicaUrl: string) {
    // Este endpoint es público, no requiere autenticación
    return this.clinicasService.getClinicaLanding(clinicaUrl);
  }

  @Get('clinica/:clinicaUrl/exists')
  async checkClinicaExists(@Param('clinicaUrl') clinicaUrl: string) {
    // Este endpoint es público, no requiere autenticación
    console.log('🔍 Verificando existencia de clínica:', clinicaUrl);
    console.log('📝 URL completa:', `/api/public/clinica/${clinicaUrl}/exists`);
    
    try {
      // Validar que clinicaUrl no esté vacío
      if (!clinicaUrl || clinicaUrl.trim() === '') {
        console.error('❌ clinicaUrl está vacío o es inválido');
        return {
          success: false,
          exists: false,
          message: 'URL de clínica inválida',
        };
      }

      const result = await this.clinicasService.checkClinicaExists(clinicaUrl);
      console.log('✅ Resultado:', result);
      
      // Agregar headers para evitar cache
      return {
        ...result,
        timestamp: new Date().toISOString(),
        debug: {
          requestedUrl: clinicaUrl,
          endpoint: '/api/public/clinica/:clinicaUrl/exists'
        }
      };
    } catch (error) {
      console.error('❌ Error en checkClinicaExists:', error);
      return {
        success: false,
        exists: false,
        message: 'Error interno del servidor',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Endpoint de prueba simple
  @Get('test')
  async testEndpoint() {
    // 🔧 CAMBIO TEMPORAL PARA FORZAR DEPLOY - REMOVER DESPUÉS
    return {
      success: true,
      message: 'Endpoint de prueba funcionando - DEPLOY FORZADO',
      timestamp: new Date().toISOString(),
      version: '1.0.1'
    };
  }

  // Endpoint de prueba específico para el problema de redirección
  @Get('debug-redirect')
  async debugRedirect() {
    return {
      success: true,
      message: 'Debug endpoint funcionando correctamente',
      timestamp: new Date().toISOString(),
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    };
  }

  // Endpoint de prueba específico para clinica-cuyo
  @Get('debug-clinica-cuyo')
  async debugClinicaCuyo() {
    try {
      const result = await this.clinicasService.checkClinicaExists('clinica-cuyo');
      return {
        success: true,
        message: 'Debug específico para clinica-cuyo',
        result,
        timestamp: new Date().toISOString(),
        endpoint: '/api/public/debug-clinica-cuyo'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error en debug de clinica-cuyo',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('clinica/:clinicaUrl/landing/turnos')
  async createTurnoFromLanding(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateTurnoLandingDto,
  ) {
    // Este endpoint es público, no requiere autenticación
    return this.clinicasService.createTurnoFromLanding(clinicaUrl, dto);
  }

  // ===== NUEVO ENDPOINT PÚBLICO PARA CREAR CLÍNICAS PENDIENTES =====
  @Post('clinicas-pendientes')
  async createClinicaPendiente(@Body() dto: CreateClinicaPendienteDto) {
    // Este endpoint es público, no requiere autenticación
    return this.publicClinicasPendientesService.createClinicaPendiente(dto);
  }

  // ===== NUEVO ENDPOINT PÚBLICO PARA CREAR PROFESIONALES =====
  
  @Post('clinica/:clinicaUrl/profesionales')
  // TODO: Implementar rate limiting para prevenir spam
  // @UseGuards(ThrottlerGuard)
  // @Throttle(5, 60) // Máximo 5 requests por minuto por IP
  async createProfessionalFromLanding(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateProfessionalDto,
    @Headers('x-clinica-token') clinicaToken?: string, // Token opcional para mayor seguridad
  ) {
    try {
      // Verificar que la clínica existe y está activa
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      if (clinica.estado !== 'activa') {
        throw new BadRequestException('La clínica no está activa');
      }

      // Validación adicional con token de clínica (opcional)
      if (clinicaToken) {
        // Aquí puedes implementar validación del token de clínica
        // Por ejemplo, verificar que el token coincida con la clínica
        if (clinicaToken !== clinica.id) {
          throw new BadRequestException('Token de clínica inválido');
        }
      }

      // Crear el profesional usando el servicio existente
      const result = await this.professionalsService.create(clinicaUrl, dto);

      return {
        success: true,
        message: 'Profesional creado exitosamente',
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear el profesional');
    }
  }

  // ===== NUEVO ENDPOINT PÚBLICO PARA ACTUALIZAR PROFESIONALES =====
  
  @Patch('clinica/:clinicaUrl/profesionales/:id')
  // TODO: Implementar rate limiting para prevenir spam
  // @UseGuards(ThrottlerGuard)
  // @Throttle(5, 60) // Máximo 5 requests por minuto por IP
  async updateProfessionalFromLanding(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') professionalId: string,
    @Body() dto: UpdateProfessionalDto,
    @Headers('x-clinica-token') clinicaToken?: string, // Token opcional para mayor seguridad
  ) {
    try {
      // Verificar que la clínica existe y está activa
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      if (clinica.estado !== 'activa') {
        throw new BadRequestException('La clínica no está activa');
      }

      // Validación adicional con token de clínica (opcional)
      if (clinicaToken) {
        // Aquí puedes implementar validación del token de clínica
        // Por ejemplo, verificar que el token coincida con la clínica
        if (clinicaToken !== clinica.id) {
          throw new BadRequestException('Token de clínica inválido');
        }
      }

      // Verificar que el profesional existe y pertenece a la clínica
      const professional = await this.prisma.professional.findFirst({
        where: {
          id: professionalId,
          user: {
            clinicaId: clinica.id,
          },
        },
        include: {
          user: true,
        },
      });

      if (!professional) {
        throw new BadRequestException('Profesional no encontrado o no pertenece a esta clínica');
      }

      // Actualizar el profesional usando el servicio existente
      const result = await this.professionalsService.update(clinicaUrl, professionalId, dto);

      return {
        success: true,
        message: 'Profesional actualizado exitosamente',
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error actualizando profesional:', error);
      throw new BadRequestException('Error al actualizar el profesional');
    }
  }

  // ===== NUEVO ENDPOINT PÚBLICO PARA OBTENER PROFESIONALES =====
  
  @Get('clinica/:clinicaUrl/profesionales')
  async getProfessionalsFromLanding(@Param('clinicaUrl') clinicaUrl: string) {
    try {
      // Verificar que la clínica existe y está activa
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      if (clinica.estado !== 'activa') {
        throw new BadRequestException('La clínica no está activa');
      }

      // Obtener profesionales de la clínica
      const professionals = await this.prisma.professional.findMany({
        where: {
          user: {
            clinicaId: clinica.id,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              estado: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        message: 'Profesionales obtenidos exitosamente',
        data: professionals,
        total: professionals.length,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error obteniendo profesionales:', error);
      throw new BadRequestException('Error al obtener los profesionales');
    }
  }

  @Get('clinica/:clinicaUrl/debug-users')
  async debugUsers(@Param('clinicaUrl') clinicaUrl: string) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              estado: true,
              createdAt: true,
            },
          },
        },
      });

      if (!clinica) {
        return { success: false, message: 'Clínica no encontrada' };
      }

      return {
        success: true,
        clinica: {
          id: clinica.id,
          nombre: clinica.name,
          url: clinica.url,
          estado: clinica.estado,
        },
        usuarios: clinica.users,
      };
    } catch (error) {
      console.error('Error en debug-users:', error);
      return { success: false, message: 'Error interno del servidor' };
    }
  }

  // 🚨 ENDPOINT TEMPORAL - SOLO PARA PRUEBAS
  // ⚠️ REMOVER EN PRODUCCIÓN
  @Post('register-clinica-temp')
  async registerClinicaTemp(@Body() body: any) {
    console.log('🚨 Endpoint temporal usado:', body);

    try {
      const {
        admin,
        clinica,
        planId = 'professional',
        simulatePayment = true,
      } = body;

      // Validar datos requeridos
      if (!admin || !clinica) {
        throw new BadRequestException(
          'Datos de admin y clínica son requeridos',
        );
      }

      // Verificar si la URL de clínica ya existe
      const existingClinica = await this.prisma.clinica.findUnique({
        where: { url: clinica.url },
      });

      if (existingClinica) {
        throw new BadRequestException(`La URL "${clinica.url}" ya está en uso`);
      }

      // Verificar si el email del admin ya existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: admin.email },
      });

      if (existingUser) {
        throw new BadRequestException(
          `El email "${admin.email}" ya está registrado`,
        );
      }

      // Crear la clínica
      const clinicaData = {
        nombre: clinica.nombre,
        url: clinica.url,
        colorPrimario: clinica.color_primario || '#3B82F6',
        colorSecundario: clinica.color_secundario || '#1E40AF',
        direccion: clinica.direccion || '',
        telefono: clinica.telefono || '',
        email: clinica.email || '',
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
          estadoPago: 'pagado',
        },
      });

      // Crear el usuario admin
      const adminUser = await this.authService.register({
        email: admin.email,
        password: admin.password,
        name: admin.nombre,
        role: 'ADMIN',
      });

      // Actualizar el usuario con la clínica
      await this.prisma.user.update({
        where: { email: admin.email },
        data: { clinicaId: clinicaCreada.id },
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
          horarios: [],
        },
        plan: planId,
        paymentSimulated: simulatePayment,
        adminCreated: true,
        adminToken: adminUser.access_token,
        warning: '⚠️ Este es un endpoint temporal solo para pruebas',
      };
    } catch (error) {
      console.error('Error en registro temporal:', error);
      throw error;
    }
  }
}
