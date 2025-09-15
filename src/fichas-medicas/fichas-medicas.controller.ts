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
import { FichaMedicaDto, FichaMedicaResponseDto, ArchivoMedicoDto, ImagenMedicaDto } from './dto/ficha-medica.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Fichas Médicas')
@Controller('clinica/:clinicaUrl/pacientes/:pacienteId/ficha-medica')
export class FichasMedicasController {
  constructor(private readonly fichasMedicasService: FichasMedicasService) {}

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
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }
    
    // Extraer el token del header Authorization
    const token = authHeader?.replace('Bearer ', '') || '';
    
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
}
