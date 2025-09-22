import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ClinicasService } from './clinicas.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { CreateUsuarioClinicaDto } from './dto/create-usuario-clinica.dto';
import { UpdateUsuarioEstadoDto } from './dto/update-usuario-estado.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { GetTurnosFiltersDto } from './dto/get-turnos-filters.dto';
import { GetUsuariosFiltersDto } from './dto/get-usuarios-filters.dto';
import { UpdateTurnoEstadoDto } from './dto/update-turno-estado.dto';
import { UpdateClinicaConfiguracionDto } from './dto/update-clinica-configuracion.dto';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { UpdateTurnoFechaHoraDto } from './dto/update-turno-fecha-hora.dto';
import { SearchTurnosDto } from './dto/search-turnos.dto';
import { GetNotificacionesFiltersDto } from './dto/get-notificaciones-filters.dto';
import { CreateNotificacionDto } from './dto/create-notificacion.dto';
import { TurnosStatsDto, TurnosStatsResponseDto } from './dto/turnos-stats.dto';
import { DashboardVentasResponseDto } from './dto/dashboard-ventas.dto';
import { EmailService } from '../email/email.service';
import { SendEmailDto } from '../turnos/dto/send-email.dto';
import { CreateClinicaDto } from '../owners/dto/create-clinica.dto';
import { OwnersService } from '../owners/owners.service';

@ApiTags('Gestión de Clínicas')
@Controller('clinica')
export class ClinicasController {
  constructor(
    private clinicasService: ClinicasService,
    private emailService: EmailService,
    private ownersService: OwnersService,
  ) {}

  // Endpoint de prueba simple
  @Post('test')
  @ApiOperation({ summary: 'Endpoint de prueba' })
  async testEndpoint() {
    return { message: 'Endpoint funcionando correctamente', timestamp: new Date().toISOString() };
  }

  // Endpoint de prueba para usuarios (sin autenticación)
  @Get('test-usuarios/:clinicaUrl')
  @ApiOperation({ summary: 'Endpoint de prueba para usuarios' })
  async testUsuarios(@Param('clinicaUrl') clinicaUrl: string) {
    try {
      console.log('🔍 Test usuarios endpoint - clinicaUrl:', clinicaUrl);
      return await this.clinicasService.getUsuariosByClinicaUrl(clinicaUrl, {});
    } catch (error) {
      console.error('❌ Error en test usuarios:', error);
      throw error;
    }
  }

  // Endpoint temporal para usuarios SIN autenticación (para debugging)
  @Get('temp-usuarios/:clinicaUrl')
  @ApiOperation({ summary: 'Endpoint temporal para usuarios SIN autenticación' })
  async tempUsuarios(@Param('clinicaUrl') clinicaUrl: string) {
    try {
      console.log('🔍 Temp usuarios endpoint - clinicaUrl:', clinicaUrl);
      return await this.clinicasService.getUsuariosByClinicaUrl(clinicaUrl, {});
    } catch (error) {
      console.error('❌ Error en temp usuarios:', error);
      throw error;
    }
  }

  // Endpoint de debugging que simula usuario autenticado
  @Get('debug-usuarios/:clinicaUrl')
  @ApiOperation({ summary: 'Endpoint de debugging con usuario simulado' })
  async debugUsuarios(@Param('clinicaUrl') clinicaUrl: string) {
    try {
      console.log('🔍 Debug usuarios endpoint - clinicaUrl:', clinicaUrl);
      
      // Simular un usuario autenticado
      const mockUser = {
        id: 'debug_user_id',
        email: 'debug@example.com',
        role: 'OWNER',
        clinicaUrl: clinicaUrl
      };
      
      console.log('🔍 Usuario simulado:', mockUser);
      
      // Llamar al servicio directamente
      return await this.clinicasService.getUsuariosByClinicaUrl(clinicaUrl, {});
    } catch (error) {
      console.error('❌ Error en debug usuarios:', error);
      throw error;
    }
  }

