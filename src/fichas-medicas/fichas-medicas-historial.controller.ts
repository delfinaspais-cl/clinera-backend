import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { FichasMedicasHistorialService } from './fichas-medicas-historial.service';
import {
  CrearVersionFichaMedicaDto,
  FichaMedicaHistorialResponseDto,
  HistorialFichaMedicaResponseDto,
  ComparacionFichaMedicaResponseDto,
  ArchivoMedicoHistorialDto,
  EstadisticasFichasMedicasDto,
  PacienteFichaRecienteDto,
  FiltrosFichasMedicasDto,
  SubirArchivoVersionDto
} from './dto/ficha-medica-historial.dto';

@ApiTags('Fichas Médicas - Historial')
@Controller('clinica/:clinicaUrl/pacientes/:pacienteId/ficha-medica-historial')
export class FichasMedicasHistorialController {
  constructor(private readonly fichasMedicasHistorialService: FichasMedicasHistorialService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener ficha médica actual (última versión)' })
  @ApiResponse({ status: 200, description: 'Ficha médica actual obtenida exitosamente', type: FichaMedicaHistorialResponseDto })
  @ApiResponse({ status: 404, description: 'Clínica o paciente no encontrado' })
  async getFichaMedicaActual(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
  ): Promise<FichaMedicaHistorialResponseDto> {
    return this.fichasMedicasHistorialService.getFichaMedicaActual(clinicaUrl, pacienteId);
  }

  @Get('historial')
  @ApiOperation({ summary: 'Obtener historial completo de fichas médicas' })
  @ApiResponse({ status: 200, description: 'Historial obtenido exitosamente', type: HistorialFichaMedicaResponseDto })
  @ApiResponse({ status: 404, description: 'Clínica o paciente no encontrado' })
  async getHistorialFichaMedica(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
  ): Promise<HistorialFichaMedicaResponseDto> {
    return this.fichasMedicasHistorialService.getHistorialFichaMedica(clinicaUrl, pacienteId);
  }

  @Get('version/:versionId')
  @ApiOperation({ summary: 'Obtener una versión específica de la ficha médica' })
  @ApiResponse({ status: 200, description: 'Versión obtenida exitosamente', type: FichaMedicaHistorialResponseDto })
  @ApiResponse({ status: 404, description: 'Versión no encontrada' })
  async getVersionEspecifica(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Param('versionId') versionId: string,
  ): Promise<FichaMedicaHistorialResponseDto> {
    return this.fichasMedicasHistorialService.getVersionEspecifica(clinicaUrl, pacienteId, versionId);
  }

  @Put()
  @ApiOperation({ summary: 'Actualizar ficha médica (crea nueva versión automáticamente)' })
  @ApiResponse({ status: 200, description: 'Ficha médica actualizada exitosamente', type: FichaMedicaHistorialResponseDto })
  @ApiResponse({ status: 404, description: 'Clínica o paciente no encontrado' })
  async actualizarFichaMedica(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Body() datos: CrearVersionFichaMedicaDto,
  ): Promise<FichaMedicaHistorialResponseDto> {
    return this.fichasMedicasHistorialService.actualizarFichaMedica(clinicaUrl, pacienteId, datos);
  }

  @Post('version')
  @ApiOperation({ summary: 'Crear nueva versión de ficha médica' })
  @ApiResponse({ status: 201, description: 'Nueva versión creada exitosamente', type: FichaMedicaHistorialResponseDto })
  @ApiResponse({ status: 404, description: 'Clínica o paciente no encontrado' })
  async crearNuevaVersion(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Body() datos: CrearVersionFichaMedicaDto,
  ): Promise<FichaMedicaHistorialResponseDto> {
    return this.fichasMedicasHistorialService.crearNuevaVersion(clinicaUrl, pacienteId, datos);
  }

  @Get('compare/:version1Id/:version2Id')
  @ApiOperation({ summary: 'Comparar dos versiones de la ficha médica' })
  @ApiResponse({ status: 200, description: 'Comparación realizada exitosamente', type: ComparacionFichaMedicaResponseDto })
  @ApiResponse({ status: 404, description: 'Una o ambas versiones no encontradas' })
  async compararVersiones(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Param('version1Id') version1Id: string,
    @Param('version2Id') version2Id: string,
  ): Promise<ComparacionFichaMedicaResponseDto> {
    return this.fichasMedicasHistorialService.compararVersiones(clinicaUrl, pacienteId, version1Id, version2Id);
  }

  @Post('version/:versionId/upload-file')
  @ApiOperation({ summary: 'Subir archivo a una versión específica' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo a subir (PDF, DOC, DOCX)',
        },
        tipo: {
          type: 'string',
          enum: ['archivo', 'imagen'],
          description: 'Tipo de archivo',
        },
        descripcion: {
          type: 'string',
          description: 'Descripción del archivo (opcional)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Archivo subido exitosamente', type: ArchivoMedicoHistorialDto })
  @ApiResponse({ status: 400, description: 'Tipo de archivo no permitido' })
  @ApiResponse({ status: 404, description: 'Versión no encontrada' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async subirArchivoVersion(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Param('versionId') versionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Headers('authorization') authHeader: string,
  ): Promise<ArchivoMedicoHistorialDto> {
    console.log('📁 [UPLOAD_VERSION] Iniciando subida de archivo a versión específica');
    console.log('📁 [UPLOAD_VERSION] Parámetros recibidos:', {
      clinicaUrl,
      pacienteId,
      versionId,
      fileName: file?.originalname,
      fileSize: file?.size,
      fileMimeType: file?.mimetype,
      bodyTipo: body?.tipo,
      bodyDescripcion: body?.descripcion,
      hasAuthHeader: !!authHeader
    });
    
    if (!file) {
      console.error('❌ [UPLOAD_VERSION] No se proporcionó archivo');
      throw new BadRequestException('No se proporcionó archivo');
    }

    const { tipo, descripcion } = body;
    if (!tipo || !['archivo', 'imagen'].includes(tipo)) {
      console.error('❌ [UPLOAD_VERSION] Tipo de archivo inválido:', tipo);
      throw new BadRequestException('Tipo de archivo debe ser "archivo" o "imagen"');
    }

    // Extraer el token del header Authorization
    const token = authHeader?.replace('Bearer ', '') || '';
    console.log('📁 [UPLOAD_VERSION] Token extraído:', {
      hasToken: !!token,
      tokenLength: token.length
    });

    console.log('📁 [UPLOAD_VERSION] Llamando al servicio con parámetros:', {
      clinicaUrl,
      pacienteId,
      versionId,
      tipo,
      descripcion,
      hasToken: !!token
    });

    return this.fichasMedicasHistorialService.subirArchivoVersion(
      clinicaUrl,
      pacienteId,
      versionId,
      file,
      tipo,
      descripcion,
      token
    );
  }

  @Get('version/:versionId/archivos')
  @ApiOperation({ summary: 'Obtener archivos de una versión específica' })
  @ApiResponse({ status: 200, description: 'Archivos obtenidos exitosamente', type: [ArchivoMedicoHistorialDto] })
  @ApiResponse({ status: 404, description: 'Versión no encontrada' })
  async getArchivosVersion(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Param('versionId') versionId: string,
  ): Promise<ArchivoMedicoHistorialDto[]> {
    return this.fichasMedicasHistorialService.getArchivosVersion(clinicaUrl, pacienteId, versionId);
  }

  @Delete('version/:versionId/archivos/:archivoId')
  @ApiOperation({ summary: 'Eliminar archivo de una versión específica' })
  @ApiResponse({ status: 200, description: 'Archivo eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async eliminarArchivoVersion(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Param('versionId') versionId: string,
    @Param('archivoId') archivoId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.fichasMedicasHistorialService.eliminarArchivoVersion(clinicaUrl, pacienteId, versionId, archivoId);
  }

  @Post('restore/:versionId')
  @ApiOperation({ summary: 'Restaurar una versión anterior (crear nueva versión basada en una anterior)' })
  @ApiResponse({ status: 201, description: 'Versión restaurada exitosamente', type: FichaMedicaHistorialResponseDto })
  @ApiResponse({ status: 404, description: 'Versión no encontrada' })
  async restaurarVersion(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Param('versionId') versionId: string,
    @Body() body: { notasCambio: string },
  ): Promise<FichaMedicaHistorialResponseDto> {
    return this.fichasMedicasHistorialService.restaurarVersion(
      clinicaUrl,
      pacienteId,
      versionId,
      body.notasCambio
    );
  }
}

// Controlador global para estadísticas y búsquedas
@ApiTags('Fichas Médicas - Global')
@Controller('clinica/:clinicaUrl/fichas-medicas')
export class FichasMedicasGlobalController {
  constructor(private readonly fichasMedicasHistorialService: FichasMedicasHistorialService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar fichas médicas por clínica (con filtros)' })
  @ApiQuery({ name: 'search', required: false, description: 'Término de búsqueda' })
  @ApiQuery({ name: 'fechaDesde', required: false, description: 'Fecha desde (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fechaHasta', required: false, description: 'Fecha hasta (YYYY-MM-DD)' })
  @ApiQuery({ name: 'doctorId', required: false, description: 'ID del doctor' })
  @ApiResponse({ status: 200, description: 'Fichas médicas encontradas' })
  async buscarFichasMedicas(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filtros: FiltrosFichasMedicasDto,
  ): Promise<any[]> {
    return this.fichasMedicasHistorialService.buscarFichasMedicas(clinicaUrl, filtros);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de fichas médicas' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente', type: EstadisticasFichasMedicasDto })
  async getEstadisticasFichasMedicas(
    @Param('clinicaUrl') clinicaUrl: string,
  ): Promise<EstadisticasFichasMedicasDto> {
    return this.fichasMedicasHistorialService.getEstadisticasFichasMedicas(clinicaUrl);
  }

  @Get('pacientes/fichas-recientes')
  @ApiOperation({ summary: 'Buscar pacientes con fichas médicas actualizadas recientemente' })
  @ApiQuery({ name: 'dias', required: false, description: 'Número de días (por defecto 7)', type: Number })
  @ApiResponse({ status: 200, description: 'Pacientes encontrados', type: [PacienteFichaRecienteDto] })
  async getPacientesFichasRecientes(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query('dias') dias?: number,
  ): Promise<PacienteFichaRecienteDto[]> {
    return this.fichasMedicasHistorialService.getPacientesFichasRecientes(clinicaUrl, dias || 7);
  }
}
