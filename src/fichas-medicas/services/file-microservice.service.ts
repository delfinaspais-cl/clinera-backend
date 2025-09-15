import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';

export interface FileUploadResponse {
  id: string;
  url: string;
  nombre: string;
  size: number;
  mimeType: string;
}

export interface FileUploadParams {
  file: Express.Multer.File;
  visibility: 'public' | 'private';
  scope: string;
  conversationId?: string;
  messageId?: string;
}

@Injectable()
export class FileMicroserviceService {
  private readonly microserviceUrl: string;
  private readonly authToken: string;

  constructor(private readonly configService: ConfigService) {
    this.microserviceUrl = this.configService.get<string>('FILE_MICROSERVICE_URL', 'https://fluentia-files-staging.up.railway.app');
    this.authToken = this.configService.get<string>('FILE_MICROSERVICE_TOKEN', '');
    
    console.log('🔧 FileMicroserviceService configurado:', {
      url: this.microserviceUrl,
      hasToken: !!this.authToken,
      tokenLength: this.authToken?.length || 0
    });
  }

  /**
   * Sube un archivo al microservicio de archivos
   */
  async uploadFile(params: FileUploadParams, userToken?: string): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      
      // Agregar el archivo
      formData.append('file', params.file.buffer, {
        filename: params.file.originalname,
        contentType: params.file.mimetype,
      });
      
      // Agregar los parámetros requeridos
      formData.append('visibility', params.visibility);
      formData.append('scope', params.scope);
      
      // Agregar parámetros opcionales si están presentes
      if (params.conversationId) {
        formData.append('conversation_id', params.conversationId);
      }
      
      if (params.messageId) {
        formData.append('message_id', params.messageId);
      }

      console.log('📤 Enviando archivo al microservicio:', {
        url: `${this.microserviceUrl}/files/upload`,
        fileName: params.file.originalname,
        fileSize: params.file.size,
        scope: params.scope,
        visibility: params.visibility,
        hasUserToken: !!userToken,
        hasConfigToken: !!this.authToken,
        tokenSource: userToken ? 'user' : (this.authToken ? 'config' : 'none')
      });

      // Preparar headers
      const headers = {
        ...formData.getHeaders(),
      };

      // Usar el token del usuario si está disponible, sino usar el token de configuración
      const tokenToUse = userToken || this.authToken;
      if (tokenToUse) {
        headers['Authorization'] = `Bearer ${tokenToUse}`;
      }

      const response = await axios.post(
        `${this.microserviceUrl}/files/upload`,
        formData,
        {
          headers,
          timeout: 30000, // 30 segundos timeout
        }
      );

      if (response.status !== 200) {
        throw new BadRequestException('Error al subir archivo al microservicio');
      }

      console.log('✅ Archivo subido exitosamente al microservicio:', response.data);

      // Transformar la respuesta al formato esperado
      return {
        id: response.data.id || response.data.fileId,
        url: response.data.url || response.data.fileUrl,
        nombre: response.data.nombre || response.data.fileName || params.file.originalname,
        size: response.data.size || params.file.size,
        mimeType: response.data.mimeType || params.file.mimetype,
      };

    } catch (error) {
      console.error('❌ Error en FileMicroserviceService.uploadFile:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // El servidor respondió con un código de error
          const statusCode = error.response.status;
          const errorMessage = error.response.data?.message || error.response.statusText;
          
          console.error('Error del microservicio:', {
            status: statusCode,
            message: errorMessage,
            data: error.response.data
          });

          if (statusCode === 401 || statusCode === 403) {
            throw new BadRequestException('Error de autenticación con el microservicio. Verifica la configuración.');
          } else if (statusCode === 400) {
            throw new BadRequestException(`Error en la petición: ${errorMessage}`);
          } else {
            throw new BadRequestException(`Error del microservicio (${statusCode}): ${errorMessage}`);
          }
        } else if (error.request) {
          // La petición fue hecha pero no se recibió respuesta
          console.error('No se recibió respuesta del microservicio:', error.request);
          throw new BadRequestException('No se pudo conectar con el microservicio de archivos. Verifica tu conexión a internet.');
        }
      }
      
      throw new BadRequestException('Error interno al subir archivo');
    }
  }

  /**
   * Elimina un archivo del microservicio
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      // Preparar headers
      const headers = {};

      // Solo agregar Authorization si hay token
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await axios.delete(
        `${this.microserviceUrl}/files/${fileId}`,
        {
          headers,
          timeout: 10000, // 10 segundos timeout
        }
      );

      if (response.status !== 200 && response.status !== 204) {
        throw new BadRequestException('Error al eliminar archivo del microservicio');
      }

    } catch (error) {
      console.error('Error en FileMicroserviceService.deleteFile:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new BadRequestException(
            `Error del microservicio: ${error.response.data?.message || error.response.statusText}`
          );
        } else if (error.request) {
          throw new BadRequestException('No se pudo conectar con el microservicio de archivos');
        }
      }
      
      throw new BadRequestException('Error interno al eliminar archivo');
    }
  }

  /**
   * Obtiene información de un archivo
   */
  async getFileInfo(fileId: string): Promise<FileUploadResponse> {
    try {
      // Preparar headers
      const headers = {};

      // Solo agregar Authorization si hay token
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await axios.get(
        `${this.microserviceUrl}/files/${fileId}`,
        {
          headers,
          timeout: 10000,
        }
      );

      if (response.status !== 200) {
        throw new BadRequestException('Error al obtener información del archivo');
      }

      return {
        id: response.data.id || response.data.fileId,
        url: response.data.url || response.data.fileUrl,
        nombre: response.data.nombre || response.data.fileName,
        size: response.data.size,
        mimeType: response.data.mimeType,
      };

    } catch (error) {
      console.error('Error en FileMicroserviceService.getFileInfo:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new BadRequestException(
            `Error del microservicio: ${error.response.data?.message || error.response.statusText}`
          );
        } else if (error.request) {
          throw new BadRequestException('No se pudo conectar con el microservicio de archivos');
        }
      }
      
      throw new BadRequestException('Error interno al obtener información del archivo');
    }
  }

  /**
   * Genera un scope único para las fichas médicas
   */
  generateScope(clinicaId: string, pacienteId: string, tipo: 'archivos' | 'imagenes'): string {
    return `fichas-medicas/${clinicaId}/${pacienteId}/${tipo}`;
  }

  /**
   * Valida si el archivo es de un tipo permitido
   */
  validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.mimetype);
  }

  /**
   * Valida el tamaño del archivo
   */
  validateFileSize(file: Express.Multer.File, maxSizeBytes: number): boolean {
    return file.size <= maxSizeBytes;
  }
}