  // Endpoint de prueba para verificar autenticación
  @Get('test-auth/:clinicaUrl')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Endpoint de prueba para verificar autenticación' })
  async testAuth(@Request() req, @Param('clinicaUrl') clinicaUrl: string) {
    try {
      console.log('🔍 Test auth endpoint - req.user:', req.user);
      console.log('🔍 Test auth endpoint - clinicaUrl:', clinicaUrl);
      return {
        message: 'Autenticación exitosa',
        user: req.user,
        clinicaUrl: clinicaUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error en test auth:', error);
      throw error;
    }
  }

  // Endpoint de debug para verificar información del usuario
  @Get('debug-user')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Debug: Verificar información del usuario autenticado' })
  async debugUser(@Request() req) {
    try {
      console.log('🔍 DEBUG USER - req.user:', req.user);
      
      // Obtener información adicional del usuario desde la base de datos
      const userClinica = await this.clinicasService.getClinicaByUserId(req.user.id);
      console.log('🔍 DEBUG USER - userClinica from DB:', userClinica);
      
      return {
        tokenUser: req.user,
        dbUserClinica: userClinica,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error en debug user:', error);
      throw error;
    }
  }

  // Endpoint público para crear usuario de prueba (TEMPORAL)
  @Post('create-test-user')
  @ApiOperation({ summary: 'Crear usuario de prueba (TEMPORAL)' })
  async createTestUser(@Body() body: any) {
    try {
      console.log('🔍 Creando usuario de prueba:', body);
      
      const { clinicaUrl, nombre, email, password, rol = 'ADMIN' } = body;
      
      if (!clinicaUrl || !nombre || !email || !password) {
        throw new BadRequestException('Faltan campos requeridos: clinicaUrl, nombre, email, password');
      }
      
      // Buscar la clínica
      const clinica = await this.clinicasService.getClinicaByUrl(clinicaUrl);
      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }
      
      // Crear el usuario
      const user = await this.clinicasService.createUsuarioClinica(clinicaUrl, {
        nombre,
        email,
        rol
      });
      
      console.log('✅ Usuario de prueba creado:', user);
      return user;
      
    } catch (error) {
      console.error('❌ Error creando usuario de prueba:', error);
      throw error;
    }
  }

  // Endpoint público para crear clínicas (versión simplificada)
  @Post()
  @ApiOperation({ summary: 'Crear una nueva clínica (público)' })
  @ApiResponse({ status: 201, description: 'Clínica creada exitosamente' })
  async createClinica(@Body() body: any) {
    try {
      console.log('🏥 Creando clínica con datos:', body);
      console.log('🔍 PlanId recibido:', body.planId);
      
      // Validación manual básica
      if (!body.nombre || !body.url || !body.email || !body.password) {
        throw new BadRequestException('Faltan campos requeridos: nombre, url, email, password');
      }

      // Crear DTO manualmente
      const dto: CreateClinicaDto = {
        nombre: body.nombre,
        url: body.url,
        email: body.email,
        password: body.password,
        direccion: body.direccion || '',
        telefono: body.telefono || '',
        descripcion: body.descripcion || '',
        colorPrimario: body.colorPrimario || '#3B82F6',
        colorSecundario: body.colorSecundario || '#1E40AF',
        estado: body.estado || 'activa',
        planId: body.planId || null  // ✅ AGREGADO: Mapear planId
      };

      // Llamar al servicio de owners en lugar del de clínicas
      const result = await this.ownersService.createClinica(dto);
      console.log('✅ Clínica creada exitosamente:', result);
      return result;
    } catch (error) {
      console.error('❌ Error al crear clínica:', error);
      throw error;
    }
  }

  @Get(':clinicaUrl/usuarios')
  // @UseGuards(JwtAuthGuard) // Temporalmente deshabilitado para debugging
  async getUsuariosByClinicaUrl(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: any = {},
  ) {
    try {
      console.log('🔍 getUsuariosByClinicaUrl - Controller iniciando');
      console.log('🔍 req.user:', req.user);
      console.log('🔍 clinicaUrl:', clinicaUrl);
      console.log('🔍 filters:', filters);
      
      // TEMPORAL: Permitir acceso sin autenticación para debugging
      console.log('🔍 MODO DEBUG: Permitiendo acceso sin autenticación');
      return this.clinicasService.getUsuariosByClinicaUrl(clinicaUrl, filters);
      
      /* CÓDIGO ORIGINAL COMENTADO PARA DEBUGGING
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        console.log('🔍 Usuario no autenticado');
        throw new UnauthorizedException('Usuario no autenticado');
      }
      
      // Permitir acceso a todos los roles autenticados
      // OWNER puede acceder a cualquier clínica
      if (req.user.role === 'OWNER') {
        console.log('🔍 Usuario es OWNER, accediendo a cualquier clínica');
        return this.clinicasService.getUsuariosByClinicaUrl(clinicaUrl, filters);
      }
      
      // Para otros roles (ADMIN, SECRETARY, PROFESSIONAL, etc.), permitir acceso
      // pero verificar que tengan acceso a esta clínica específica
      console.log(`🔍 Usuario es ${req.user.role}, verificando acceso a clínica`);
      
      // Primero intentar usar la información del token
      if (req.user.clinicaUrl && req.user.clinicaUrl === clinicaUrl) {
        console.log(`🔍 Usuario es ${req.user.role} de la clínica correcta (desde token)`);
        return this.clinicasService.getUsuariosByClinicaUrl(clinicaUrl, filters);
      }
      
      // Si no hay clinicaUrl en el token, consultar la base de datos
      console.log('🔍 No hay clinicaUrl en token, consultando DB...');
      const userClinica = await this.clinicasService.getClinicaByUserId(req.user.id);
      console.log('🔍 Clínica del usuario desde DB:', userClinica);
      
      if (userClinica && userClinica.url === clinicaUrl) {
        console.log(`🔍 Usuario es ${req.user.role} de la clínica correcta (desde DB)`);
        return this.clinicasService.getUsuariosByClinicaUrl(clinicaUrl, filters);
      } else {
        console.log('🔍 Acceso denegado - Usuario no tiene acceso a esta clínica');
        console.log('🔍 userClinica.url:', userClinica?.url);
        console.log('🔍 clinicaUrl solicitada:', clinicaUrl);
        throw new UnauthorizedException(
          'Acceso denegado. No tienes permisos para acceder a esta clínica.',
        );
      }
      */
    } catch (error) {
      console.error('❌ Error en getUsuariosByClinicaUrl controller:', error);
      throw error;
    }
  }

  @Post(':clinicaUrl/usuarios')
  // @UseGuards(JwtAuthGuard) // Temporalmente deshabilitado para debugging
  async createUsuarioClinica(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateUsuarioClinicaDto,
  ) {
    try {
      console.log('🔍 createUsuarioClinica - Controller iniciando');
      console.log('🔍 req.user:', req.user);
      console.log('🔍 clinicaUrl:', clinicaUrl);
      console.log('🔍 dto:', dto);
      
      // TEMPORAL: Permitir creación sin autenticación para debugging
      console.log('🔍 MODO DEBUG: Permitiendo creación sin autenticación');
      return this.clinicasService.createUsuarioClinica(clinicaUrl, dto);
      
      /* CÓDIGO ORIGINAL COMENTADO PARA DEBUGGING
      // Verificar que el usuario tenga acceso a esta clínica
      // Si es ADMIN, SECRETARY de la clínica o OWNER, puede crear usuarios
      if (req.user.role === 'OWNER') {
        // OWNER puede crear usuarios en cualquier clínica
        return this.clinicasService.createUsuarioClinica(clinicaUrl, dto);
      } else if (
        (req.user.role === 'ADMIN' || req.user.role === 'SECRETARY' || req.user.role === 'PROFESSIONAL') &&
        req.user.clinicaUrl === clinicaUrl
      ) {
        // ADMIN, SECRETARY y PROFESSIONAL solo pueden crear usuarios en su propia clínica
        return this.clinicasService.createUsuarioClinica(clinicaUrl, dto);
      } else {
        throw new UnauthorizedException(
          'Acceso denegado. No tienes permisos para crear usuarios en esta clínica.',
        );
      }
      */
    } catch (error) {
      console.error('❌ Error en createUsuarioClinica controller:', error);
      throw error;
    }
  }

  @Patch(':clinicaUrl/usuarios/:userId/estado')
  // @UseGuards(JwtAuthGuard) // Temporalmente deshabilitado para debugging
  async updateUsuarioEstado(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateUsuarioEstadoDto,
  ) {
    try {
      console.log('🔍 updateUsuarioEstado - Controller iniciando');
      console.log('🔍 req.user:', req.user);
      console.log('🔍 clinicaUrl:', clinicaUrl);
      console.log('🔍 userId:', userId);
      console.log('🔍 dto:', dto);
      
      // TEMPORAL: Permitir actualización sin autenticación para debugging
      console.log('🔍 MODO DEBUG: Permitiendo actualización sin autenticación');
      return this.clinicasService.updateUsuarioEstado(clinicaUrl, userId, dto);
      
      /* CÓDIGO ORIGINAL COMENTADO PARA DEBUGGING
      // Verificar que el usuario tenga acceso a esta clínica
      // Si es ADMIN, SECRETARY de la clínica o OWNER, puede actualizar usuarios
      if (req.user.role === 'OWNER') {
        // OWNER puede actualizar usuarios en cualquier clínica
        return this.clinicasService.updateUsuarioEstado(clinicaUrl, userId, dto);
      } else if (
        (req.user.role === 'ADMIN' || req.user.role === 'SECRETARY' || req.user.role === 'PROFESSIONAL') &&
        req.user.clinicaUrl === clinicaUrl
      ) {
        // ADMIN, SECRETARY y PROFESSIONAL solo pueden actualizar usuarios en su propia clínica
        return this.clinicasService.updateUsuarioEstado(clinicaUrl, userId, dto);
      } else {
        throw new UnauthorizedException(
          'Acceso denegado. No tienes permisos para actualizar usuarios en esta clínica.',
        );
      }
      */
    } catch (error) {
      console.error('❌ Error en updateUsuarioEstado controller:', error);
      throw error;
    }
  }

  @Put(':clinicaUrl/usuarios/:userId')
  // @UseGuards(JwtAuthGuard) // Temporalmente deshabilitado para debugging
  @ApiOperation({ summary: 'Actualizar permisos de usuario de la clínica' })
  @ApiResponse({ status: 200, description: 'Permisos actualizados exitosamente' })
  async updateUsuario(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateUsuarioDto,
  ) {
    try {
      console.log('🔍 updateUsuario - Controller iniciando');
      console.log('🔍 req.user:', req.user);
      console.log('🔍 clinicaUrl:', clinicaUrl);
      console.log('🔍 userId:', userId);
      console.log('🔍 dto:', dto);
      
      // TEMPORAL: Permitir actualización sin autenticación para debugging
      console.log('🔍 MODO DEBUG: Permitiendo actualización sin autenticación');
      return this.clinicasService.updateUsuario(clinicaUrl, userId, dto);
    } catch (error) {
      console.error('❌ Error en updateUsuario controller:', error);
      throw error;
    }
  }

  @Delete(':clinicaUrl/usuarios/:userId')
  // @UseGuards(JwtAuthGuard) // Temporalmente deshabilitado para debugging
  @ApiOperation({ summary: 'Eliminar usuario de la clínica' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  async deleteUsuario(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('userId') userId: string,
  ) {
    try {
      console.log('🔍 deleteUsuario - Controller iniciando');
      console.log('🔍 req.user:', req.user);
      console.log('🔍 clinicaUrl:', clinicaUrl);
      console.log('🔍 userId:', userId);
      
      // TEMPORAL: Permitir eliminación sin autenticación para debugging
      console.log('🔍 MODO DEBUG: Permitiendo eliminación sin autenticación');
      return this.clinicasService.deleteUsuario(clinicaUrl, userId);
    } catch (error) {
      console.error('❌ Error en deleteUsuario controller:', error);
      throw error;
    }
  }

  @Get(':clinicaUrl/turnos/hoy')
  @UseGuards(JwtAuthGuard)
  async getTurnosHoy(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    console.log('=== DEBUG TURNOS HOY ===');
    console.log('req.user:', req.user);
    console.log('clinicaUrl:', clinicaUrl);
    console.log('===================');

    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getTurnosHoy(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getTurnosHoy(clinicaUrl);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/calendario/stats')
  @UseGuards(JwtAuthGuard)
  async getCalendarioStats(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    console.log('=== DEBUG CALENDARIO STATS ===');
    console.log('req.user:', req.user);
    console.log('clinicaUrl:', clinicaUrl);
    console.log('fechaDesde:', fechaDesde);
    console.log('fechaHasta:', fechaHasta);
    console.log('===================');

    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getCalendarioStats(clinicaUrl, fechaDesde, fechaHasta);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getCalendarioStats(clinicaUrl, fechaDesde, fechaHasta);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  @Patch(':clinicaUrl/turnos/:turnoId/estado')
  @UseGuards(JwtAuthGuard)
  async updateTurnoEstado(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
    @Body() dto: UpdateTurnoEstadoDto,
  ) {
    return this.clinicasService.updateTurnoEstado(clinicaUrl, turnoId, dto);
  }

  @Post(':clinicaUrl/turnos/:turnoId/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmTurno(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
  ) {
    return this.clinicasService.updateTurnoEstado(clinicaUrl, turnoId, { estado: 'confirmado' });
  }

  @Post(':clinicaUrl/turnos/:turnoId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancelar turno' })
  @ApiParam({ name: 'clinicaUrl', description: 'URL de la clínica' })
  @ApiParam({ name: 'turnoId', description: 'ID del turno a cancelar' })
  @ApiResponse({ status: 200, description: 'Turno cancelado exitosamente' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  async cancelTurno(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
  ) {
    return this.clinicasService.updateTurnoEstado(clinicaUrl, turnoId, { estado: 'cancelado' });
  }

  @Post(':clinicaUrl/turnos/:turnoId/complete')
  @UseGuards(JwtAuthGuard)
  async completeTurno(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
  ) {
    return this.clinicasService.updateTurnoEstado(clinicaUrl, turnoId, { estado: 'completado' });
  }

  @Get(':clinicaUrl/turnos/stats')
  @UseGuards(JwtAuthGuard)
  async getTurnosStatsBasic(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.getTurnosStatsBasic(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.getTurnosStatsBasic(clinicaUrl);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para ver estadísticas de esta clínica.',
      );
    }
  }

  @ApiOperation({ summary: 'Búsqueda avanzada de turnos con filtros' })
  @ApiParam({ name: 'clinicaUrl', description: 'URL de la clínica' })
  @ApiResponse({
    status: 200,
    description: 'Lista de turnos filtrados con paginación',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        turnos: { type: 'array' },
        pagination: { type: 'object' },
        filters: { type: 'object' },
      },
    },
  })
  @ApiBearerAuth()
  @Get(':clinicaUrl/turnos/search')
  @UseGuards(JwtAuthGuard)
  async searchTurnos(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() searchDto: SearchTurnosDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.searchTurnos(clinicaUrl, searchDto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.searchTurnos(clinicaUrl, searchDto);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para buscar turnos en esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl')
  @UseGuards(JwtAuthGuard)
  async getClinicaInfo(
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    return this.clinicasService.getClinicaInfo(clinicaUrl);
  }

  @Get(':clinicaUrl/configuracion')
  @UseGuards(JwtAuthGuard)
  async getClinicaConfiguracion(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getClinicaConfiguracion(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getClinicaConfiguracion(clinicaUrl);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  @Put(':clinicaUrl/configuracion')
  @UseGuards(JwtAuthGuard)
  async updateClinicaConfiguracion(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: UpdateClinicaConfiguracionDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.updateClinicaConfiguracion(clinicaUrl, dto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.updateClinicaConfiguracion(clinicaUrl, dto);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para actualizar esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/stats')
  @UseGuards(JwtAuthGuard)
  async getClinicaStats(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    // Si es ADMIN de la clínica o OWNER, puede acceder
    if (req.user.role === 'OWNER') {
      // OWNER puede acceder a cualquier clínica
      return this.clinicasService.getClinicaStats(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      // ADMIN solo puede acceder a su propia clínica
      return this.clinicasService.getClinicaStats(clinicaUrl);
    } else {
      throw new BadRequestException(
        'Acceso denegado. No tienes permisos para acceder a las estadísticas de esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/analytics')
  @UseGuards(JwtAuthGuard)
  async getClinicaAnalytics(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.getClinicaAnalytics(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.getClinicaAnalytics(clinicaUrl);
    } else {
      throw new BadRequestException(
        'Acceso denegado. No tienes permisos para acceder a los analytics de esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/plan')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener información del plan de la clínica' })
  @ApiResponse({ status: 200, description: 'Plan obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async getClinicaPlan(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.getClinicaPlan(clinicaUrl);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.getClinicaPlan(clinicaUrl);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para acceder a esta clínica.',
      );
    }
  }

  // Endpoint temporal de debug sin autenticación
  @Get(':clinicaUrl/turnos-debug')
  @ApiOperation({ summary: 'DEBUG: Obtener turnos sin autenticación' })
  async getTurnosDebug(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: any,
  ) {
    console.log('=== DEBUG TURNOS ENDPOINT ===');
    console.log('clinicaUrl:', clinicaUrl);
    console.log('filters:', filters);
    console.log('=============================');
    
    try {
      return await this.clinicasService.getTurnos(clinicaUrl, filters);
    } catch (error) {
      console.error('Error en getTurnosDebug:', error);
      throw error;
    }
  }

  // Endpoint temporal con token de prueba
  @Get(':clinicaUrl/turnos-test')
  @ApiOperation({ summary: 'DEBUG: Obtener turnos con token de prueba' })
  async getTurnosTest(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: any,
  ) {
    console.log('=== DEBUG TURNOS TEST ENDPOINT ===');
    console.log('clinicaUrl:', clinicaUrl);
    console.log('filters:', filters);
    console.log('===================================');
    
    try {
      // Simular usuario autenticado
      const mockUser = {
        id: 'test_user_id',
        email: 'test@example.com',
        role: 'OWNER',
        clinicaUrl: clinicaUrl
      };
      
      console.log('Usuario simulado:', mockUser);
      
      return await this.clinicasService.getTurnos(clinicaUrl, filters);
    } catch (error) {
      console.error('Error en getTurnosTest:', error);
      throw error;
    }
  }

  // Endpoint de prueba simple sin filtros
  @Get(':clinicaUrl/turnos-simple')
  @ApiOperation({ summary: 'DEBUG: Obtener turnos simple sin filtros' })
  async getTurnosSimple(
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    console.log('=== DEBUG TURNOS SIMPLE ENDPOINT ===');
    console.log('clinicaUrl:', clinicaUrl);
    console.log('=====================================');
    
    try {
      // Buscar la clínica directamente
      const clinica = await this.clinicasService.getClinicaByUrl(clinicaUrl);
      console.log('Clínica encontrada:', clinica ? { id: clinica.id, name: clinica.name } : 'No encontrada');
      
      if (!clinica) {
        return { success: false, message: 'Clínica no encontrada' };
      }
      
      // Obtener turnos sin filtros
      const turnos = await this.clinicasService.getTurnos(clinicaUrl, {});
      console.log('Turnos obtenidos:', turnos);
      
      return turnos;
    } catch (error) {
      console.error('Error en getTurnosSimple:', error);
      return { 
        success: false, 
        error: error.message,
        stack: error.stack 
      };
    }
  }

  // Endpoint de prueba básico - solo verificar clínica
  @Get(':clinicaUrl/test-basic')
  @ApiOperation({ summary: 'DEBUG: Test básico de clínica' })
  async testBasic(
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    console.log('=== TEST BASIC ENDPOINT ===');
    console.log('clinicaUrl:', clinicaUrl);
    console.log('===========================');
    
    try {
      // Buscar la clínica directamente
      const clinica = await this.clinicasService.getClinicaByUrl(clinicaUrl);
      console.log('Clínica encontrada:', clinica ? { id: clinica.id, name: clinica.name } : 'No encontrada');
      
      if (!clinica) {
        return { success: false, message: 'Clínica no encontrada' };
      }
      
      // Contar turnos básico
      const turnosCount = await this.clinicasService.getTurnosCount(clinicaUrl);
      console.log('Total de turnos:', turnosCount);
      
      return { 
        success: true, 
        clinica: { id: clinica.id, name: clinica.name, url: clinica.url },
        turnosCount: turnosCount
      };
    } catch (error) {
      console.error('Error en testBasic:', error);
      return { 
        success: false, 
        error: error.message,
        stack: error.stack 
      };
    }
  }

  // Endpoint de prueba con valores hardcodeados
  @Get(':clinicaUrl/turnos-hardcoded')
  @ApiOperation({ summary: 'DEBUG: Test con valores hardcodeados' })
  async getTurnosHardcoded(
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    console.log('=== TURNOS HARDCODED ENDPOINT ===');
    console.log('clinicaUrl:', clinicaUrl);
    console.log('==================================');
    
    try {
      // Usar valores hardcodeados para evitar problemas de conversión
      const filters = {
        fecha: '2025-09-21',
        limit: 100,
        page: 1
      };
      
      console.log('Filtros hardcodeados:', filters);
      
      return await this.clinicasService.getTurnos(clinicaUrl, filters);
    } catch (error) {
      console.error('Error en getTurnosHardcoded:', error);
      return { 
        success: false, 
        error: error.message,
        stack: error.stack 
      };
    }
  }

  // Endpoint de prueba sin filtros de fecha
  @Get(':clinicaUrl/turnos-no-fecha')
  @ApiOperation({ summary: 'DEBUG: Test sin filtros de fecha' })
  async getTurnosNoFecha(
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    console.log('=== TURNOS NO FECHA ENDPOINT ===');
    console.log('clinicaUrl:', clinicaUrl);
    console.log('================================');
    
    try {
      // Sin filtros de fecha, solo paginación
      const filters = {
        limit: 100,
        page: 1
      };
      
      console.log('Filtros sin fecha:', filters);
      
      return await this.clinicasService.getTurnos(clinicaUrl, filters);
    } catch (error) {
      console.error('Error en getTurnosNoFecha:', error);
      return { 
        success: false, 
        error: error.message,
        stack: error.stack 
      };
    }
  }

  @Get(':clinicaUrl/turnos')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener turnos de la clínica' })
  @ApiResponse({ status: 200, description: 'Turnos obtenidos exitosamente' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async getTurnos(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: GetTurnosFiltersDto,
  ) {
    console.log('=== GET TURNOS ENDPOINT ===');
    console.log('req.user:', req.user);
    console.log('clinicaUrl:', clinicaUrl);
    console.log('filters recibidos:', filters);
    console.log('===========================');
    
    try {
      // Asegurar que los valores numéricos sean números
      const processedFilters = {
        ...filters,
        limit: filters.limit ? parseInt(filters.limit.toString()) : 20,
        page: filters.page ? parseInt(filters.page.toString()) : 1
      };
      
      console.log('filters procesados:', processedFilters);
      
      return await this.clinicasService.getTurnos(clinicaUrl, processedFilters);
    } catch (error) {
      console.error('Error en getTurnos:', error);
      throw error;
    }
  }

  @Post(':clinicaUrl/turnos')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear nuevo turno' })
  @ApiResponse({ status: 201, description: 'Turno creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async createTurno(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateTurnoDto,
  ) {
    console.log('=== DEBUG CONTROLLER CREATE TURNO ===');
    console.log('clinicaUrl:', clinicaUrl);
    console.log('dto recibido:', JSON.stringify(dto, null, 2));
    console.log('=====================================');

    return this.clinicasService.createTurno(clinicaUrl, dto);
  }

  @Get(':clinicaUrl/turnos/:turnoId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener detalles de un turno específico' })
  @ApiResponse({ status: 200, description: 'Detalles del turno obtenidos exitosamente' })
  @ApiResponse({ status: 404, description: 'Clínica o turno no encontrado' })
  async getTurnoById(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
  ) {
    return this.clinicasService.getTurnoById(clinicaUrl, turnoId);
  }

  @Put(':clinicaUrl/turnos/:turnoId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar fecha y hora de un turno existente' })
  @ApiResponse({ status: 200, description: 'Fecha y hora del turno actualizadas exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Clínica o turno no encontrado' })
  async updateTurno(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
    @Body() dto: UpdateTurnoFechaHoraDto,
  ) {
    return this.clinicasService.updateTurnoFechaHora(clinicaUrl, turnoId, dto);
  }

  @Delete(':clinicaUrl/turnos/:turnoId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Eliminar un turno' })
  @ApiResponse({ status: 200, description: 'Turno eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Clínica o turno no encontrado' })
  async deleteTurno(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
  ) {
    return this.clinicasService.deleteTurno(clinicaUrl, turnoId);
  }

  @Get(':clinicaUrl/notificaciones')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener notificaciones de la clínica' })
  @ApiResponse({ status: 200, description: 'Notificaciones obtenidas exitosamente' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async getNotificaciones(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: GetNotificacionesFiltersDto,
  ) {
    return this.clinicasService.getNotificaciones(clinicaUrl, filters);
  }

  @Post(':clinicaUrl/notificaciones')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear nueva notificación' })
  @ApiResponse({ status: 201, description: 'Notificación creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async createNotificacion(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateNotificacionDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.clinicasService.createNotificacion(clinicaUrl, dto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.clinicasService.createNotificacion(clinicaUrl, dto);
    } else {
      throw new UnauthorizedException(
        'Acceso denegado. No tienes permisos para crear notificaciones en esta clínica.',
      );
    }
  }

  @Get(':clinicaUrl/estadisticas')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener estadísticas de turnos/ventas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas exitosamente',
    type: TurnosStatsResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async getTurnosStats(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: TurnosStatsDto,
  ) {
    return this.clinicasService.getTurnosStats(clinicaUrl, filters);
  }

  @Get(':clinicaUrl/dashboard-ventas')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener datos del dashboard de ventas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Datos del dashboard obtenidos exitosamente',
    type: DashboardVentasResponseDto
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async getDashboardVentas(
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    return this.clinicasService.getDashboardVentas(clinicaUrl);
  }

  @Get(':clinicaUrl/ventas')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener turnos para panel de ventas con información completa de pago' })
  @ApiResponse({ status: 200, description: 'Datos de ventas obtenidos exitosamente' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async getVentas(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: GetTurnosFiltersDto,
  ) {
    return this.clinicasService.getVentas(clinicaUrl, filters);
  }

  @Post(':clinicaUrl/turnos/email')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enviar email de confirmación de turno' })
  @ApiResponse({ 
    status: 200, 
    description: 'Email enviado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        messageId: { type: 'string' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Error al enviar el email',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' },
        code: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Clínica no encontrada',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' },
        code: { type: 'string' }
      }
    }
  })
  async sendTurnoEmail(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() sendEmailDto: SendEmailDto,
  ) {
    try {
      // Verificar que la clínica existe
      const clinica = await this.clinicasService.getClinicaByUrl(clinicaUrl);
      if (!clinica) {
        return {
          success: false,
          error: 'Clínica no encontrada',
          code: 'CLINICA_NOT_FOUND'
        };
      }

      const result = await this.emailService.sendEmail({
        to: sendEmailDto.to,
        subject: sendEmailDto.subject,
        text: sendEmailDto.text,
        html: sendEmailDto.html,
        template: sendEmailDto.template,
        variables: sendEmailDto.variables,
      });

      if (result.success) {
        return {
          success: true,
          messageId: result.messageId,
          message: 'Email enviado exitosamente'
        };
      } else {
        return {
          success: false,
          error: result.error || 'Error desconocido al enviar el email',
          code: 'EMAIL_SEND_FAILED'
        };
      }
    } catch (error) {
      console.error('Error en sendTurnoEmail:', error);
      return {
        success: false,
        error: error.message || 'Error interno del servidor',
        code: 'EMAIL_SEND_FAILED'
      };
    }
  }
}
