import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Controller('clinica/:clinicaUrl/usuarios')
export class ClinicaUsuariosController {
  constructor(private readonly usersService: UsersService) {}

  // Endpoint público para crear usuarios (sin autenticación JWT)
  @Post()
  createUser(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    console.log(`🔍 CONTROLLER: createUser llamado con clinicaUrl: ${clinicaUrl}`);
    console.log(`🔍 CONTROLLER: DTO recibido:`, JSON.stringify(createUserDto, null, 2));
    
    // Siempre usar el clinicaUrl de la URL, no el clinicaId del payload
    // El clinicaId del payload se usará para asociar el usuario a la clínica correcta
    console.log(`🔍 CONTROLLER: clinicaId del payload: ${createUserDto?.clinicaId}`);
    console.log(`🔍 CONTROLLER: clinicaUrl de la URL: ${clinicaUrl}`);
    console.log(`🔍 CONTROLLER: Usando clínica URL: ${clinicaUrl}`);
    
    try {
      const result = this.usersService.createUserForClinica(clinicaUrl, createUserDto);
      console.log(`✅ CONTROLLER: Usuario creado exitosamente`);
      return result;
    } catch (error) {
      console.error('❌ CONTROLLER: Error en createUser:', error);
      console.error('❌ CONTROLLER: Stack trace:', error.stack);
      throw error;
    }
  }

