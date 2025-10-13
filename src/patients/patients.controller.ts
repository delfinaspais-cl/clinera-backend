import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  UsePipes,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { PatientsService } from './patients.service';
import { PatientsImportService } from './patients-import.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-client.dto';
import { SearchPatientsDto } from './dto/search-patients.dto';
import { ImportOptionsDto } from './dto/import-result.dto';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Gestión de Pacientes')
@Controller('clinica/:clinicaUrl/pacientes')
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly patientsImportService: PatientsImportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar pacientes con paginación' })
  @ApiResponse({ status: 200, description: 'Lista de pacientes obtenida exitosamente' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, email o teléfono' })
  async findAll(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20; // Límite por defecto más pequeño
    return this.patientsService.findAll(clinicaUrl, pageNum, limitNum, search);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear nuevo paciente' })
  @ApiResponse({ status: 201, description: 'Paciente creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async create(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreatePatientDto,
  ) {
    return this.patientsService.create(clinicaUrl, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('clinicaUrl') clinicaUrl: string, @Param('id') id: string) {
    return this.patientsService.findOne(clinicaUrl, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(clinicaUrl, id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar paciente completo' })
  @ApiResponse({ status: 200, description: 'Paciente actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async updatePatient(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() dto: any, // Usar any para evitar validación
  ) {
    return this.patientsService.updatePatient(clinicaUrl, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('clinicaUrl') clinicaUrl: string, @Param('id') id: string) {
    return this.patientsService.remove(clinicaUrl, id);
  }

  @Get('mis-turnos')
  @UseGuards(JwtAuthGuard)
  async getMisTurnos(@Request() req) {
    return this.patientsService.getMisTurnos(req.user.email);
  }

  @ApiOperation({ summary: 'Búsqueda avanzada de pacientes con filtros' })
  @ApiParam({ name: 'clinicaUrl', description: 'URL de la clínica' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pacientes filtrados con paginación',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        pacientes: { type: 'array' },
        pagination: { type: 'object' },
        filters: { type: 'object' },
      },
    },
  })
  @ApiBearerAuth()
  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchPatients(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() searchDto: SearchPatientsDto,
  ) {
    return this.patientsService.searchPatients(clinicaUrl, searchDto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPORTACIÓN Y EXPORTACIÓN DE PACIENTES
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('import')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Importar pacientes desde archivo CSV',
    description: 'Permite importar múltiples pacientes desde un archivo CSV. Soporta mapeo flexible de columnas (nombre+apellido, RUT/DNI, etc.)' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo CSV con los pacientes a importar',
        },
        duplicateStrategy: {
          type: 'string',
          enum: ['skip', 'update'],
          default: 'skip',
          description: 'Estrategia para manejar duplicados',
        },
        duplicateField: {
          type: 'string',
          enum: ['email', 'documento', 'both'],
          default: 'email',
          description: 'Campo para detectar duplicados',
        },
        dryRun: {
          type: 'boolean',
          default: false,
          description: 'Validar sin importar (modo de prueba)',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Importación completada con reporte de resultados',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        totalProcesados: { type: 'number' },
        exitosos: { type: 'number' },
        errores: { type: 'number' },
        duplicados: { type: 'number' },
        detallesErrores: { type: 'array' },
        pacientesCreados: { type: 'array' },
        tiempoProcesamiento: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Archivo inválido o errores de validación' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBearerAuth()
  async importPatients(
    @Param('clinicaUrl') clinicaUrl: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() options: ImportOptionsDto,
    @Request() req,
  ) {
    // Obtener la clínica del usuario autenticado
    const clinica = await this.patientsService['prisma'].clinica.findFirst({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new Error('Clínica no encontrada');
    }

    return this.patientsImportService.importFromCSV(file, clinica.id, options);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Exportar pacientes a CSV',
    description: 'Descarga todos los pacientes de la clínica en formato CSV' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Archivo CSV generado exitosamente',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Error al generar CSV' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBearerAuth()
  async exportPatients(
    @Param('clinicaUrl') clinicaUrl: string,
    @Res() res: Response,
  ) {
    // Obtener la clínica
    const clinica = await this.patientsService['prisma'].clinica.findFirst({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new Error('Clínica no encontrada');
    }

    const csv = await this.patientsImportService.exportToCSV(clinica.id);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `pacientes-${clinicaUrl}-${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get('import/template')
  @ApiOperation({ 
    summary: 'Descargar plantilla CSV de ejemplo',
    description: 'Descarga una plantilla CSV flexible que acepta múltiples nombres de columna en español, portugués e inglés' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Plantilla CSV descargada exitosamente',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  async downloadTemplate(@Res() res: Response) {
    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      'src',
      'patients',
      'templates',
      'plantilla-importacion-pacientes.csv',
    );

    // Verificar si el archivo existe
    if (!fs.existsSync(templatePath)) {
      throw new Error('Plantilla no encontrada');
    }

    const filename = 'plantilla-importacion-pacientes.csv';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(templatePath);
  }
}
