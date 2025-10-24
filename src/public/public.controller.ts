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
  Query,
  Delete,
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
  // @Get('test')
  // async testEndpoint() {
  //   // 🔧 CAMBIO TEMPORAL PARA FORZAR DEPLOY - REMOVER DESPUÉS
  //   return {
  //     success: true,
  //     message: 'Endpoint de prueba funcionando - DEPLOY FORZADO',
  //     timestamp: new Date().toISOString(),
  //     version: '1.0.1'
  //   };
  // }

  // Endpoint de prueba específico para el problema de redirección
  // @Get('debug-redirect')
  // async debugRedirect() {
  //   return {
  //     success: true,
  //     message: 'Debug endpoint funcionando correctamente',
  //     timestamp: new Date().toISOString(),
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Cache-Control': 'no-cache, no-store, must-revalidate',
  //       'Pragma': 'no-cache',
  //       'Expires': '0'
  //     }
  //   };
  // }

  // Endpoint de prueba específico para clinica-cuyo
  // @Get('debug-clinica-cuyo')
  // async debugClinicaCuyo() {
  //   try {
  //     const result = await this.clinicasService.checkClinicaExists('clinica-cuyo');
  //     return {
  //       success: true,
  //       message: 'Debug específico para clinica-cuyo',
  //       result,
  //       timestamp: new Date().toISOString(),
  //       endpoint: '/api/public/debug-clinica-cuyo'
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: 'Error en debug de clinica-cuyo',
  //       error: error.message,
  //       timestamp: new Date().toISOString()
  //     };
  //   }
  // }

  // ✅ NUEVO ENDPOINT SIMPLIFICADO (URL más corta)
  @Post(':clinicaUrl/turnos')
  async createTurno(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateTurnoLandingDto,
  ) {
    // Este endpoint es público, no requiere autenticación
    return this.clinicasService.createTurnoFromLanding(clinicaUrl, dto);
  }

  // 🔄 ENDPOINT ORIGINAL (mantenido para compatibilidad)
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

      // Obtener profesionales de la clínica con sus especialidades, tratamientos y agendas
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
          agendas: {
            orderBy: {
              dia: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transformar los datos para incluir horariosDetallados en el formato esperado
      const professionalsWithSchedules = professionals.map(professional => {
        const horariosDetallados = (professional as any).agendas?.map((agenda: any) => ({
          dia: agenda.dia,
          horaInicio: agenda.horaInicio,
          horaFin: agenda.horaFin,
        })) || [];

        return {
          ...professional,
          horariosDetallados,
        };
      });

      return {
        success: true,
        message: 'Profesionales obtenidos exitosamente',
        data: professionalsWithSchedules,
        total: professionalsWithSchedules.length,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error obteniendo profesionales:', error);
      throw new BadRequestException('Error al obtener los profesionales');
    }
  }

  // @Get('clinica/:clinicaUrl/debug-users')
  // async debugUsers(@Param('clinicaUrl') clinicaUrl: string) {
  //   try {
  //     const clinica = await this.prisma.clinica.findFirst({
  //       where: { url: clinicaUrl },
  //       include: {
  //         users: {
  //           select: {
  //             id: true,
  //             email: true,
  //             name: true,
  //             role: true,
  //             estado: true,
  //             createdAt: true,
  //           },
  //         },
  //       },
  //     });

  //     if (!clinica) {
  //       return { success: false, message: 'Clínica no encontrada' };
  //     }

  //     return {
  //       success: true,
  //       clinica: {
  //         id: clinica.id,
  //         nombre: clinica.name,
  //         url: clinica.url,
  //         estado: clinica.estado,
  //       },
  //       usuarios: clinica.users,
  //     };
  //   } catch (error) {
  //     console.error('Error en debug-users:', error);
  //     return { success: false, message: 'Error interno del servidor' };
  //   }
  // }

  // 🚨 ENDPOINT TEMPORAL - SOLO PARA PRUEBAS
  // ⚠️ REMOVER EN PRODUCCIÓN
  // @Post('register-clinica-temp')
  // async registerClinicaTemp(@Body() body: any) {
  //   console.log('🚨 Endpoint temporal usado:', body);

  //   try {
  //     const {
  //       admin,
  //       clinica,
  //       planId = 'professional',
  //       simulatePayment = true,
  //     } = body;

  //     // Validar datos requeridos
  //     if (!admin || !clinica) {
  //       throw new BadRequestException(
  //         'Datos de admin y clínica son requeridos',
  //       );
  //     }

  //     // Normalizar URL a minúsculas
  //     const urlNormalizada = clinica.url.toLowerCase().trim();
      
  //     // Verificar si la URL de clínica ya existe
  //     const existingClinica = await this.prisma.clinica.findFirst({
  //       where: { url: urlNormalizada },
  //     });

  //     if (existingClinica) {
  //       throw new BadRequestException(`La URL "${urlNormalizada}" ya está en uso`);
  //     }

  //     // Verificar si el email del admin ya existe
  //     const existingUser = await this.prisma.user.findFirst({
  //       where: { email: admin.email },
  //     });

  //     if (existingUser) {
  //       throw new BadRequestException(
  //         `El email "${admin.email}" ya está registrado`,
  //       );
  //     }

  //     // Crear la clínica
  //     const clinicaData = {
  //       nombre: clinica.nombre,
  //       url: urlNormalizada,
  //       colorPrimario: clinica.color_primario || '#3B82F6',
  //       colorSecundario: clinica.color_secundario || '#1E40AF',
  //       direccion: clinica.direccion || '',
  //       telefono: clinica.telefono || '',
  //       email: clinica.email || '',
  //     };

  //     const clinicaCreada = await this.prisma.clinica.create({
  //       data: {
  //         name: clinicaData.nombre,
  //         url: clinicaData.url,
  //         colorPrimario: clinicaData.colorPrimario,
  //         colorSecundario: clinicaData.colorSecundario,
  //         address: clinicaData.direccion,
  //         phone: clinicaData.telefono,
  //         email: clinicaData.email,
  //         estado: 'activa',
  //         estadoPago: 'pagado',
  //       },
  //     });

  //     // Crear el usuario admin
  //     const adminUser = await this.authService.register({
  //       email: admin.email,
  //       password: admin.password,
  //       name: admin.nombre,
  //       role: 'ADMIN',
  //     });

  //     // Actualizar el usuario con la clínica
  //     const userToUpdate = await this.prisma.user.findFirst({
  //       where: { email: admin.email },
  //     });
      
  //     if (userToUpdate) {
  //       await this.prisma.user.update({
  //         where: { id: userToUpdate.id },
  //         data: { clinicaId: clinicaCreada.id },
  //       });
  //     }

  //     return {
  //       success: true,
  //       message: '🚨 Registro temporal exitoso - REMOVER EN PRODUCCIÓN',
  //       clinica: {
  //         id: clinicaCreada.id,
  //         name: clinicaCreada.name,
  //         url: clinicaCreada.url,
  //         colorPrimario: clinicaCreada.colorPrimario,
  //         colorSecundario: clinicaCreada.colorSecundario,
  //         especialidades: [],
  //         horarios: [],
  //       },
  //       plan: planId,
  //       paymentSimulated: simulatePayment,
  //       adminCreated: true,
  //       adminToken: adminUser.access_token,
  //       warning: '⚠️ Este es un endpoint temporal solo para pruebas',
  //     };
  //   } catch (error) {
  //     console.error('Error en registro temporal:', error);
  //     throw error;
  //   }
  // }

  // ===== ENDPOINTS PÚBLICOS PARA PACIENTES =====
  
  @Get('clinica/:clinicaUrl/pacientes')
  async getPatientsPublic(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query('email') email?: string,
    @Query('dni') dni?: string,
    @Query('phone') phone?: string,
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

      // Construir filtros de búsqueda
      const where: any = {
        clinicaId: clinica.id,
      };

      if (email) {
        where.email = email;
      }
      if (dni) {
        where.dni = dni;
      }
      if (phone) {
        where.phone = phone;
      }

      // Obtener pacientes con filtros
      const patients = await this.prisma.patient.findMany({
        where,
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        message: 'Pacientes obtenidos exitosamente',
        data: patients,
        total: patients.length,
        filters: {
          email,
          dni,
          phone,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error obteniendo pacientes públicos:', error);
      throw new BadRequestException('Error al obtener los pacientes');
    }
  }

  
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
  async getTreatmentsPublic(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query('allowVideocall') allowVideocall?: string,
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

      // Construir filtros de consulta
      const whereClause: any = {
        clinicaId: clinica.id,
        estado: 'activo', // Solo tratamientos activos
      };

      // Filtro por allowVideocall si se proporciona
      if (allowVideocall !== undefined) {
        const allowVideocallBool = allowVideocall.toLowerCase() === 'true';
        whereClause.allowVideocall = allowVideocallBool;
      }

      // Obtener tratamientos de la clínica
      const tratamientos = await this.prisma.tratamiento.findMany({
        where: whereClause,
        orderBy: {
          name: 'asc',
        },
      });

      // Construir mensaje de respuesta
      let message = 'Tratamientos obtenidos exitosamente';
      if (allowVideocall !== undefined) {
        const filterText = allowVideocall.toLowerCase() === 'true' ? 'con videollamada' : 'sin videollamada';
        message = `Tratamientos ${filterText} obtenidos exitosamente`;
      }

      return {
        success: true,
        data: tratamientos,
        message,
        total: tratamientos.length,
        filters: {
          allowVideocall: allowVideocall !== undefined ? allowVideocall.toLowerCase() === 'true' : null,
        },
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

      // Obtener el profesional específico con sus especialidades, tratamientos y agendas
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
          agendas: {
            orderBy: {
              dia: 'asc',
            },
          },
        },
      });

      if (!professional) {
        throw new BadRequestException('Profesional no encontrado o no pertenece a esta clínica');
      }

      // Transformar los datos para incluir horariosDetallados en el formato esperado
      const horariosDetallados = (professional as any).agendas?.map((agenda: any) => ({
        dia: agenda.dia,
        horaInicio: agenda.horaInicio,
        horaFin: agenda.horaFin,
      })) || [];

      const professionalWithSchedule = {
        ...professional,
        horariosDetallados,
      };

      return {
        success: true,
        data: professionalWithSchedule,
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

  // ===== ENDPOINT PÚBLICO PARA OBTENER DISPONIBILIDAD DE PROFESIONAL =====
  
  @Get('clinica/:clinicaUrl/profesionales/:professionalId/disponibilidad')
  async getProfessionalAvailability(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('professionalId') professionalId: string,
    @Query('fecha') fecha?: string, // Formato: YYYY-MM-DD
    @Query('fechaInicio') fechaInicio?: string, // Para rangos de fechas
    @Query('fechaFin') fechaFin?: string,
  ) {
    try {
      // Verificar que la clínica existe y está activa
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // if (clinica.estado !== 'activa') {
      //   throw new BadRequestException('La clínica no está activa');
      // }

      // Verificar que el profesional existe y pertenece a la clínica
      const professional = await this.prisma.professional.findFirst({
        where: {
          id: professionalId,
          user: {
            clinicaId: clinica.id,
          },
        },
        include: {
          agendas: {
            orderBy: {
              dia: 'asc',
            },
          },
        },
      });

      if (!professional) {
        throw new BadRequestException('Profesional no encontrado o no pertenece a esta clínica');
      }

      // Determinar el rango de fechas
      let startDate: Date;
      let endDate: Date;

      if (fecha) {
        // Una fecha específica
        startDate = new Date(fecha);
        endDate = new Date(fecha);
        endDate.setHours(23, 59, 59, 999);
      } else if (fechaInicio && fechaFin) {
        // Rango de fechas
        startDate = new Date(fechaInicio);
        endDate = new Date(fechaFin);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Por defecto, próximos 7 días
        startDate = new Date();
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
      }

      // Obtener turnos ocupados en el rango de fechas
      const turnosOcupados = await this.prisma.turno.findMany({
        where: {
          professionalId: professionalId,
          fecha: {
            gte: startDate,
            lte: endDate,
          },
          estado: {
            in: ['confirmado', 'pendiente'], // Solo turnos que están ocupando espacio
          },
        },
        select: {
          id: true,
          fecha: true,
          hora: true,
          duracionMin: true,
          estado: true,
          paciente: true,
          motivo: true,
        },
        orderBy: {
          fecha: 'asc',
        },
      });

      // Obtener bloqueos temporales del profesional en el rango de fechas
      const bloqueosTemporales = await this.prisma.professionalBlock.findMany({
        where: {
          professionalId: professionalId,
          fecha: {
            gte: startDate,
            lte: endDate,
          },
          isActive: true,
        },
        select: {
          id: true,
          fecha: true,
          horaInicio: true,
          horaFin: true,
          motivo: true,
        },
        orderBy: {
          fecha: 'asc',
        },
      });

      // Obtener horarios de atención del profesional
      const horariosAtencion = (professional as any).agendas?.map((agenda: any) => ({
        dia: agenda.dia,
        horaInicio: agenda.horaInicio,
        horaFin: agenda.horaFin,
      })) || [];

      // Generar slots de tiempo disponibles
      const disponibilidad = this.generateAvailableSlots(
        startDate,
        endDate,
        horariosAtencion,
        turnosOcupados,
        bloqueosTemporales,
        professional.defaultDurationMin,
        professional.bufferMin,
      );

      return {
        success: true,
        data: {
          professional: {
            id: professional.id,
            name: professional.name,
            defaultDurationMin: professional.defaultDurationMin,
            bufferMin: professional.bufferMin,
          },
          horariosAtencion,
          turnosOcupados,
          bloqueosTemporales,
          disponibilidad,
          rangoFechas: {
            inicio: startDate.toISOString(),
            fin: endDate.toISOString(),
          },
        },
        message: 'Disponibilidad obtenida exitosamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error obteniendo disponibilidad:', error);
      throw new BadRequestException('Error al obtener la disponibilidad');
    }
  }

  // Método auxiliar para generar slots de tiempo disponibles
  private generateAvailableSlots(
    startDate: Date,
    endDate: Date,
    horariosAtencion: any[],
    turnosOcupados: any[],
    bloqueosTemporales: any[],
    duracionMin: number,
    bufferMin: number,
  ) {
    const disponibilidad: any[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const diaSemana = this.getDayOfWeek(currentDate);
      const horarioDia = horariosAtencion.find(h => h.dia === diaSemana);

      if (horarioDia) {
        const fechaStr = currentDate.toISOString().split('T')[0];
        const turnosDelDia = turnosOcupados.filter(t => 
          t.fecha.toISOString().split('T')[0] === fechaStr
        );
        const bloqueosDelDia = bloqueosTemporales.filter(b => 
          b.fecha.toISOString().split('T')[0] === fechaStr
        );

        const slotsDisponibles = this.generateSlotsForDay(
          fechaStr,
          horarioDia.horaInicio,
          horarioDia.horaFin,
          duracionMin,
          bufferMin,
          turnosDelDia,
          bloqueosDelDia,
        );

        if (slotsDisponibles.length > 0) {
          disponibilidad.push({
            fecha: fechaStr,
            dia: diaSemana,
            slots: slotsDisponibles,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return disponibilidad;
  }

  private generateSlotsForDay(
    fecha: string,
    horaInicio: string,
    horaFin: string,
    duracionMin: number,
    bufferMin: number,
    turnosOcupados: any[],
    bloqueosDelDia: any[],
  ) {
    const slots: any[] = [];
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFinNum, minFin] = horaFin.split(':').map(Number);

    let currentTime = new Date();
    currentTime.setHours(horaIni, minIni, 0, 0);

    const endTime = new Date();
    endTime.setHours(horaFinNum, minFin, 0, 0);

    while (currentTime < endTime) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + duracionMin * 60000);

      // Verificar si este slot está ocupado por turnos
      const isOccupiedByTurno = turnosOcupados.some(turno => {
        const [turnoHora, turnoMin] = turno.hora.split(':').map(Number);
        const turnoStart = new Date();
        turnoStart.setHours(turnoHora, turnoMin, 0, 0);
        const turnoEnd = new Date(turnoStart.getTime() + turno.duracionMin * 60000);

        // Verificar solapamiento
        return (slotStart < turnoEnd && slotEnd > turnoStart);
      });

      // Verificar si este slot está bloqueado temporalmente
      const isBlocked = bloqueosDelDia.some(bloqueo => {
        const [bloqueoHoraIni, bloqueoMinIni] = bloqueo.horaInicio.split(':').map(Number);
        const [bloqueoHoraFin, bloqueoMinFin] = bloqueo.horaFin.split(':').map(Number);
        
        const bloqueoStart = new Date();
        bloqueoStart.setHours(bloqueoHoraIni, bloqueoMinIni, 0, 0);
        const bloqueoEnd = new Date();
        bloqueoEnd.setHours(bloqueoHoraFin, bloqueoMinFin, 0, 0);

        // Verificar solapamiento con bloqueo
        return (slotStart < bloqueoEnd && slotEnd > bloqueoStart);
      });

      if (!isOccupiedByTurno && !isBlocked && slotEnd <= endTime) {
        slots.push({
          horaInicio: slotStart.toTimeString().slice(0, 5),
          horaFin: slotEnd.toTimeString().slice(0, 5),
          duracionMin: duracionMin,
          disponible: true,
        });
      }

      // Avanzar al siguiente slot (duración + buffer)
      currentTime.setTime(currentTime.getTime() + (duracionMin + bufferMin) * 60000);
    }

    return slots;
  }

  private getDayOfWeek(date: Date): string {
    const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    return days[date.getDay()];
  }

  // ===== ENDPOINTS PARA GESTIONAR BLOQUEOS TEMPORALES =====
  
  @Get('clinica/:clinicaUrl/profesionales/:professionalId/bloqueos')
  async getProfessionalBlocks(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('professionalId') professionalId: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Verificar que el profesional existe y pertenece a la clínica
      const professional = await this.prisma.professional.findFirst({
        where: {
          id: professionalId,
          user: {
            clinicaId: clinica.id,
          },
        },
      });

      if (!professional) {
        throw new BadRequestException('Profesional no encontrado o no pertenece a esta clínica');
      }

      // Construir filtros de fecha
      const where: any = {
        professionalId,
        isActive: true,
      };

      if (fechaInicio && fechaFin) {
        where.fecha = {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        };
      }

      const bloqueos = await this.prisma.professionalBlock.findMany({
        where,
        orderBy: [
          { fecha: 'asc' },
          { horaInicio: 'asc' }
        ]
      });

      return {
        success: true,
        data: bloqueos,
        message: 'Bloqueos obtenidos exitosamente'
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error obteniendo bloqueos:', error);
      throw new BadRequestException('Error al obtener los bloqueos');
    }
  }

  @Post('clinica/:clinicaUrl/profesionales/:professionalId/bloqueos')
  async createProfessionalBlock(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('professionalId') professionalId: string,
    @Body() createBlockDto: {
      fecha: string;
      horaInicio: string;
      horaFin: string;
      motivo?: string;
    },
  ) {
    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Verificar que el profesional existe y pertenece a la clínica
      const professional = await this.prisma.professional.findFirst({
        where: {
          id: professionalId,
          user: {
            clinicaId: clinica.id,
          },
        },
      });

      if (!professional) {
        throw new BadRequestException('Profesional no encontrado o no pertenece a esta clínica');
      }

      // Validar que la fecha no sea en el pasado
      const fechaBloqueo = new Date(createBlockDto.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaBloqueo < hoy) {
        throw new BadRequestException('No se puede bloquear un horario en el pasado');
      }

      // Validar que horaInicio < horaFin
      if (createBlockDto.horaInicio >= createBlockDto.horaFin) {
        throw new BadRequestException('La hora de inicio debe ser menor que la hora de fin');
      }

      // Verificar si ya existe un bloqueo que se superponga
      const bloqueoExistente = await this.prisma.professionalBlock.findFirst({
        where: {
          professionalId,
          fecha: fechaBloqueo,
          isActive: true,
          OR: [
            {
              AND: [
                { horaInicio: { lte: createBlockDto.horaInicio } },
                { horaFin: { gt: createBlockDto.horaInicio } }
              ]
            },
            {
              AND: [
                { horaInicio: { lt: createBlockDto.horaFin } },
                { horaFin: { gte: createBlockDto.horaFin } }
              ]
            },
            {
              AND: [
                { horaInicio: { gte: createBlockDto.horaInicio } },
                { horaFin: { lte: createBlockDto.horaFin } }
              ]
            }
          ]
        }
      });

      if (bloqueoExistente) {
        throw new BadRequestException('Ya existe un bloqueo que se superpone con este horario');
      }

      // Crear el bloqueo
      const bloqueo = await this.prisma.professionalBlock.create({
        data: {
          professionalId,
          fecha: fechaBloqueo,
          horaInicio: createBlockDto.horaInicio,
          horaFin: createBlockDto.horaFin,
          motivo: createBlockDto.motivo,
        },
      });

      return {
        success: true,
        data: bloqueo,
        message: 'Bloqueo creado exitosamente'
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error creando bloqueo:', error);
      throw new BadRequestException('Error al crear el bloqueo');
    }
  }

  @Delete('clinica/:clinicaUrl/profesionales/:professionalId/bloqueos/:blockId')
  async deleteProfessionalBlock(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('professionalId') professionalId: string,
    @Param('blockId') blockId: string,
  ) {
    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Verificar que el profesional existe y pertenece a la clínica
      const professional = await this.prisma.professional.findFirst({
        where: {
          id: professionalId,
          user: {
            clinicaId: clinica.id,
          },
        },
      });

      if (!professional) {
        throw new BadRequestException('Profesional no encontrado o no pertenece a esta clínica');
      }

      // Verificar que el bloqueo existe y pertenece al profesional
      const bloqueo = await this.prisma.professionalBlock.findFirst({
        where: {
          id: blockId,
          professionalId,
        },
      });

      if (!bloqueo) {
        throw new BadRequestException('Bloqueo no encontrado');
      }

      // Eliminar el bloqueo (soft delete)
      await this.prisma.professionalBlock.update({
        where: { id: blockId },
        data: { isActive: false }
      });

      return {
        success: true,
        message: 'Bloqueo eliminado exitosamente'
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error eliminando bloqueo:', error);
      throw new BadRequestException('Error al eliminar el bloqueo');
    }
  }

  // ===== ENDPOINT PARA ARCHIVOS DEL MICROSERVICIO (S3) =====
  
  @Get('microservice-files/*')
  async serveMicroserviceFile(@Param('0') filePath: string, @Res() res: Response) {
    try {
      console.log('🌐 [MICROSERVICE_FILES] Intentando servir archivo del microservicio:', filePath);
      
      // Si el filePath ya es una URL completa de S3, redirigir directamente
      if (filePath.startsWith('https://')) {
        console.log('🔗 [MICROSERVICE_FILES] Redirigiendo a URL de S3:', filePath);
        return res.redirect(302, filePath);
      }
      
      // Si es una ruta relativa, construir la URL de S3
      // Asumimos que el microservicio devuelve URLs completas de S3
      throw new NotFoundException('Archivo del microservicio no encontrado');
      
    } catch (error) {
      console.error('❌ [MICROSERVICE_FILES] Error sirviendo archivo del microservicio:', {
        error: error.message,
        filePath,
        stack: error.stack
      });
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Error al servir el archivo del microservicio');
    }
  }

  // ===== ENDPOINT PARA SERVIR ARCHIVOS ESTÁTICOS LOCALES =====
  
  @Get('files/*')
  async serveFile(@Param('0') filePath: string, @Res() res: Response) {
    try {
      console.log('🔍 [PUBLIC_FILES] Intentando servir archivo:', filePath);
      
      // Construir la ruta completa del archivo
      const fullPath = path.join(process.cwd(), 'uploads', filePath);
      
      console.log('📁 [PUBLIC_FILES] Ruta completa del archivo:', fullPath);
      console.log('📁 [PUBLIC_FILES] Directorio de trabajo:', process.cwd());
      
      // Verificar que el archivo existe
      if (!fs.existsSync(fullPath)) {
        console.error('❌ [PUBLIC_FILES] Archivo no encontrado:', fullPath);
        console.error('❌ [PUBLIC_FILES] Verificando directorio padre:', path.dirname(fullPath));
        console.error('❌ [PUBLIC_FILES] ¿Existe directorio padre?', fs.existsSync(path.dirname(fullPath)));
        throw new NotFoundException('Archivo no encontrado');
      }
      
      // Verificar que es un archivo (no un directorio)
      const stats = fs.statSync(fullPath);
      if (!stats.isFile()) {
        console.error('❌ [PUBLIC_FILES] No es un archivo válido:', fullPath);
        throw new NotFoundException('Archivo no encontrado');
      }
      
      console.log('✅ [PUBLIC_FILES] Archivo encontrado, sirviendo...', {
        size: stats.size,
        isFile: stats.isFile()
      });
      
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
      
      console.log('📄 [PUBLIC_FILES] Content-Type determinado:', contentType);
      console.log('📤 [PUBLIC_FILES] Enviando archivo...');
      
      // Enviar el archivo
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error('❌ [PUBLIC_FILES] Error sirviendo archivo:', {
        error: error.message,
        filePath,
        stack: error.stack
      });
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Error al servir el archivo');
    }
  }
}