  // Endpoint público para listar usuarios (sin autenticación JWT)
  @Get()
  findAll(@Param('clinicaUrl') clinicaUrl: string) {
    return this.usersService.findAllForClinica(clinicaUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMe(@Request() req, @Param('clinicaUrl') clinicaUrl: string) {
    return this.usersService.findMeForClinica(req.user.id, clinicaUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfileForClinica(req.user.id, clinicaUrl, dto);
  }

  // Endpoint público para listar pacientes (sin autenticación JWT)
  @Get('patients')
  async findAllPatients(@Param('clinicaUrl') clinicaUrl: string) {
    return this.usersService.findPatientsForClinica(clinicaUrl);
  }

  // Endpoint público para actualizar un usuario específico
  @Put(':userId')
  updateUser(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUserForClinica(clinicaUrl, userId, updateUserDto);
  }

  // Endpoint público para eliminar un usuario específico
  @Delete(':userId')
  deleteUser(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('userId') userId: string,
  ) {
    return this.usersService.deleteUserForClinica(clinicaUrl, userId);
  }

  // Endpoint de debug para verificar el estado de la base de datos
  @Get('debug/check-email/:email')
  async debugCheckEmail(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('email') email: string,
  ) {
    return this.usersService.debugCheckEmail(clinicaUrl, email);
  }

  // Endpoint de prueba simple
  @Get('debug/test')
  async debugTest(@Param('clinicaUrl') clinicaUrl: string) {
    console.log(`🔍 DEBUG TEST: Endpoint llamado con clinicaUrl: ${clinicaUrl}`);
    return {
      message: 'Debug test endpoint funcionando',
      clinicaUrl,
      timestamp: new Date().toISOString()
    };
  }

  // Endpoint de prueba POST simple
  @Post('debug/test-post')
  async debugTestPost(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() body: any,
  ) {
    console.log(`🔍 DEBUG POST: Endpoint llamado con clinicaUrl: ${clinicaUrl}`);
    console.log(`🔍 DEBUG POST: Body recibido:`, JSON.stringify(body, null, 2));
    return {
      message: 'Debug POST endpoint funcionando',
      clinicaUrl,
      body,
      timestamp: new Date().toISOString()
    };
  }

  @Post('debug/test-create-simple')
  async debugTestCreateSimple(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() body: any,
  ) {
    console.log(`🔍 DEBUG CREATE SIMPLE: Endpoint llamado con clinicaUrl: ${clinicaUrl}`);
    console.log(`🔍 DEBUG CREATE SIMPLE: Body recibido:`, JSON.stringify(body, null, 2));
    
    try {
      // Simular la lógica de creación sin validaciones complejas
      const result = {
        message: 'Usuario creado exitosamente (simulado)',
        clinicaUrl,
        userData: {
          nombre: body.nombre,
          email: body.email,
          tipo: body.tipo,
          phone: body.phone,
          clinicaId: body.clinicaId
        },
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ DEBUG CREATE SIMPLE: Resultado:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error(`❌ DEBUG CREATE SIMPLE: Error:`, error);
      throw error;
    }
  }

  @Post('debug/test-create-with-dto')
  async debugTestCreateWithDto(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    console.log(`🔍 DEBUG CREATE WITH DTO: Endpoint llamado con clinicaUrl: ${clinicaUrl}`);
    console.log(`🔍 DEBUG CREATE WITH DTO: DTO recibido:`, JSON.stringify(createUserDto, null, 2));
    console.log(`🔍 DEBUG CREATE WITH DTO: Tipo de DTO:`, typeof createUserDto);
    console.log(`🔍 DEBUG CREATE WITH DTO: Keys del DTO:`, Object.keys(createUserDto || {}));
    
    try {
      // Simular la lógica de creación con DTO
      const result = {
        message: 'Usuario creado exitosamente (con DTO)',
        clinicaUrl,
        userData: {
          nombre: createUserDto.nombre,
          email: createUserDto.email,
          tipo: createUserDto.tipo,
          phone: createUserDto.phone,
          clinicaId: createUserDto.clinicaId
        },
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ DEBUG CREATE WITH DTO: Resultado:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error(`❌ DEBUG CREATE WITH DTO: Error:`, error);
      throw error;
    }
  }

  @Post('debug/test-real-service')
  async debugTestRealService(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() createUserDto: any,
  ) {
    console.log(`🔍 DEBUG REAL SERVICE: Endpoint llamado con clinicaUrl: ${clinicaUrl}`);
    console.log(`🔍 DEBUG REAL SERVICE: DTO recibido:`, JSON.stringify(createUserDto, null, 2));
    
    try {
      // Llamar al servicio real pero con try-catch detallado
      console.log(`🔍 DEBUG REAL SERVICE: Llamando a createUserForClinica...`);
      const result = await this.usersService.createUserForClinica(clinicaUrl, createUserDto);
      console.log(`✅ DEBUG REAL SERVICE: Usuario creado exitosamente`);
      return result;
    } catch (error) {
      console.error(`❌ DEBUG REAL SERVICE: Error en createUserForClinica:`, error);
      console.error(`❌ DEBUG REAL SERVICE: Stack trace:`, error.stack);
      console.error(`❌ DEBUG REAL SERVICE: Error message:`, error.message);
      console.error(`❌ DEBUG REAL SERVICE: Error name:`, error.name);
      throw error;
    }
  }

  @Get('debug/test-clinic-search/:clinicaUrl')
  async debugTestClinicSearch(
    @Param('clinicaUrl') clinicaUrl: string,
  ) {
    console.log(`🔍 DEBUG CLINIC SEARCH: Buscando clínica con URL: ${clinicaUrl}`);
    
    try {
      // Buscar la clínica directamente
      const clinica = await this.usersService['prisma'].clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        console.log(`❌ DEBUG CLINIC SEARCH: Clínica no encontrada: ${clinicaUrl}`);
        return {
          found: false,
          message: `Clínica con URL '${clinicaUrl}' no encontrada`,
          clinicaUrl
        };
      }

      console.log(`✅ DEBUG CLINIC SEARCH: Clínica encontrada: ${clinica.name} (ID: ${clinica.id})`);
      return {
        found: true,
        clinica: {
          id: clinica.id,
          name: clinica.name,
          url: clinica.url
        },
        message: 'Clínica encontrada exitosamente'
      };
    } catch (error) {
      console.error(`❌ DEBUG CLINIC SEARCH: Error:`, error);
      console.error(`❌ DEBUG CLINIC SEARCH: Stack trace:`, error.stack);
      return {
        found: false,
        error: error.message,
        stack: error.stack,
        clinicaUrl
      };
    }
  }

  @Post('debug/test-minimal-create')
  async debugTestMinimalCreate(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() body: any,
  ) {
    console.log(`🔍 DEBUG MINIMAL CREATE: Endpoint llamado con clinicaUrl: ${clinicaUrl}`);
    console.log(`🔍 DEBUG MINIMAL CREATE: Body recibido:`, JSON.stringify(body, null, 2));
    
    try {
      // Solo buscar la clínica y verificar email, sin crear usuario
      console.log(`🔍 DEBUG MINIMAL CREATE: Buscando clínica...`);
      const clinica = await this.usersService['prisma'].clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        console.log(`❌ DEBUG MINIMAL CREATE: Clínica no encontrada: ${clinicaUrl}`);
        return {
          success: false,
          error: `Clínica con URL '${clinicaUrl}' no encontrada`,
          clinicaUrl
        };
      }

      console.log(`✅ DEBUG MINIMAL CREATE: Clínica encontrada: ${clinica.name} (ID: ${clinica.id})`);

      // Verificar si el email ya existe
      console.log(`🔍 DEBUG MINIMAL CREATE: Verificando email ${body.email}...`);
      const existingUser = await this.usersService['prisma'].user.findFirst({
        where: { 
          email: body.email,
          clinicaId: clinica.id
        },
      });

      if (existingUser) {
        console.log(`❌ DEBUG MINIMAL CREATE: Email ya existe en esta clínica: ${body.email}`);
        return {
          success: false,
          error: 'El email ya está en uso en esta clínica',
          email: body.email,
          clinicaId: clinica.id
        };
      }

      console.log(`✅ DEBUG MINIMAL CREATE: Email disponible: ${body.email}`);
      
      return {
        success: true,
        message: 'Validaciones pasaron correctamente',
        clinica: {
          id: clinica.id,
          name: clinica.name,
          url: clinica.url
        },
        email: body.email,
        canCreate: true
      };
    } catch (error) {
      console.error(`❌ DEBUG MINIMAL CREATE: Error:`, error);
      console.error(`❌ DEBUG MINIMAL CREATE: Stack trace:`, error.stack);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        clinicaUrl
      };
    }
  }
}
