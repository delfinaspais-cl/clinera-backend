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
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ClinicasService } from '../clinicas/clinicas.service';
import { CreateTurnoLandingDto } from './dto/create-turno-landing.dto';
import { CreateClinicaPendienteDto } from './dto/create-clinica-pendiente.dto';
import { PublicClinicasPendientesService } from './public-clinicas-pendientes.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfessionalsService } from '../professionals/professionals.service';
import { CreateProfessionalDto } from '../professionals/dto/create-professional.dto';
import { UpdateProfessionalDto } from '../professionals/dto/update-professional.dto';
import { PatientsService } from '../patients/patients.service';
import { CreatePatientDto } from '../patients/dto/create-patient.dto';
import { TratamientosService } from '../tratamientos/tratamientos.service';

@Controller('public')
export class PublicController {
  constructor(
    private readonly clinicasService: ClinicasService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly professionalsService: ProfessionalsService,
    private readonly publicClinicasPendientesService: PublicClinicasPendientesService,
    private readonly patientsService: PatientsService,
    private readonly tratamientosService: TratamientosService,
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
      const clinica = await this.prisma.clinica.findFirst({
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
      const clinica = await this.prisma.clinica.findFirst({
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
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      if (clinica.estado !== 'activa') {
        throw new BadRequestException('La clínica no está activa');
      }

      // Obtener profesionales de la clínica con sus especialidades y tratamientos
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
          especialidades: {
            include: {
              especialidad: true,
            },
          },
          tratamientos: {
            include: {
              tratamiento: true,
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
      const clinica = await this.prisma.clinica.findFirst({
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
      const existingClinica = await this.prisma.clinica.findFirst({
        where: { url: clinica.url },
      });

      if (existingClinica) {
        throw new BadRequestException(`La URL "${clinica.url}" ya está en uso`);
      }

      // Verificar si el email del admin ya existe
      const existingUser = await this.prisma.user.findFirst({
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
      const userToUpdate = await this.prisma.user.findFirst({
        where: { email: admin.email },
      });
      
      if (userToUpdate) {
        await this.prisma.user.update({
          where: { id: userToUpdate.id },
          data: { clinicaId: clinicaCreada.id },
        });
      }

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

  // ===== ENDPOINTS PÚBLICOS PARA PACIENTES =====
  
  @Post('clinica/:clinicaUrl/pacientes')
  async createPatientPublic(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreatePatientDto,
  ) {
    try {
      // Verificar que la clínica existe y está activa
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      if (clinica.estado !== 'activa') {
        throw new BadRequestException('La clínica no está activa');
      }

      // Crear el paciente usando el servicio existente
      const result = await this.patientsService.create(clinicaUrl, dto);

      return {
        success: true,
        message: 'Paciente creado exitosamente',
        data: result.data,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error creando paciente público:', error);
      throw new BadRequestException('Error al crear el paciente');
    }
  }

  // ===== ENDPOINTS PÚBLICOS PARA CITAS/TURNOS =====
  // NOTA: El endpoint para crear citas ya existe como:
  // POST /api/public/clinica/:clinicaUrl/landing/turnos
  // Este endpoint usa el servicio de clínicas y está completamente funcional

  // ===== ENDPOINTS PÚBLICOS PARA SUCURSALES (CLÍNICAS) =====
  
  @Post('clinica/:clinicaUrl/sucursales')
  async createSucursalPublic(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() createSucursalDto: any,
  ) {
    try {
      // Verificar que la clínica existe y está activa
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      if (clinica.estado !== 'activa') {
        throw new BadRequestException('La clínica no está activa');
      }

      // Crear la sucursal
      const sucursal = await this.prisma.sucursal.create({
        data: {
          nombre: createSucursalDto.nombre,
          direccion: createSucursalDto.direccion,
          telefono: createSucursalDto.telefono,
          email: createSucursalDto.email,
          ciudad: createSucursalDto.ciudad,
          provincia: createSucursalDto.provincia,
          pais: createSucursalDto.pais,
          clinicaId: clinica.id,
          estado: 'activa', // Por defecto activa
        },
      });

      return {
        success: true,
        data: sucursal,
        message: 'Sucursal creada exitosamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error creando sucursal:', error);
      throw new BadRequestException('Error al crear la sucursal');
    }
  }
  
  @Get('clinica/:clinicaUrl/sucursales')
  async getBranchesPublic(@Param('clinicaUrl') clinicaUrl: string) {
    try {
      // Verificar que la clínica existe y está activa
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      if (clinica.estado !== 'activa') {
        throw new BadRequestException('La clínica no está activa');
      }

      // Obtener sucursales reales de la base de datos
      const sucursales = await this.prisma.sucursal.findMany({
        where: { 
          clinicaId: clinica.id,
          estado: 'activa' // Solo sucursales activas
        },
        orderBy: { createdAt: 'desc' },
      });

      // Si no hay sucursales específicas, incluir la clínica principal como sucursal
      if (sucursales.length === 0) {
        return {
          success: true,
          data: [{
            id: clinica.id,
            nombre: clinica.name,
            direccion: clinica.address,
            telefono: clinica.phone,
            email: clinica.email,
            url: clinica.url,
            colorPrimario: clinica.colorPrimario,
            colorSecundario: clinica.colorSecundario,
          }],
          message: 'Sucursales obtenidas exitosamente',
        };
      }

      // Formatear las sucursales para que tengan la misma estructura que la clínica principal
      const sucursalesFormateadas = sucursales.map(sucursal => ({
        id: sucursal.id,
        nombre: sucursal.nombre,
        direccion: sucursal.direccion,
        telefono: sucursal.telefono,
        email: sucursal.email,
        url: clinica.url, // Mantener la URL de la clínica principal
        colorPrimario: clinica.colorPrimario,
        colorSecundario: clinica.colorSecundario,
        ciudad: sucursal.ciudad,
        provincia: sucursal.provincia,
        pais: sucursal.pais,
      }));

      return {
        success: true,
        data: sucursalesFormateadas,
        message: 'Sucursales obtenidas exitosamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error obteniendo sucursales:', error);
      throw new BadRequestException('Error al obtener las sucursales');
    }
  }

  // ===== ENDPOINTS PÚBLICOS PARA TRATAMIENTOS =====
  
  @Get('clinica/:clinicaUrl/tratamientos')
  async getTreatmentsPublic(@Param('clinicaUrl') clinicaUrl: string) {
    try {
      // Verificar que la clínica existe y está activa
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      if (clinica.estado !== 'activa') {
        throw new BadRequestException('La clínica no está activa');
      }

      // Obtener tratamientos de la clínica
      const tratamientos = await this.prisma.tratamiento.findMany({
        where: {
          clinicaId: clinica.id,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        data: tratamientos,
        message: 'Tratamientos obtenidos exitosamente',
        total: tratamientos.length,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error obteniendo tratamientos:', error);
      throw new BadRequestException('Error al obtener los tratamientos');
    }
  }

  // ===== ENDPOINTS PÚBLICOS PARA PROFESIONALES =====
  
  @Get('clinica/:clinicaUrl/profesionales')
  async getProfessionalsPublic(@Param('clinicaUrl') clinicaUrl: string) {
    try {
      // Verificar que la clínica existe y está activa
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      if (clinica.estado !== 'activa') {
        throw new BadRequestException('La clínica no está activa');
      }

      // Obtener profesionales de la clínica con sus especialidades y tratamientos
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
          especialidades: {
            include: {
              especialidad: true,
            },
          },
          tratamientos: {
            include: {
              tratamiento: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: professionals,
        message: 'Profesionales obtenidos exitosamente',
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

  @Get('clinica/:clinicaUrl/profesionales/:id')
  async getProfessionalPublic(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') professionalId: string,
  ) {
    try {
      // Verificar que la clínica existe y está activa
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      if (clinica.estado !== 'activa') {
        throw new BadRequestException('La clínica no está activa');
      }

      // Obtener el profesional específico con sus especialidades y tratamientos
      const professional = await this.prisma.professional.findFirst({
        where: {
          id: professionalId,
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
          especialidades: {
            include: {
              especialidad: true,
            },
          },
          tratamientos: {
            include: {
              tratamiento: true,
            },
          },
        },
      });

      if (!professional) {
        throw new BadRequestException('Profesional no encontrado o no pertenece a esta clínica');
      }

      return {
        success: true,
        data: professional,
        message: 'Profesional obtenido exitosamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error obteniendo profesional:', error);
      throw new BadRequestException('Error al obtener el profesional');
    }
  }

  // ===== ENDPOINT PARA SERVIR ARCHIVOS ESTÁTICOS =====
  
  @Get('files/*')
  async serveFile(@Param('0') filePath: string, @Res() res: Response) {
    try {
      // Construir la ruta completa del archivo
      const fullPath = path.join(process.cwd(), 'uploads', filePath);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(fullPath)) {
        throw new NotFoundException('Archivo no encontrado');
      }
      
      // Verificar que es un archivo (no un directorio)
      const stats = fs.statSync(fullPath);
      if (!stats.isFile()) {
        throw new NotFoundException('Archivo no encontrado');
      }
      
      // Determinar el tipo de contenido basado en la extensión
      const ext = path.extname(fullPath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.doc':
          contentType = 'application/msword';
          break;
        case '.docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
      }
      
      // Configurar headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
      
      // Enviar el archivo
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
      
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error sirviendo archivo:', error);
      throw new NotFoundException('Error al servir el archivo');
    }
  }
}
