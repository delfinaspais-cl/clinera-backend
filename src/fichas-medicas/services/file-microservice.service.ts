import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import * as jwt from 'jsonwebtoken';

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
  private readonly microserviceJwtSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.microserviceUrl = this.configService.get<string>('FILE_MICROSERVICE_URL', 'https://fluentia-files-develop-latest.up.railway.app');
    this.authToken = ''; // No se usa, el microservicio acepta el JWT del usuario
    this.microserviceJwtSecret = this.configService.get<string>('FILE_MICROSERVICE_JWT_SECRET', '@leaf$MVC*JWT#AUTH.Secret'); // JWT_SECRET del microservicio
    
    console.log('🔧 FileMicroserviceService configurado:', {
      url: this.microserviceUrl,
      authMethod: 'JWT del usuario con secret del microservicio'
    });
  }

  /**
   * Sube un archivo al microservicio de archivos
   */
  async uploadFile(params: FileUploadParams, userToken?: string): Promise<FileUploadResponse | { error: string; statusCode: number }> {
    console.log('🚀 [UPLOAD] Iniciando proceso de subida de archivo');
    console.log('🚀 [UPLOAD] Parámetros recibidos:', {
      fileName: params.file?.originalname,
      fileSize: params.file?.size,
      mimeType: params.file?.mimetype,
      scope: params.scope,
      visibility: params.visibility,
      conversationId: params.conversationId,
      messageId: params.messageId,
      hasUserToken: !!userToken,
      userTokenLength: userToken?.length || 0
    });
    
    
    try {
      const formData = new FormData();
      
      console.log('📦 [UPLOAD] Preparando FormData...');
      
      // Agregar el archivo
      // Verificar si tenemos buffer o usar el archivo completo
      let fileData;
      if (params.file.buffer) {
        // Usar buffer si está disponible
        fileData = params.file.buffer;
        console.log('📦 [UPLOAD] Usando buffer del archivo');
      } else if (params.file.path) {
        // Usar el path del archivo si no hay buffer
        const fs = require('fs');
        fileData = fs.createReadStream(params.file.path);
        console.log('📦 [UPLOAD] Usando stream del archivo desde path:', params.file.path);
      } else {
        throw new Error('No hay buffer ni path disponible para el archivo');
      }
      
      console.log('📦 [UPLOAD] Tipo de archivo para FormData:', {
        hasBuffer: !!params.file.buffer,
        hasPath: !!params.file.path,
        fileSize: params.file.size,
        usingBuffer: !!params.file.buffer,
        usingStream: !params.file.buffer && !!params.file.path
      });
      
      formData.append('file', fileData, {
        filename: params.file.originalname,
        contentType: params.file.mimetype,
      });
      
      console.log('📦 [UPLOAD] Archivo agregado al FormData:', {
        filename: params.file.originalname,
        contentType: params.file.mimetype,
        bufferSize: params.file.buffer?.length || 'undefined',
        hasBuffer: !!params.file.buffer
      });
      
      // Agregar los parámetros requeridos
      formData.append('visibility', params.visibility);
      formData.append('scope', params.scope);
      
      console.log('📦 [UPLOAD] Parámetros básicos agregados:', {
        visibility: params.visibility,
        scope: params.scope
      });
      
      // Agregar parámetros opcionales si están presentes
      if (params.conversationId) {
        formData.append('conversation_id', params.conversationId);
        console.log('📦 [UPLOAD] conversation_id agregado:', params.conversationId);
      }
      
      if (params.messageId) {
        formData.append('message_id', params.messageId);
        console.log('📦 [UPLOAD] message_id agregado:', params.messageId);
      }

      console.log('📤 [UPLOAD] Enviando archivo al microservicio:', {
        url: `${this.microserviceUrl}/files/upload`,
        fileName: params.file.originalname,
        fileSize: params.file.size,
        scope: params.scope,
        visibility: params.visibility,
        hasUserToken: !!userToken,
        tokenSource: userToken ? 'user' : 'none'
      });

      // Preparar headers
      const headers = {
        ...formData.getHeaders(),
      };
      
      console.log('📋 [UPLOAD] Headers del FormData preparados:', Object.keys(headers));

      // Generar un nuevo JWT con el secret del microservicio
      if (userToken) {
        console.log('🔑 [UPLOAD] Procesando token de usuario...');
        try {
          // Decodificar el JWT del usuario para obtener el payload
          const decoded = jwt.decode(userToken) as any;
          
          console.log('🔑 [UPLOAD] Token decodificado:', {
            hasDecoded: !!decoded,
            sub: decoded?.sub,
            email: decoded?.email,
            role: decoded?.role,
            clinicaId: decoded?.clinicaId,
            exp: decoded?.exp,
            iat: decoded?.iat
          });
          
          if (!decoded) {
            console.error('❌ [UPLOAD] Token de usuario inválido - no se pudo decodificar');
            throw new BadRequestException('Token de usuario inválido');
          }
          
          // Usar el token del usuario directamente
          console.log('🔑 [UPLOAD] Usando token de usuario directamente');
          
          headers['Authorization'] = `Bearer ${userToken}`;
          
          console.log('🔑 [UPLOAD] Token configurado:', {
            tokenLength: userToken.length,
            authHeader: `Bearer ${userToken.substring(0, 50)}...`
          });
          
        } catch (error) {
          console.error('❌ [UPLOAD] Error generando JWT para microservicio:', {
            error: error.message,
            stack: error.stack,
            userTokenPreview: userToken?.substring(0, 50) + '...'
          });
          throw new BadRequestException('Error procesando token de autenticación');
        }
      } else {
        console.error('❌ [UPLOAD] Token de autenticación del usuario requerido');
        throw new BadRequestException('Token de autenticación del usuario requerido.');
      }

      console.log('🌐 [UPLOAD] Enviando petición HTTP POST al microservicio...');
      console.log('🌐 [UPLOAD] URL completa:', `${this.microserviceUrl}/files/upload`);
      console.log('🌐 [UPLOAD] Headers finales:', {
        ...headers,
        Authorization: (headers as any).Authorization ? `Bearer ${(headers as any).Authorization.split(' ')[1].substring(0, 20)}...` : 'NO_AUTH'
      });
      
      const response = await axios.post(
        `${this.microserviceUrl}/files/upload`,
        formData,
        {
          headers,
          timeout: 60000, // 60 segundos timeout
        }
      );
      
      console.log('📥 [UPLOAD] Respuesta recibida del microservicio:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataKeys: Object.keys(response.data || {}),
        data: response.data
      });

      if (response.status !== 200 && response.status !== 201) {
        console.error('❌ [UPLOAD] Estado de respuesta no exitoso:', response.status);
        throw new BadRequestException('Error al subir archivo al microservicio');
      }

      console.log('✅ [UPLOAD] Archivo subido exitosamente al microservicio:', response.data);

      // Transformar la respuesta al formato esperado
      const content = response.data.content || response.data;
      const transformedResponse = {
        id: content.id || response.data.id || response.data.fileId,
        url: content.url || response.data.url || response.data.fileUrl,
        nombre: content.original_name || content.nombre || response.data.nombre || response.data.fileName || params.file.originalname,
        size: content.size || response.data.size || params.file.size,
        mimeType: content.mime_type || content.mimeType || response.data.mimeType || params.file.mimetype,
      };
      
      console.log('🔄 [UPLOAD] Respuesta transformada:', transformedResponse);
      
      return transformedResponse;

    } catch (error) {
      console.error('❌ [UPLOAD] Error en FileMicroserviceService.uploadFile:', {
        errorType: error.constructor.name,
        message: error.message,
        stack: error.stack,
        isAxiosError: axios.isAxiosError(error)
      });
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // El servidor respondió con un código de error
          const statusCode = error.response.status;
          const errorMessage = error.response.data?.message || error.response.statusText;
          
          console.error('❌ [UPLOAD] Error del microservicio:', {
            status: statusCode,
            statusText: error.response.statusText,
            message: errorMessage,
            data: error.response.data,
            headers: error.response.headers,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              timeout: error.config?.timeout
            }
          });

          if (statusCode === 401 || statusCode === 403) {
            console.error('🔐 [UPLOAD] Error de autenticación/autorización');
            return { error: 'Error de autenticación con el microservicio. Verifica la configuración.', statusCode };
          } else if (statusCode === 400) {
            console.error('📝 [UPLOAD] Error de petición (400)');
            return { error: `Error en la petición: ${errorMessage}`, statusCode };
          } else {
            console.error('🌐 [UPLOAD] Error del servidor:', statusCode);
            return { error: `Error del microservicio (${statusCode}): ${errorMessage}`, statusCode };
          }
        } else if (error.request) {
          // La petición fue hecha pero no se recibió respuesta
          console.error('❌ [UPLOAD] No se recibió respuesta del microservicio:', {
            request: error.request,
            code: error.code,
            message: error.message
          });
          return { error: 'No se pudo conectar con el microservicio de archivos. Verifica tu conexión a internet.', statusCode: 503 };
        } else {
          console.error('❌ [UPLOAD] Error en la configuración de la petición:', {
            message: error.message,
            config: error.config
          });
          return { error: 'Error en la configuración de la petición al microservicio', statusCode: 500 };
        }
      }
      
      console.error('❌ [UPLOAD] Error interno no relacionado con Axios');
      return { error: 'Error interno al subir archivo', statusCode: 500 };
    }
  }

  /**
   * Registra un usuario en el microservicio de archivos
   */
  async registerUser(userData: { name: string; email: string; password: string }): Promise<{ success: boolean; userId?: string } | { error: string; statusCode: number }> {
    console.log('👤 [REGISTER] Iniciando registro de usuario en microservicio');
    console.log('👤 [REGISTER] Datos del usuario:', {
      name: userData.name,
      email: userData.email,
      hasPassword: !!userData.password
    });
    
    try {
      const response = await axios.post(
        `${this.microserviceUrl}/auth/register`,
        {
          name: userData.name,
          email: userData.email,
          password: userData.password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000,
        }
      );
      
      console.log('📥 [REGISTER] Respuesta recibida del microservicio:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      if (response.status !== 200 && response.status !== 201) {
        console.error('❌ [REGISTER] Estado de respuesta no exitoso:', response.status);
        throw new BadRequestException('Error al registrar usuario en el microservicio');
      }

      console.log('✅ [REGISTER] Usuario registrado exitosamente en el microservicio');
      
      return {
        success: true,
        userId: response.data.userId || response.data.id
      };
      
    } catch (error) {
      console.error('❌ [REGISTER] Error en FileMicroserviceService.registerUser:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        stack: error.stack
      });
      
      if (error.response?.status === 409) {
        return {
          error: 'El usuario ya existe en el microservicio',
          statusCode: 409
        };
      }
      
      return {
        error: error.message || 'Error al registrar usuario en el microservicio',
        statusCode: error.response?.status || 500
      };
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
   * Obtiene una URL firmada para acceder a un archivo
   */
  async getSignedUrl(fileId: string, userToken?: string): Promise<{ url: string } | { error: string; statusCode: number }> {
    console.log('🔗 [SIGNED_URL] Iniciando proceso de obtención de URL firmada');
    console.log('🔗 [SIGNED_URL] Parámetros recibidos:', {
      fileId,
      hasUserToken: !!userToken,
      userTokenLength: userToken?.length || 0
    });
    
    try {
      // Preparar headers
      const headers = {};

      // Generar un nuevo JWT con el secret del microservicio
      if (userToken) {
        console.log('🔑 [SIGNED_URL] Procesando token de usuario...');
        try {
          // Decodificar el JWT del usuario para obtener el payload
          const decoded = jwt.decode(userToken) as any;
          
          console.log('🔑 [SIGNED_URL] Token decodificado:', {
            hasDecoded: !!decoded,
            sub: decoded?.sub,
            email: decoded?.email,
            role: decoded?.role,
            clinicaId: decoded?.clinicaId
          });
          
          if (!decoded) {
            console.error('❌ [SIGNED_URL] Token de usuario inválido - no se pudo decodificar');
            throw new BadRequestException('Token de usuario inválido');
          }
          
          // Usar el token del usuario directamente
          console.log('🔑 [SIGNED_URL] Usando token de usuario directamente');
          
          headers['Authorization'] = `Bearer ${userToken}`;
          
          console.log('🔑 [SIGNED_URL] Token configurado:', {
            tokenLength: userToken.length,
            authHeader: `Bearer ${userToken.substring(0, 50)}...`
          });
          
        } catch (error) {
          console.error('❌ [SIGNED_URL] Error generando JWT para microservicio:', {
            error: error.message,
            stack: error.stack,
            userTokenPreview: userToken?.substring(0, 50) + '...'
          });
          throw new BadRequestException('Error procesando token de autenticación');
        }
      } else {
        console.error('❌ [SIGNED_URL] Token de autenticación del usuario requerido');
        throw new BadRequestException('Token de autenticación del usuario requerido.');
      }

      console.log('🌐 [SIGNED_URL] Enviando petición HTTP GET al microservicio...');
      console.log('🌐 [SIGNED_URL] URL completa:', `${this.microserviceUrl}/files/${fileId}/url`);
      console.log('🌐 [SIGNED_URL] Headers:', {
        ...headers,
        Authorization: (headers as any).Authorization ? `Bearer ${(headers as any).Authorization.split(' ')[1].substring(0, 20)}...` : 'NO_AUTH'
      });

      const response = await axios.get(
        `${this.microserviceUrl}/files/${fileId}/url`,
        {
          headers,
          timeout: 10000,
        }
      );
      
      console.log('📥 [SIGNED_URL] Respuesta recibida del microservicio:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataKeys: Object.keys(response.data || {}),
        data: response.data
      });

      if (response.status !== 200) {
        console.error('❌ [SIGNED_URL] Estado de respuesta no exitoso:', response.status);
        throw new BadRequestException('Error al obtener URL firmada del microservicio');
      }

      console.log('✅ [SIGNED_URL] URL firmada obtenida exitosamente:', response.data);

      return {
        url: response.data.url || response.data.signedUrl || response.data.fileUrl
      };

    } catch (error) {
      console.error('❌ [SIGNED_URL] Error en FileMicroserviceService.getSignedUrl:', {
        errorType: error.constructor.name,
        message: error.message,
        stack: error.stack,
        isAxiosError: axios.isAxiosError(error)
      });
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // El servidor respondió con un código de error
          const statusCode = error.response.status;
          const errorMessage = error.response.data?.message || error.response.statusText;
          
          console.error('❌ [SIGNED_URL] Error del microservicio:', {
            status: statusCode,
            statusText: error.response.statusText,
            message: errorMessage,
            data: error.response.data,
            headers: error.response.headers
          });

          if (statusCode === 401 || statusCode === 403) {
            console.error('🔐 [SIGNED_URL] Error de autenticación/autorización');
            return { error: 'Error de autenticación con el microservicio. Verifica la configuración.', statusCode };
          } else if (statusCode === 400) {
            console.error('📝 [SIGNED_URL] Error de petición (400)');
            return { error: `Error en la petición: ${errorMessage}`, statusCode };
          } else if (statusCode === 404) {
            console.error('🔍 [SIGNED_URL] Archivo no encontrado (404)');
            return { error: `Archivo no encontrado: ${errorMessage}`, statusCode };
          } else {
            console.error('🌐 [SIGNED_URL] Error del servidor:', statusCode);
            return { error: `Error del microservicio (${statusCode}): ${errorMessage}`, statusCode };
          }
        } else if (error.request) {
          // La petición fue hecha pero no se recibió respuesta
          console.error('❌ [SIGNED_URL] No se recibió respuesta del microservicio:', {
            request: error.request,
            code: error.code,
            message: error.message
          });
          return { error: 'No se pudo conectar con el microservicio de archivos. Verifica tu conexión a internet.', statusCode: 503 };
        } else {
          console.error('❌ [SIGNED_URL] Error en la configuración de la petición:', {
            message: error.message,
            config: error.config
          });
          return { error: 'Error en la configuración de la petición al microservicio', statusCode: 500 };
        }
      }
      
      console.error('❌ [SIGNED_URL] Error interno no relacionado con Axios');
      return { error: 'Error interno al obtener URL firmada', statusCode: 500 };
    }
  }

  /**
   * Obtiene información de un archivo
   */
  async getFileInfo(fileId: string): Promise<FileUploadResponse> {
    console.log('📋 [FILE_INFO] Iniciando proceso de obtención de información de archivo');
    console.log('📋 [FILE_INFO] Parámetros recibidos:', { fileId });
    
    try {
      // Preparar headers
      const headers = {};

      // Solo agregar Authorization si hay token
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
        console.log('🔑 [FILE_INFO] Usando token de autenticación interno');
      } else {
        console.log('⚠️ [FILE_INFO] No hay token de autenticación interno');
      }

      console.log('🌐 [FILE_INFO] Enviando petición HTTP GET al microservicio...');
      console.log('🌐 [FILE_INFO] URL completa:', `${this.microserviceUrl}/files/${fileId}`);

      const response = await axios.get(
        `${this.microserviceUrl}/files/${fileId}`,
        {
          headers,
          timeout: 10000,
        }
      );
      
      console.log('📥 [FILE_INFO] Respuesta recibida del microservicio:', {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data || {}),
        data: response.data
      });

      if (response.status !== 200) {
        console.error('❌ [FILE_INFO] Estado de respuesta no exitoso:', response.status);
        throw new BadRequestException('Error al obtener información del archivo');
      }

      console.log('✅ [FILE_INFO] Información de archivo obtenida exitosamente');

      return {
        id: response.data.id || response.data.fileId,
        url: response.data.url || response.data.fileUrl,
        nombre: response.data.nombre || response.data.fileName,
        size: response.data.size,
        mimeType: response.data.mimeType,
      };

    } catch (error) {
      console.error('❌ [FILE_INFO] Error en FileMicroserviceService.getFileInfo:', {
        errorType: error.constructor.name,
        message: error.message,
        stack: error.stack,
        isAxiosError: axios.isAxiosError(error)
      });
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('❌ [FILE_INFO] Error del microservicio:', {
            status: error.response.status,
            statusText: error.response.statusText,
            message: error.response.data?.message || error.response.statusText,
            data: error.response.data
          });
          throw new BadRequestException(
            `Error del microservicio: ${error.response.data?.message || error.response.statusText}`
          );
        } else if (error.request) {
          console.error('❌ [FILE_INFO] No se recibió respuesta del microservicio');
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
