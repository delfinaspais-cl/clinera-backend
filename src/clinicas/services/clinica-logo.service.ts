import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../fichas-medicas/services/storage.service';
import { FileMicroserviceService } from '../../fichas-medicas/services/file-microservice.service';

export interface ClinicaLogoDto {
  id: string;
  nombre: string;
  url: string;
  fechaSubida: string;
}

@Injectable()
export class ClinicaLogoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly fileMicroserviceService: FileMicroserviceService,
  ) {}

  /**
   * Subir logo de una clínica
   */
  async uploadLogo(
    clinicaUrl: string,
    file: Express.Multer.File,
    userToken?: string
  ): Promise<ClinicaLogoDto> {
    console.log('🖼️ [CLINICA_LOGO] Iniciando subida de logo');
    console.log('🖼️ [CLINICA_LOGO] Parámetros:', {
      clinicaUrl,
      fileName: file?.originalname,
      fileSize: file?.size,
      mimeType: file?.mimetype,
      hasUserToken: !!userToken
    });

    // Verificar que la clínica existe
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Validar tipo de imagen
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!this.fileMicroserviceService.validateFileType(file, allowedImageTypes)) {
      throw new BadRequestException('El archivo debe ser una imagen válida (JPEG, PNG, GIF, WebP, SVG)');
    }

    // Validar tamaño del archivo (5MB máximo para logos)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (!this.fileMicroserviceService.validateFileSize(file, maxSizeBytes)) {
      throw new BadRequestException('La imagen es demasiado grande. Máximo 5MB');
    }

    // Si ya existe un logo, eliminarlo primero
    if (clinica.logo) {
      console.log('🗑️ [CLINICA_LOGO] Eliminando logo anterior:', clinica.logo);
      try {
        await this.storageService.deleteFile(clinica.logo);
      } catch (error) {
        console.warn('⚠️ [CLINICA_LOGO] Error eliminando logo anterior:', error);
        // Continuar aunque falle la eliminación
      }
    }

    let uploadResult: any;
    let useLocalStorage = false;

    try {
      // Intentar subir archivo al microservicio primero
      console.log('🌐 [CLINICA_LOGO] Intentando subir al microservicio...');
      console.log('🌐 [CLINICA_LOGO] UserToken disponible:', !!userToken);
      console.log('🌐 [CLINICA_LOGO] UserToken length:', userToken?.length);
      
      // Decodificar el token del usuario para obtener su email
      let userEmail = 'temp-user@example.com';
      if (userToken) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.decode(userToken);
          if (decoded && decoded.email) {
            userEmail = decoded.email;
            console.log('👤 [CLINICA_LOGO] Email del usuario obtenido:', userEmail);
          }
        } catch (error) {
          console.log('⚠️ [CLINICA_LOGO] Error decodificando token:', error.message);
        }
      }
      
      // Intentar registrar el usuario en el microservicio
      const userData = {
        name: userEmail.split('@')[0] || 'user',
        email: userEmail,
        password: 'default-password-123456' // Mínimo 8 caracteres
      };
      
      console.log('👤 [CLINICA_LOGO] Registrando usuario en microservicio:', userData.email);
      const registerResult = await this.fileMicroserviceService.registerUser(userData);
      
      if ('error' in registerResult) {
        if (registerResult.statusCode === 409) {
          console.log('✅ [CLINICA_LOGO] Usuario ya existe en microservicio');
        } else {
          console.log('⚠️ [CLINICA_LOGO] Error registrando usuario:', registerResult.error);
        }
      } else {
        console.log('✅ [CLINICA_LOGO] Usuario registrado exitosamente en microservicio');
      }
      
      const scope = this.fileMicroserviceService.generateScope(clinica.id, 'logo', 'imagenes');
      console.log('🌐 [CLINICA_LOGO] Scope generado:', scope);
      
      const microserviceResult = await this.fileMicroserviceService.uploadFile({
        file,
        visibility: 'public', // Los logos son públicos
        scope,
        conversationId: clinica.id, // Usar el ID de la clínica como conversation_id
        messageId: `logo-${Date.now()}` // Generar un message_id único
      }, userToken);
      
      console.log('🌐 [CLINICA_LOGO] Resultado del microservicio:', microserviceResult);
      
      // Verificar si el resultado es un error
      if ('error' in microserviceResult) {
        console.error('❌ [CLINICA_LOGO] Error del microservicio:', microserviceResult.error);
        throw new Error(microserviceResult.error);
      }
      
      uploadResult = microserviceResult;
      console.log('✅ [CLINICA_LOGO] Logo subido exitosamente al microservicio');
    } catch (error) {
      console.log('⚠️ [CLINICA_LOGO] Microservicio no disponible, usando almacenamiento local:', error.message);
      console.error('❌ [CLINICA_LOGO] Error completo:', error);
      useLocalStorage = true;
      
      // Usar almacenamiento local como respaldo
      const localUploadResult = await this.storageService.uploadFile(
        file,
        clinica.id,
        'logo', // Usar "logo" como identificador en lugar de pacienteId
        'imagenes' // Tipo: imagenes
      );
      
      uploadResult = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: await this.storageService.getFileUrl(localUploadResult.url, userToken),
        nombre: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      };
      
      console.log('✅ [CLINICA_LOGO] Logo guardado localmente como fallback');
    }

    // Actualizar campo logo en la base de datos
    const clinicaActualizada = await this.prisma.clinica.update({
      where: { id: clinica.id },
      data: {
        logo: uploadResult.url, // URL del microservicio (S3) o URL relativa local
        updatedAt: new Date()
      }
    });

    console.log('✅ [CLINICA_LOGO] Logo actualizado en BD:', clinicaActualizada.logo);
    console.log('✅ [CLINICA_LOGO] Usando:', useLocalStorage ? 'Almacenamiento Local' : 'Microservicio (S3)');

    return {
      id: uploadResult.id.toString(),
      nombre: uploadResult.nombre,
      url: uploadResult.url,
      fechaSubida: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Actualizar logo de una clínica (alias de uploadLogo)
   */
  async updateLogo(
    clinicaUrl: string,
    file: Express.Multer.File,
    userToken?: string
  ): Promise<ClinicaLogoDto> {
    console.log('🔄 [CLINICA_LOGO] Actualizando logo (usando uploadLogo)');
    return this.uploadLogo(clinicaUrl, file, userToken);
  }

  /**
   * Eliminar logo de una clínica
   */
  async deleteLogo(clinicaUrl: string): Promise<{ success: boolean; message: string }> {
    console.log('🗑️ [CLINICA_LOGO] Iniciando eliminación de logo');
    console.log('🗑️ [CLINICA_LOGO] Clínica URL:', clinicaUrl);

    // Verificar que la clínica existe
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    if (!clinica.logo) {
      throw new NotFoundException('La clínica no tiene logo');
    }

    // Eliminar archivo del almacenamiento
    try {
      await this.storageService.deleteFile(clinica.logo);
      console.log('✅ [CLINICA_LOGO] Archivo eliminado del almacenamiento');
    } catch (error) {
      console.warn('⚠️ [CLINICA_LOGO] Error eliminando archivo:', error);
      // Continuar con la actualización en BD aunque falle la eliminación del archivo
    }

    // Actualizar campo logo a null en la base de datos
    await this.prisma.clinica.update({
      where: { id: clinica.id },
      data: {
        logo: null,
        updatedAt: new Date()
      }
    });

    console.log('✅ [CLINICA_LOGO] Logo eliminado de BD');

    return {
      success: true,
      message: 'Logo eliminado correctamente'
    };
  }

  /**
   * Obtener URL del logo de una clínica
   */
  async getLogo(clinicaUrl: string, userToken?: string): Promise<{ url: string | null }> {
    console.log('📷 [CLINICA_LOGO] Obteniendo logo');
    console.log('📷 [CLINICA_LOGO] Clínica URL:', clinicaUrl);

    // Verificar que la clínica existe
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl },
      select: {
        id: true,
        name: true,
        logo: true
      }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    if (!clinica.logo) {
      console.log('ℹ️ [CLINICA_LOGO] La clínica no tiene logo');
      return { url: null };
    }

    // Si la URL ya es completa, retornarla directamente
    if (clinica.logo.startsWith('http://') || clinica.logo.startsWith('https://')) {
      console.log('✅ [CLINICA_LOGO] URL completa encontrada:', clinica.logo);
      return { url: clinica.logo };
    }

    // Si es una URL relativa, construir URL completa
    const fullUrl = await this.storageService.getFileUrl(clinica.logo, userToken);
    console.log('✅ [CLINICA_LOGO] URL construida:', fullUrl);

    return { url: fullUrl };
  }
}

