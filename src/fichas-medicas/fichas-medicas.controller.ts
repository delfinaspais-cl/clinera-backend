import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
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
} from '@nestjs/swagger';

import { FichasMedicasService } from './fichas-medicas.service';
import { FichasMedicasHistorialService } from './fichas-medicas-historial.service';
import { FichaMedicaDto, FichaMedicaResponseDto, ArchivoMedicoDto, ImagenMedicaDto } from './dto/ficha-medica.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Fichas Médicas')
@Controller('clinica/:clinicaUrl/pacientes/:pacienteId/ficha-medica')
export class FichasMedicasController {
  constructor(
    private readonly fichasMedicasService: FichasMedicasService,
    private readonly fichasMedicasHistorialService: FichasMedicasHistorialService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener ficha médica de un paciente' })
  @ApiResponse({ status: 200, description: 'Ficha médica obtenida exitosamente', type: FichaMedicaResponseDto })
  @ApiResponse({ status: 404, description: 'Clínica o paciente no encontrado' })
  async getFichaMedica(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
  ): Promise<FichaMedicaResponseDto> {
    return this.fichasMedicasService.getFichaMedica(clinicaUrl, pacienteId);
  }

  @Post()
  @ApiOperation({ summary: 'Guardar ficha médica de un paciente' })
  @ApiResponse({ status: 200, description: 'Ficha médica guardada exitosamente' })
  @ApiResponse({ status: 404, description: 'Clínica o paciente no encontrado' })
  async saveFichaMedica(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Body() fichaData: FichaMedicaDto,
  ): Promise<{ success: boolean; message: string; fichaId: string }> {
    return this.fichasMedicasService.saveFichaMedica(clinicaUrl, pacienteId, fichaData);
  }

  @Post('upload-file')
  @ApiOperation({ summary: 'Subir archivo médico' })
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
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Archivo subido exitosamente', type: ArchivoMedicoDto })
  @ApiResponse({ status: 400, description: 'Tipo de archivo no permitido' })
  @ApiResponse({ status: 404, description: 'Clínica o paciente no encontrado' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de archivo no permitido'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadFile(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('authorization') authHeader: string,
  ): Promise<ArchivoMedicoDto> {
    console.log('🔍 DEBUG: uploadFile controller - authHeader:', authHeader);
    console.log('🔍 DEBUG: uploadFile controller - file:', file?.originalname, file?.size);
    
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }
    
    // Extraer el token del header Authorization
    const token = authHeader?.replace('Bearer ', '') || '';
    console.log('🔍 DEBUG: uploadFile controller - token extraído:', token ? 'SÍ' : 'NO');
    console.log('🔍 DEBUG: uploadFile controller - token length:', token.length);
    
    return this.fichasMedicasService.uploadFile(clinicaUrl, pacienteId, file, token);
  }

  @Post('upload-image')
  @ApiOperation({ summary: 'Subir imagen médica' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Imagen a subir',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Imagen subida exitosamente', type: ImagenMedicaDto })
  @ApiResponse({ status: 400, description: 'El archivo debe ser una imagen' })
  @ApiResponse({ status: 404, description: 'Clínica o paciente no encontrado' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('El archivo debe ser una imagen'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadImage(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('authorization') authHeader: string,
  ): Promise<ImagenMedicaDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó imagen');
    }
    
    // Extraer el token del header Authorization
    const token = authHeader?.replace('Bearer ', '') || '';
    
    return this.fichasMedicasService.uploadImage(clinicaUrl, pacienteId, file, token);
  }

  @Delete('files/:fileId')
  @ApiOperation({ summary: 'Eliminar archivo médico' })
  @ApiResponse({ status: 200, description: 'Archivo eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async deleteFile(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Param('fileId') fileId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.fichasMedicasService.deleteFile(clinicaUrl, pacienteId, fileId);
  }

  @Delete('images/:imageId')
  @ApiOperation({ summary: 'Eliminar imagen médica' })
  @ApiResponse({ status: 200, description: 'Imagen eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  async deleteImage(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Param('imageId') imageId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.fichasMedicasService.deleteImage(clinicaUrl, pacienteId, imageId);
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
  @ApiResponse({ status: 200, description: 'Archivo subido exitosamente', type: ArchivoMedicoDto })
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
  async uploadFileToVersion(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Param('versionId') versionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Headers('authorization') authHeader: string,
  ): Promise<ArchivoMedicoDto> {
    console.log('📁 [UPLOAD_FILE_VERSION] Iniciando subida de archivo a versión específica');
    console.log('📁 [UPLOAD_FILE_VERSION] Parámetros recibidos:', {
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
      console.error('❌ [UPLOAD_FILE_VERSION] No se proporcionó archivo');
      throw new BadRequestException('No se proporcionó archivo');
    }

    const { tipo, descripcion } = body;
    if (!tipo || !['archivo', 'imagen'].includes(tipo)) {
      console.error('❌ [UPLOAD_FILE_VERSION] Tipo de archivo inválido:', tipo);
      throw new BadRequestException('Tipo de archivo debe ser "archivo" o "imagen"');
    }

    // Extraer el token del header Authorization
    const token = authHeader?.replace('Bearer ', '') || '';
    console.log('📁 [UPLOAD_FILE_VERSION] Token extraído:', {
      hasToken: !!token,
      tokenLength: token.length
    });

    console.log('📁 [UPLOAD_FILE_VERSION] Llamando al servicio con parámetros:', {
      clinicaUrl,
      pacienteId,
      versionId,
      tipo,
      descripcion,
      hasToken: !!token
    });

    // Llamar al servicio de historial para manejar la subida
    console.log('📁 [UPLOAD_FILE_VERSION] Verificando disponibilidad del servicio...');
    console.log('📁 [UPLOAD_FILE_VERSION] fichasMedicasHistorialService:', !!this.fichasMedicasHistorialService);
    console.log('📁 [UPLOAD_FILE_VERSION] typeof fichasMedicasHistorialService:', typeof this.fichasMedicasHistorialService);
    
    if (!this.fichasMedicasHistorialService) {
      console.error('❌ [UPLOAD_FILE_VERSION] fichasMedicasHistorialService no está disponible');
      throw new Error('Servicio de historial no disponible');
    }

    console.log('📁 [UPLOAD_FILE_VERSION] Llamando al servicio de historial...');
    try {
      const result = await this.fichasMedicasHistorialService.subirArchivoVersion(
        clinicaUrl,
        pacienteId,
        versionId,
        file,
        tipo,
        descripcion,
        token
      );
      console.log('✅ [UPLOAD_FILE_VERSION] Subida completada exitosamente:', result);
      
      // Convertir ArchivoMedicoHistorialDto a ArchivoMedicoDto
      const archivoDto: ArchivoMedicoDto = {
        id: result.id,
        tipo: result.tipo,
        nombre: result.nombre,
        url: result.url,
        fecha: result.fechaSubida
      };
      
      console.log('✅ [UPLOAD_FILE_VERSION] DTO convertido:', archivoDto);
      return archivoDto;
    } catch (error) {
      console.error('❌ [UPLOAD_FILE_VERSION] Error en el servicio de historial:', error);
      throw error;
    }
  }

  @Post('version/:versionId/upload-image')
  @ApiOperation({ summary: 'Subir imagen a una versión específica' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Imagen a subir',
        },
        descripcion: {
          type: 'string',
          description: 'Descripción de la imagen (opcional)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Imagen subida exitosamente', type: ImagenMedicaDto })
  @ApiResponse({ status: 400, description: 'El archivo debe ser una imagen' })
  @ApiResponse({ status: 404, description: 'Versión no encontrada' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const randomName = uuidv4();
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('El archivo debe ser una imagen'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadImageToVersion(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Param('versionId') versionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Headers('authorization') authHeader: string,
  ): Promise<ImagenMedicaDto> {
    console.log('🖼️ [UPLOAD_IMAGE_VERSION] Iniciando subida de imagen a versión');
    console.log('🖼️ [UPLOAD_IMAGE_VERSION] Parámetros recibidos:', {
      clinicaUrl,
      pacienteId,
      versionId,
      fileName: file?.originalname,
      fileSize: file?.size,
      fileMimeType: file?.mimetype,
      hasAuthHeader: !!authHeader
    });

    const token = authHeader?.replace('Bearer ', '');
    const descripcion = body.descripcion;

    console.log('🖼️ [UPLOAD_IMAGE_VERSION] Verificando disponibilidad del servicio...');
    console.log('🖼️ [UPLOAD_IMAGE_VERSION] fichasMedicasHistorialService:', !!this.fichasMedicasHistorialService);
    console.log('🖼️ [UPLOAD_IMAGE_VERSION] typeof fichasMedicasHistorialService:', typeof this.fichasMedicasHistorialService);
    
    if (!this.fichasMedicasHistorialService) {
      console.error('❌ [UPLOAD_IMAGE_VERSION] fichasMedicasHistorialService no está disponible');
      throw new Error('Servicio de historial no disponible');
    }

    console.log('🖼️ [UPLOAD_IMAGE_VERSION] Llamando al servicio de historial...');
    try {
      const result = await this.fichasMedicasHistorialService.subirArchivoVersion(
        clinicaUrl,
        pacienteId,
        versionId,
        file,
        'imagen', // Tipo fijo para imágenes
        descripcion,
        token
      );
      console.log('✅ [UPLOAD_IMAGE_VERSION] Subida completada exitosamente:', result);
      
      // Convertir ArchivoMedicoHistorialDto a ImagenMedicaDto
      const imagenDto: ImagenMedicaDto = {
        id: result.id,
        nombre: result.nombre,
        url: result.url,
        fecha: result.fechaSubida,
        descripcion: result.descripcion || ''
      };
      
      console.log('✅ [UPLOAD_IMAGE_VERSION] DTO convertido:', imagenDto);
      return imagenDto;
    } catch (error) {
      console.error('❌ [UPLOAD_IMAGE_VERSION] Error en el servicio de historial:', error);
      throw error;
    }
  }

  @Get('files/:fileId/signed-url')
  @ApiOperation({ summary: 'Obtener URL firmada para acceder a un archivo' })
  @ApiResponse({ status: 200, description: 'URL firmada obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async getSignedUrl(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('pacienteId') pacienteId: string,
    @Param('fileId') fileId: string,
    @Headers('authorization') authHeader: string,
  ): Promise<{ url: string } | { error: string; statusCode: number }> {
    console.log('🔗 [SIGNED_URL_CONTROLLER] Iniciando obtención de URL firmada');
    console.log('🔗 [SIGNED_URL_CONTROLLER] Parámetros recibidos:', {
      clinicaUrl,
      pacienteId,
      fileId,
      hasAuthHeader: !!authHeader
    });
    
    // Extraer el token del header Authorization
    const token = authHeader?.replace('Bearer ', '') || '';
    console.log('🔗 [SIGNED_URL_CONTROLLER] Token extraído:', {
      hasToken: !!token,
      tokenLength: token.length
    });
    
    return this.fichasMedicasService.getSignedUrl(clinicaUrl, pacienteId, fileId, token);
  }
}
