import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './services/storage.service';
import { FileMicroserviceService } from './services/file-microservice.service';
import { FichaMedicaDto, FichaMedicaResponseDto, ArchivoMedicoDto, ImagenMedicaDto, CarpetaArchivoDto, CrearCarpetaDto, ActualizarCarpetaDto } from './dto/ficha-medica.dto';

@Injectable()
export class FichasMedicasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly fileMicroserviceService: FileMicroserviceService,
  ) {}

  async registerMicroserviceUser(userData: { name: string; email: string; password: string }): Promise<{ success: boolean; userId?: string } | { error: string; statusCode: number }> {
    console.log('👤 [REGISTER] Registrando usuario en microservicio:', userData.email);
    return this.fileMicroserviceService.registerUser(userData);
  }

  async getFichaMedica(clinicaUrl: string, pacienteId: string, userToken?: string): Promise<FichaMedicaResponseDto> {
    // Verificar que la clínica existe
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Verificar que el paciente existe y pertenece a la clínica
    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id: pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Obtener ficha médica
    const fichaMedica = await this.prisma.fichaMedica.findFirst({
      where: { pacienteId },
      include: {
        archivosMedicos: {
          orderBy: { fechaSubida: 'desc' }
        },
        imagenesMedicas: {
          orderBy: { fechaSubida: 'desc' }
        },
        carpetasArchivos: {
          orderBy: [
            { tipo: 'asc' },
            { orden: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    // Si no existe, crear una vacía
    if (!fichaMedica) {
      const nuevaFicha = await this.prisma.fichaMedica.create({
        data: {
          pacienteId,
          clinicaId: clinica.id,
        },
        include: {
          archivosMedicos: true,
          imagenesMedicas: true,
          carpetasArchivos: true
        }
      });

      return {
        id: nuevaFicha.id,
        grupoSanguineo: undefined,
        alergias: undefined,
        medicamentosActuales: undefined,
        antecedentesPatologicos: undefined,
        antecedentesQuirurgicos: undefined,
        antecedentesFamiliares: undefined,
        habitos: undefined,
        ocupacion: undefined,
        motivoConsulta: undefined,
        sintomas: undefined,
        diagnostico: undefined,
        tratamiento: undefined,
        evolucion: undefined,
        archivos: [],
        imagenes: [],
        carpetasArchivos: [],
        carpetasImagenes: []
      };
    }

    // Transformar datos para el frontend
    const response: FichaMedicaResponseDto = {
      id: fichaMedica.id,
      grupoSanguineo: fichaMedica.grupoSanguineo || undefined,
      alergias: fichaMedica.alergias || undefined,
      medicamentosActuales: fichaMedica.medicamentosActuales || undefined,
      antecedentesPatologicos: fichaMedica.antecedentesPatologicos || undefined,
      antecedentesQuirurgicos: fichaMedica.antecedentesQuirurgicos || undefined,
      antecedentesFamiliares: fichaMedica.antecedentesFamiliares || undefined,
      habitos: fichaMedica.habitos || undefined,
      ocupacion: fichaMedica.ocupacion || undefined,
      motivoConsulta: fichaMedica.motivoConsulta || undefined,
      sintomas: fichaMedica.sintomas || undefined,
      diagnostico: fichaMedica.diagnostico || undefined,
      tratamiento: fichaMedica.tratamiento || undefined,
      evolucion: fichaMedica.evolucion || undefined,
      archivos: await Promise.all(fichaMedica.archivosMedicos.map(async archivo => ({
        id: archivo.id,
        nombre: archivo.nombre,
        tipo: archivo.tipo,
        url: await this.storageService.getFileUrl(archivo.url, userToken, archivo.microserviceFileId || undefined),
        fecha: archivo.fechaSubida.toISOString().split('T')[0],
        carpetaId: archivo.carpetaId || undefined
      }))),
      imagenes: await Promise.all(fichaMedica.imagenesMedicas.map(async imagen => ({
        id: imagen.id,
        nombre: imagen.nombre,
        url: await this.storageService.getFileUrl(imagen.url, userToken, imagen.microserviceFileId || undefined),
        fecha: imagen.fechaSubida.toISOString().split('T')[0],
        descripcion: imagen.descripcion || undefined,
        carpetaId: imagen.carpetaId || undefined
      }))),
      carpetasArchivos: fichaMedica.carpetasArchivos
        .filter(carpeta => carpeta.tipo === 'archivos')
        .map(carpeta => ({
          id: carpeta.id,
          nombre: carpeta.nombre,
          descripcion: carpeta.descripcion || undefined,
          tipo: carpeta.tipo as 'archivos' | 'imagenes',
          orden: carpeta.orden,
          fechaCreacion: carpeta.createdAt.toISOString().split('T')[0],
          archivos: [],
          imagenes: []
        })),
      carpetasImagenes: fichaMedica.carpetasArchivos
        .filter(carpeta => carpeta.tipo === 'imagenes')
        .map(carpeta => ({
          id: carpeta.id,
          nombre: carpeta.nombre,
          descripcion: carpeta.descripcion || undefined,
          tipo: carpeta.tipo as 'archivos' | 'imagenes',
          orden: carpeta.orden,
          fechaCreacion: carpeta.createdAt.toISOString().split('T')[0],
          archivos: [],
          imagenes: []
        }))
    };

    return response;
  }

  async saveFichaMedica(clinicaUrl: string, pacienteId: string, fichaData: FichaMedicaDto): Promise<{ success: boolean; message: string; fichaId: string }> {
    // Verificar que la clínica existe
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Verificar que el paciente existe y pertenece a la clínica
    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id: pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Actualizar o crear ficha médica
    const fichaMedica = await this.prisma.fichaMedica.upsert({
      where: { pacienteId },
      update: {
        grupoSanguineo: fichaData.grupoSanguineo,
        alergias: fichaData.alergias,
        medicamentosActuales: fichaData.medicamentosActuales,
        antecedentesPatologicos: fichaData.antecedentesPatologicos,
        antecedentesQuirurgicos: fichaData.antecedentesQuirurgicos,
        antecedentesFamiliares: fichaData.antecedentesFamiliares,
        habitos: fichaData.habitos,
        ocupacion: fichaData.ocupacion,
        motivoConsulta: fichaData.motivoConsulta,
        sintomas: fichaData.sintomas,
        diagnostico: fichaData.diagnostico,
        tratamiento: fichaData.tratamiento,
        evolucion: fichaData.evolucion,
        updatedAt: new Date()
      },
      create: {
        pacienteId,
        clinicaId: clinica.id,
        grupoSanguineo: fichaData.grupoSanguineo,
        alergias: fichaData.alergias,
        medicamentosActuales: fichaData.medicamentosActuales,
        antecedentesPatologicos: fichaData.antecedentesPatologicos,
        antecedentesQuirurgicos: fichaData.antecedentesQuirurgicos,
        antecedentesFamiliares: fichaData.antecedentesFamiliares,
        habitos: fichaData.habitos,
        ocupacion: fichaData.ocupacion,
        motivoConsulta: fichaData.motivoConsulta,
        sintomas: fichaData.sintomas,
        diagnostico: fichaData.diagnostico,
        tratamiento: fichaData.tratamiento,
        evolucion: fichaData.evolucion
      }
    });

    return { 
      success: true, 
      message: 'Ficha médica guardada correctamente',
      fichaId: fichaMedica.id
    };
  }

  async uploadFile(clinicaUrl: string, pacienteId: string, file: Express.Multer.File, userToken?: string, carpetaId?: string): Promise<ArchivoMedicoDto> {
    console.log('🔍 DEBUG: uploadFile service - userToken recibido:', userToken ? 'SÍ' : 'NO');
    console.log('🔍 DEBUG: uploadFile service - userToken length:', userToken?.length || 0);
    console.log('🔍 DEBUG: uploadFile service - carpetaId recibido:', carpetaId || 'NO');
    
    // Verificar que la clínica y paciente existen
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id: pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!this.fileMicroserviceService.validateFileType(file, allowedTypes)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }

    // Validar tamaño del archivo (10MB máximo)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (!this.fileMicroserviceService.validateFileSize(file, maxSizeBytes)) {
      throw new BadRequestException('El archivo es demasiado grande. Máximo 10MB');
    }

    // Obtener o crear ficha médica
    let fichaMedica = await this.prisma.fichaMedica.findFirst({
      where: { pacienteId }
    });

    if (!fichaMedica) {
      fichaMedica = await this.prisma.fichaMedica.create({
        data: {
          pacienteId,
          clinicaId: clinica.id
        }
      });
    }

    // Si se especifica una carpeta, verificar que existe y es del tipo correcto
    if (carpetaId) {
      const carpeta = await this.prisma.carpetaArchivo.findFirst({
        where: { 
          id: carpetaId,
          fichaMedicaId: fichaMedica.id,
          tipo: 'archivos'
        }
      });

      if (!carpeta) {
        throw new NotFoundException('Carpeta no encontrada o no es válida para archivos');
      }
    }

    let uploadResult: any;
    let useLocalStorage = false;

    // Verificar si el microservicio está disponible antes de intentar usarlo
    console.log('🔍 [UPLOAD] Verificando disponibilidad del microservicio...');
    const microserviceHealth = await this.fileMicroserviceService.checkHealth();
    
    if (!microserviceHealth.available) {
      console.log('⚠️ [UPLOAD] Microservicio no disponible, usando almacenamiento local directamente');
      console.log('⚠️ [UPLOAD] Error del microservicio:', microserviceHealth.error);
      useLocalStorage = true;
    } else {
      console.log('✅ [UPLOAD] Microservicio disponible, intentando subir...');
    }

    // Intentar usar el microservicio solo si está disponible
    if (!useLocalStorage) {
      try {
        // Intentar subir archivo al microservicio primero
        console.log('🌐 [UPLOAD] Intentando subir al microservicio...');
        console.log('🌐 [UPLOAD] UserToken disponible:', !!userToken);
        console.log('🌐 [UPLOAD] UserToken length:', userToken?.length);
      
      // Registrar usuario en el microservicio si es necesario
      console.log('👤 [UPLOAD] Verificando registro de usuario en microservicio...');
      
      // Decodificar el token del usuario para obtener su email
      let userEmail = 'temp-user@example.com';
      if (userToken) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.decode(userToken);
          if (decoded && decoded.email) {
            userEmail = decoded.email;
            console.log('👤 [UPLOAD] Email del usuario obtenido:', userEmail);
          }
        } catch (error) {
          console.log('⚠️ [UPLOAD] Error decodificando token:', error.message);
        }
      }
      
      // Intentar registrar el usuario en el microservicio
      const userData = {
        name: userEmail.split('@')[0] || 'user',
        email: userEmail,
        password: 'default-password-123456' // Mínimo 8 caracteres
      };
      
      console.log('👤 [UPLOAD] Registrando usuario en microservicio:', userData.email);
      const registerResult = await this.fileMicroserviceService.registerUser(userData);
      let microserviceToken = userToken; // Usar el token del frontend por defecto
      
      if ('error' in registerResult) {
        if (registerResult.statusCode === 409) {
          console.log('✅ [UPLOAD] Usuario ya existe en microservicio');
        } else {
          console.log('⚠️ [UPLOAD] Error registrando usuario:', registerResult.error);
        }
      } else {
        console.log('✅ [UPLOAD] Usuario registrado exitosamente en microservicio');
        // Si el usuario se registró exitosamente, usar el token del microservicio
        if (registerResult.userId) {
          console.log('🔑 [UPLOAD] Usando token del microservicio para el usuario registrado');
          // Por ahora, seguimos usando el token del frontend
          // En el futuro, podríamos almacenar el token del microservicio
        }
      }
      
      const scope = this.fileMicroserviceService.generateScope(clinica.id, pacienteId, 'archivos');
      console.log('🌐 [UPLOAD] Scope generado:', scope);
      const microserviceResult = await this.fileMicroserviceService.uploadFile({
        file,
        visibility: 'private', // Los archivos médicos son privados
        scope,
        conversationId: fichaMedica.id, // Usar el ID de la ficha como conversation_id
        messageId: `archivo-${Date.now()}` // Generar un message_id único
      }, microserviceToken);
      
      console.log('🌐 [UPLOAD] Resultado del microservicio:', microserviceResult);
      
      // Verificar si el resultado es un error
      if ('error' in microserviceResult) {
        console.error('❌ [UPLOAD] Error del microservicio:', microserviceResult.error);
        throw new Error(microserviceResult.error);
      }
      
      uploadResult = microserviceResult;
        console.log('✅ Archivo subido exitosamente al microservicio');
      } catch (error) {
        console.log('⚠️ Microservicio no disponible, usando almacenamiento local:', error.message);
        console.error('❌ [UPLOAD] Error completo:', error);
        useLocalStorage = true;
      }
    }

    // Si necesitamos usar almacenamiento local (ya sea por fallo del microservicio o por decisión inicial)
    if (useLocalStorage) {
      console.log('💾 [UPLOAD] Usando almacenamiento local...');
      
      // Usar almacenamiento local como respaldo
      const localUploadResult = await this.storageService.uploadFile(file, clinica.id, pacienteId, 'archivos');
      
      uploadResult = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: await this.storageService.getFileUrl(localUploadResult.url, userToken),
        nombre: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      };
      
      console.log('✅ [UPLOAD] Archivo guardado en almacenamiento local');
    }

    // Guardar en base de datos
    const archivoMedico = await this.prisma.archivoMedico.create({
      data: {
        fichaMedicaId: fichaMedica.id,
        carpetaId: carpetaId || null,
        nombre: uploadResult.nombre,
        nombreArchivo: uploadResult.nombre,
        tipo: file.mimetype.includes('pdf') ? 'pdf' : 'doc',
        url: uploadResult.url, // URL de S3 o ruta local
        tamañoBytes: BigInt(uploadResult.size),
        microserviceFileId: uploadResult.id.toString() // ID del archivo en el microservicio
      }
    });

    return {
      id: archivoMedico.id,
      nombre: archivoMedico.nombre,
      tipo: archivoMedico.tipo,
      url: uploadResult.url,
      fecha: archivoMedico.fechaSubida.toISOString().split('T')[0],
      carpetaId: archivoMedico.carpetaId || undefined
    };
  }

  async uploadImage(clinicaUrl: string, pacienteId: string, file: Express.Multer.File, userToken?: string, carpetaId?: string): Promise<ImagenMedicaDto> {
    console.log('🖼️ [UPLOAD_IMAGE] Iniciando proceso de subida de imagen');
    console.log('🖼️ [UPLOAD_IMAGE] Parámetros recibidos:', {
      clinicaUrl,
      pacienteId,
      fileName: file?.originalname,
      fileSize: file?.size,
      mimeType: file?.mimetype,
      hasUserToken: !!userToken,
      userTokenLength: userToken?.length || 0,
      carpetaId: carpetaId || 'NO'
    });
    
    // Verificar que la clínica y paciente existen
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id: pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Validar tipo de imagen
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!this.fileMicroserviceService.validateFileType(file, allowedImageTypes)) {
      throw new BadRequestException('El archivo debe ser una imagen válida (JPEG, PNG, GIF, WebP)');
    }

    // Validar tamaño del archivo (10MB máximo)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (!this.fileMicroserviceService.validateFileSize(file, maxSizeBytes)) {
      throw new BadRequestException('La imagen es demasiado grande. Máximo 10MB');
    }

    // Obtener o crear ficha médica
    let fichaMedica = await this.prisma.fichaMedica.findFirst({
      where: { pacienteId }
    });

    if (!fichaMedica) {
      fichaMedica = await this.prisma.fichaMedica.create({
        data: {
          pacienteId,
          clinicaId: clinica.id
        }
      });
    }

    // Si se especifica una carpeta, verificar que existe y es del tipo correcto
    if (carpetaId) {
      const carpeta = await this.prisma.carpetaArchivo.findFirst({
        where: { 
          id: carpetaId,
          fichaMedicaId: fichaMedica.id,
          tipo: 'imagenes'
        }
      });

      if (!carpeta) {
        throw new NotFoundException('Carpeta no encontrada o no es válida para imágenes');
      }
    }

    let uploadResult: any;
    let useLocalStorage = true; // Forzar uso de almacenamiento local

    // Usar almacenamiento local directamente para evitar problemas con microservicio
    console.log('🖼️ [UPLOAD_IMAGE] Usando almacenamiento local para imagen médica');
    
    try {
      const localUploadResult = await this.storageService.uploadFile(file, clinica.id, pacienteId, 'imagenes');
      
      uploadResult = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: await this.storageService.getFileUrl(localUploadResult.url, userToken),
        nombre: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      };
      
      console.log('✅ [UPLOAD_IMAGE] Imagen guardada localmente:', {
        id: uploadResult.id,
        url: uploadResult.url,
        nombre: uploadResult.nombre,
        size: uploadResult.size
      });
    } catch (error) {
      console.error('❌ [UPLOAD_IMAGE] Error guardando imagen localmente:', error);
      throw new Error('Error al guardar la imagen');
    }

    // Guardar en base de datos
    const imagenMedica = await this.prisma.imagenMedica.create({
      data: {
        fichaMedicaId: fichaMedica.id,
        carpetaId: carpetaId || null,
        nombre: uploadResult.nombre,
        nombreArchivo: uploadResult.nombre,
        url: uploadResult.url, // URL completa generada por getFileUrl
        tamañoBytes: BigInt(uploadResult.size),
        // microserviceFileId: null // Usando almacenamiento local
      }
    });

    return {
      id: imagenMedica.id,
      nombre: imagenMedica.nombre,
      url: uploadResult.url,
      fecha: imagenMedica.fechaSubida.toISOString().split('T')[0],
      descripcion: imagenMedica.descripcion || undefined,
      carpetaId: imagenMedica.carpetaId || undefined
    };
  }

  async deleteFile(clinicaUrl: string, pacienteId: string, fileId: string): Promise<{ success: boolean; message: string }> {
    // Verificar que la clínica y paciente existen
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id: pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Obtener archivo
    const archivo = await this.prisma.archivoMedico.findFirst({
      where: { 
        id: fileId,
        fichaMedica: {
          pacienteId
        }
      }
    });

    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }

    // Eliminar del microservicio si tiene microserviceFileId
    // if (archivo.microserviceFileId) {  // Temporalmente comentado hasta migración
    if (false) {
      try {
        // await this.fileMicroserviceService.deleteFile(archivo.microserviceFileId);  // Temporalmente comentado
      } catch (error) {
        console.warn('Error eliminando archivo del microservicio:', error);
        // Continuar con la eliminación de la base de datos aunque falle el microservicio
      }
    } else {
      // Fallback: eliminar del almacenamiento local si no tiene microserviceFileId
      await this.storageService.deleteFile(archivo.url);
    }

    // Eliminar de base de datos
    await this.prisma.archivoMedico.delete({
      where: { id: fileId }
    });

    return { 
      success: true, 
      message: 'Archivo eliminado correctamente' 
    };
  }

  async deleteImage(clinicaUrl: string, pacienteId: string, imageId: string): Promise<{ success: boolean; message: string }> {
    // Verificar que la clínica y paciente existen
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id: pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Obtener imagen
    const imagen = await this.prisma.imagenMedica.findFirst({
      where: { 
        id: imageId,
        fichaMedica: {
          pacienteId
        }
      }
    });

    if (!imagen) {
      throw new NotFoundException('Imagen no encontrada');
    }

    // Eliminar del microservicio si tiene microserviceFileId
    // if (imagen.microserviceFileId) {  // Temporalmente comentado hasta migración
    if (false) {
      try {
        // await this.fileMicroserviceService.deleteFile(imagen.microserviceFileId);  // Temporalmente comentado
      } catch (error) {
        console.warn('Error eliminando imagen del microservicio:', error);
        // Continuar con la eliminación de la base de datos aunque falle el microservicio
      }
    } else {
      // Fallback: eliminar del almacenamiento local si no tiene microserviceFileId
      await this.storageService.deleteFile(imagen.url);
    }

    // Eliminar de base de datos
    await this.prisma.imagenMedica.delete({
      where: { id: imageId }
    });

    return { 
      success: true, 
      message: 'Imagen eliminada correctamente' 
    };
  }

  async getSignedUrl(clinicaUrl: string, pacienteId: string, fileId: string, userToken?: string): Promise<{ url: string } | { error: string; statusCode: number }> {
    console.log('🔗 [SIGNED_URL_SERVICE] Iniciando obtención de URL firmada');
    console.log('🔗 [SIGNED_URL_SERVICE] Parámetros recibidos:', {
      clinicaUrl,
      pacienteId,
      fileId,
      hasUserToken: !!userToken,
      userTokenLength: userToken?.length || 0
    });

    // Verificar que la clínica y paciente existen
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      console.error('❌ [SIGNED_URL_SERVICE] Clínica no encontrada:', clinicaUrl);
      throw new NotFoundException('Clínica no encontrada');
    }

    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id: pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!paciente) {
      console.error('❌ [SIGNED_URL_SERVICE] Paciente no encontrado:', { pacienteId, clinicaId: clinica.id });
      throw new NotFoundException('Paciente no encontrado');
    }

    // Obtener archivo de la base de datos
    const archivo = await this.prisma.archivoMedico.findFirst({
      where: { 
        id: fileId,
        fichaMedica: {
          pacienteId
        }
      }
    });

    if (!archivo) {
      console.error('❌ [SIGNED_URL_SERVICE] Archivo no encontrado en BD:', { fileId, pacienteId });
      throw new NotFoundException('Archivo no encontrado');
    }

    console.log('📋 [SIGNED_URL_SERVICE] Archivo encontrado en BD:', {
      id: archivo.id,
      nombre: archivo.nombre,
      // microserviceFileId: archivo.microserviceFileId,  // Temporalmente comentado hasta migración
      url: archivo.url
    });

    // Si el archivo tiene microserviceFileId, obtener URL firmada del microservicio
    // if (archivo.microserviceFileId) {  // Temporalmente comentado hasta migración
    if (false) {
      console.log('🌐 [SIGNED_URL_SERVICE] Archivo está en microservicio, obteniendo URL firmada...');
      
      try {
        // const result = await this.fileMicroserviceService.getSignedUrl(archivo.microserviceFileId, userToken);  // Temporalmente comentado
        // TODO: Descomentar cuando se agregue microserviceFileId a la BD
        
        // if ('error' in result) {
        //   console.error('❌ [SIGNED_URL_SERVICE] Error obteniendo URL firmada del microservicio:', result);
        //   return result;
        // }
        
        // console.log('✅ [SIGNED_URL_SERVICE] URL firmada obtenida del microservicio:', result.url);
        // return result;
        
      } catch (error) {
        console.error('❌ [SIGNED_URL_SERVICE] Error inesperado obteniendo URL firmada:', error);
        return { error: 'Error obteniendo URL firmada del microservicio', statusCode: 500 };
      }
    } else {
      // Si no tiene microserviceFileId, es un archivo local (siempre será local por ahora)
      console.log('📁 [SIGNED_URL_SERVICE] Archivo es local, retornando URL directa');
      return { url: archivo.url };
    }
  }

  // ===== MÉTODOS PARA GESTIÓN DE CARPETAS =====

  async crearCarpeta(clinicaUrl: string, pacienteId: string, crearCarpetaDto: CrearCarpetaDto): Promise<CarpetaArchivoDto> {
    console.log('📁 [CREAR_CARPETA] Iniciando creación de carpeta');
    console.log('📁 [CREAR_CARPETA] Parámetros:', { clinicaUrl, pacienteId, crearCarpetaDto });

    // Verificar que la clínica existe
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Verificar que el paciente existe y pertenece a la clínica
    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id: pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Obtener o crear ficha médica
    let fichaMedica = await this.prisma.fichaMedica.findFirst({
      where: { pacienteId }
    });

    if (!fichaMedica) {
      fichaMedica = await this.prisma.fichaMedica.create({
        data: {
          pacienteId,
          clinicaId: clinica.id
        }
      });
    }

    // Verificar que no existe una carpeta con el mismo nombre y tipo
    const carpetaExistente = await this.prisma.carpetaArchivo.findFirst({
      where: {
        fichaMedicaId: fichaMedica.id,
        nombre: crearCarpetaDto.nombre,
        tipo: crearCarpetaDto.tipo
      }
    });

    if (carpetaExistente) {
      throw new BadRequestException(`Ya existe una carpeta con el nombre "${crearCarpetaDto.nombre}" para ${crearCarpetaDto.tipo}`);
    }

    // Obtener el siguiente orden
    const ultimaCarpeta = await this.prisma.carpetaArchivo.findFirst({
      where: {
        fichaMedicaId: fichaMedica.id,
        tipo: crearCarpetaDto.tipo
      },
      orderBy: { orden: 'desc' }
    });

    const orden = crearCarpetaDto.orden ?? (ultimaCarpeta?.orden ?? 0) + 1;

    // Crear la carpeta
    const carpeta = await this.prisma.carpetaArchivo.create({
      data: {
        fichaMedicaId: fichaMedica.id,
        nombre: crearCarpetaDto.nombre,
        descripcion: crearCarpetaDto.descripcion,
        tipo: crearCarpetaDto.tipo,
        orden
      }
    });

    console.log('✅ [CREAR_CARPETA] Carpeta creada exitosamente:', carpeta.id);

    return {
      id: carpeta.id,
      nombre: carpeta.nombre,
      descripcion: carpeta.descripcion || undefined,
      tipo: carpeta.tipo as 'archivos' | 'imagenes',
      orden: carpeta.orden,
      fechaCreacion: carpeta.createdAt.toISOString().split('T')[0],
      archivos: [],
      imagenes: []
    };
  }

  async obtenerCarpetas(clinicaUrl: string, pacienteId: string): Promise<CarpetaArchivoDto[]> {
    console.log('📁 [OBTENER_CARPETAS] Obteniendo carpetas de la ficha médica');
    console.log('📁 [OBTENER_CARPETAS] Parámetros:', { clinicaUrl, pacienteId });

    // Verificar que la clínica existe
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Verificar que el paciente existe y pertenece a la clínica
    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id: pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Obtener ficha médica
    const fichaMedica = await this.prisma.fichaMedica.findFirst({
      where: { pacienteId }
    });

    if (!fichaMedica) {
      return []; // No hay ficha médica, por lo tanto no hay carpetas
    }

    // Obtener todas las carpetas ordenadas
    const carpetas = await this.prisma.carpetaArchivo.findMany({
      where: { fichaMedicaId: fichaMedica.id },
      orderBy: [
        { tipo: 'asc' },
        { orden: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    console.log('✅ [OBTENER_CARPETAS] Carpetas obtenidas:', carpetas.length);

    return carpetas.map(carpeta => ({
      id: carpeta.id,
      nombre: carpeta.nombre,
      descripcion: carpeta.descripcion || undefined,
      tipo: carpeta.tipo as 'archivos' | 'imagenes',
      orden: carpeta.orden,
      fechaCreacion: carpeta.createdAt.toISOString().split('T')[0],
      archivos: [],
      imagenes: []
    }));
  }

  async obtenerCarpeta(clinicaUrl: string, pacienteId: string, carpetaId: string): Promise<CarpetaArchivoDto> {
    console.log('📁 [OBTENER_CARPETA] Obteniendo carpeta específica');
    console.log('📁 [OBTENER_CARPETA] Parámetros:', { clinicaUrl, pacienteId, carpetaId });

    // Verificar que la clínica existe
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Verificar que el paciente existe y pertenece a la clínica
    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id: pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Obtener la carpeta con sus archivos/imágenes
    const carpeta = await this.prisma.carpetaArchivo.findFirst({
      where: { 
        id: carpetaId,
        fichaMedica: {
          pacienteId
        }
      },
      include: {
        archivos: {
          orderBy: { fechaSubida: 'desc' }
        },
        // Note: Las imágenes no están incluidas en la relación actual
        // Necesitaríamos modificar el modelo para incluir imágenes en carpetas
      }
    });

    if (!carpeta) {
      throw new NotFoundException('Carpeta no encontrada');
    }

    console.log('✅ [OBTENER_CARPETA] Carpeta obtenida:', carpeta.id);

    // Obtener imágenes de la carpeta (si las hay)
    const imagenes = await this.prisma.imagenMedica.findMany({
      where: { 
        carpetaId: carpetaId,
        fichaMedica: {
          pacienteId
        }
      },
      orderBy: { fechaSubida: 'desc' }
    });

    return {
      id: carpeta.id,
      nombre: carpeta.nombre,
      descripcion: carpeta.descripcion || undefined,
      tipo: carpeta.tipo as 'archivos' | 'imagenes',
      orden: carpeta.orden,
      fechaCreacion: carpeta.createdAt.toISOString().split('T')[0],
      archivos: carpeta.archivos.map(archivo => ({
        id: archivo.id,
        nombre: archivo.nombre,
        tipo: archivo.tipo,
        url: archivo.url,
        fecha: archivo.fechaSubida.toISOString().split('T')[0],
        carpetaId: archivo.carpetaId || undefined
      })),
      imagenes: imagenes.map(imagen => ({
        id: imagen.id,
        nombre: imagen.nombre,
        url: imagen.url,
        fecha: imagen.fechaSubida.toISOString().split('T')[0],
        descripcion: imagen.descripcion || undefined,
        carpetaId: imagen.carpetaId || undefined
      }))
    };
  }

  async actualizarCarpeta(clinicaUrl: string, pacienteId: string, carpetaId: string, actualizarCarpetaDto: ActualizarCarpetaDto): Promise<CarpetaArchivoDto> {
    console.log('📁 [ACTUALIZAR_CARPETA] Actualizando carpeta');
    console.log('📁 [ACTUALIZAR_CARPETA] Parámetros:', { clinicaUrl, pacienteId, carpetaId, actualizarCarpetaDto });

    // Verificar que la clínica existe
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Verificar que el paciente existe y pertenece a la clínica
    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id: pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Verificar que la carpeta existe
    const carpetaExistente = await this.prisma.carpetaArchivo.findFirst({
      where: { 
        id: carpetaId,
        fichaMedica: {
          pacienteId
        }
      }
    });

    if (!carpetaExistente) {
      throw new NotFoundException('Carpeta no encontrada');
    }

    // Si se está cambiando el nombre, verificar que no exista otra carpeta con el mismo nombre
    if (actualizarCarpetaDto.nombre && actualizarCarpetaDto.nombre !== carpetaExistente.nombre) {
      const carpetaConMismoNombre = await this.prisma.carpetaArchivo.findFirst({
        where: {
          fichaMedicaId: carpetaExistente.fichaMedicaId,
          nombre: actualizarCarpetaDto.nombre,
          tipo: carpetaExistente.tipo,
          id: { not: carpetaId }
        }
      });

      if (carpetaConMismoNombre) {
        throw new BadRequestException(`Ya existe una carpeta con el nombre "${actualizarCarpetaDto.nombre}" para ${carpetaExistente.tipo}`);
      }
    }

    // Actualizar la carpeta
    const carpetaActualizada = await this.prisma.carpetaArchivo.update({
      where: { id: carpetaId },
      data: {
        nombre: actualizarCarpetaDto.nombre,
        descripcion: actualizarCarpetaDto.descripcion,
        orden: actualizarCarpetaDto.orden,
        updatedAt: new Date()
      }
    });

    console.log('✅ [ACTUALIZAR_CARPETA] Carpeta actualizada:', carpetaActualizada.id);

    return {
      id: carpetaActualizada.id,
      nombre: carpetaActualizada.nombre,
      descripcion: carpetaActualizada.descripcion || undefined,
      tipo: carpetaActualizada.tipo as 'archivos' | 'imagenes',
      orden: carpetaActualizada.orden,
      fechaCreacion: carpetaActualizada.createdAt.toISOString().split('T')[0],
      archivos: [],
      imagenes: []
    };
  }

  async eliminarCarpeta(clinicaUrl: string, pacienteId: string, carpetaId: string): Promise<{ success: boolean; message: string }> {
    console.log('📁 [ELIMINAR_CARPETA] Eliminando carpeta');
    console.log('📁 [ELIMINAR_CARPETA] Parámetros:', { clinicaUrl, pacienteId, carpetaId });

    // Verificar que la clínica existe
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Verificar que el paciente existe y pertenece a la clínica
    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id: pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Verificar que la carpeta existe
    const carpeta = await this.prisma.carpetaArchivo.findFirst({
      where: { 
        id: carpetaId,
        fichaMedica: {
          pacienteId
        }
      }
    });

    if (!carpeta) {
      throw new NotFoundException('Carpeta no encontrada');
    }

    // Mover archivos de la carpeta a la raíz (carpetaId = null)
    await this.prisma.archivoMedico.updateMany({
      where: { carpetaId: carpetaId },
      data: { carpetaId: null }
    });

    // Mover imágenes de la carpeta a la raíz (carpetaId = null)
    await this.prisma.imagenMedica.updateMany({
      where: { carpetaId: carpetaId },
      data: { carpetaId: null }
    });

    // Eliminar la carpeta
    await this.prisma.carpetaArchivo.delete({
      where: { id: carpetaId }
    });

    console.log('✅ [ELIMINAR_CARPETA] Carpeta eliminada:', carpetaId);

    return { 
      success: true, 
      message: 'Carpeta eliminada correctamente. Los archivos e imágenes se movieron a la raíz.' 
    };
  }

  // ===== MÉTODO PARA ELIMINAR FICHA MÉDICA COMPLETA =====

  async eliminarFichaMedica(clinicaUrl: string, pacienteId: string): Promise<{ 
    success: boolean; 
    message: string; 
    archivosEliminados: number; 
    imagenesEliminadas: number; 
    carpetasEliminadas: number 
  }> {
    console.log('🗑️ [ELIMINAR_FICHA_MEDICA] Iniciando eliminación completa de ficha médica');
    console.log('🗑️ [ELIMINAR_FICHA_MEDICA] Parámetros:', { clinicaUrl, pacienteId });

    // Verificar que la clínica existe
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Verificar que el paciente existe y pertenece a la clínica
    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id: pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Obtener la ficha médica
    const fichaMedica = await this.prisma.fichaMedica.findFirst({
      where: { pacienteId },
      include: {
        archivosMedicos: true,
        imagenesMedicas: true,
        carpetasArchivos: true
      }
    });

    if (!fichaMedica) {
      throw new NotFoundException('Ficha médica no encontrada');
    }

    console.log('📊 [ELIMINAR_FICHA_MEDICA] Estadísticas de la ficha:', {
      archivos: fichaMedica.archivosMedicos.length,
      imagenes: fichaMedica.imagenesMedicas.length,
      carpetas: fichaMedica.carpetasArchivos.length
    });

    let archivosEliminados = 0;
    let imagenesEliminadas = 0;
    let carpetasEliminadas = 0;

    try {
      // 1. Eliminar archivos físicos y registros de base de datos
      console.log('🗂️ [ELIMINAR_FICHA_MEDICA] Eliminando archivos médicos...');
      for (const archivo of fichaMedica.archivosMedicos) {
        try {
          // Eliminar del microservicio si tiene microserviceFileId
          if (archivo.microserviceFileId) {
            try {
              await this.fileMicroserviceService.deleteFile(archivo.microserviceFileId);
              console.log('🌐 [ELIMINAR_FICHA_MEDICA] Archivo eliminado del microservicio:', archivo.id);
            } catch (error) {
              console.warn('⚠️ [ELIMINAR_FICHA_MEDICA] Error eliminando archivo del microservicio:', error.message);
            }
          } else {
            // Eliminar del almacenamiento local
            try {
              await this.storageService.deleteFile(archivo.url);
              console.log('📁 [ELIMINAR_FICHA_MEDICA] Archivo eliminado del almacenamiento local:', archivo.id);
            } catch (error) {
              console.warn('⚠️ [ELIMINAR_FICHA_MEDICA] Error eliminando archivo local:', error.message);
            }
          }
        } catch (error) {
          console.warn('⚠️ [ELIMINAR_FICHA_MEDICA] Error procesando archivo:', archivo.id, error.message);
        }
        archivosEliminados++;
      }

      // 2. Eliminar imágenes físicas y registros de base de datos
      console.log('🖼️ [ELIMINAR_FICHA_MEDICA] Eliminando imágenes médicas...');
      for (const imagen of fichaMedica.imagenesMedicas) {
        try {
          // Eliminar del microservicio si tiene microserviceFileId
          if (imagen.microserviceFileId) {
            try {
              await this.fileMicroserviceService.deleteFile(imagen.microserviceFileId);
              console.log('🌐 [ELIMINAR_FICHA_MEDICA] Imagen eliminada del microservicio:', imagen.id);
            } catch (error) {
              console.warn('⚠️ [ELIMINAR_FICHA_MEDICA] Error eliminando imagen del microservicio:', error.message);
            }
          } else {
            // Eliminar del almacenamiento local
            try {
              await this.storageService.deleteFile(imagen.url);
              console.log('📁 [ELIMINAR_FICHA_MEDICA] Imagen eliminada del almacenamiento local:', imagen.id);
            } catch (error) {
              console.warn('⚠️ [ELIMINAR_FICHA_MEDICA] Error eliminando imagen local:', error.message);
            }
          }
        } catch (error) {
          console.warn('⚠️ [ELIMINAR_FICHA_MEDICA] Error procesando imagen:', imagen.id, error.message);
        }
        imagenesEliminadas++;
      }

      // 3. Eliminar registros de base de datos (en orden correcto debido a foreign keys)
      console.log('🗃️ [ELIMINAR_FICHA_MEDICA] Eliminando registros de base de datos...');
      
      // Eliminar archivos médicos
      await this.prisma.archivoMedico.deleteMany({
        where: { fichaMedicaId: fichaMedica.id }
      });
      console.log('✅ [ELIMINAR_FICHA_MEDICA] Archivos médicos eliminados de BD');

      // Eliminar imágenes médicas
      await this.prisma.imagenMedica.deleteMany({
        where: { fichaMedicaId: fichaMedica.id }
      });
      console.log('✅ [ELIMINAR_FICHA_MEDICA] Imágenes médicas eliminadas de BD');

      // Eliminar carpetas
      await this.prisma.carpetaArchivo.deleteMany({
        where: { fichaMedicaId: fichaMedica.id }
      });
      carpetasEliminadas = fichaMedica.carpetasArchivos.length;
      console.log('✅ [ELIMINAR_FICHA_MEDICA] Carpetas eliminadas de BD');

      // Eliminar historial de fichas médicas
      await this.prisma.fichaMedicaHistorial.deleteMany({
        where: { fichaMedica: { id: fichaMedica.id } }
      });
      console.log('✅ [ELIMINAR_FICHA_MEDICA] Historial eliminado de BD');

      // Finalmente, eliminar la ficha médica
      await this.prisma.fichaMedica.delete({
        where: { id: fichaMedica.id }
      });
      console.log('✅ [ELIMINAR_FICHA_MEDICA] Ficha médica eliminada de BD');

      console.log('🎉 [ELIMINAR_FICHA_MEDICA] Ficha médica eliminada completamente:', {
        archivosEliminados,
        imagenesEliminadas,
        carpetasEliminadas
      });

      return {
        success: true,
        message: `Ficha médica eliminada completamente. Se eliminaron ${archivosEliminados} archivos, ${imagenesEliminadas} imágenes y ${carpetasEliminadas} carpetas.`,
        archivosEliminados,
        imagenesEliminadas,
        carpetasEliminadas
      };

    } catch (error) {
      console.error('❌ [ELIMINAR_FICHA_MEDICA] Error eliminando ficha médica:', error);
      throw new Error('Error al eliminar la ficha médica. Algunos archivos pueden no haberse eliminado correctamente.');
    }
  }

  async eliminarFichaMedicaHistorial(clinicaUrl: string, pacienteId: string, historialId: string): Promise<{ success: boolean; message: string }> {
    console.log('🗑️ [ELIMINAR_HISTORIAL] Iniciando eliminación de registro de historial:', { clinicaUrl, pacienteId, historialId });

    try {
      // 1. Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl }
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // 2. Verificar que el paciente existe y pertenece a la clínica
      const paciente = await this.prisma.patient.findFirst({
        where: { 
          id: pacienteId,
          clinicaId: clinica.id
        }
      });

      if (!paciente) {
        throw new NotFoundException('Paciente no encontrado');
      }

      // 3. Verificar que la ficha médica existe
      const fichaMedica = await this.prisma.fichaMedica.findFirst({
        where: { pacienteId }
      });

      if (!fichaMedica) {
        throw new NotFoundException('Ficha médica no encontrada');
      }

      // 4. Verificar que el registro de historial existe y pertenece a la ficha médica
      const historial = await this.prisma.fichaMedicaHistorial.findFirst({
        where: { 
          id: historialId,
          fichaMedica: { id: fichaMedica.id }
        }
      });

      if (!historial) {
        throw new NotFoundException('Registro de historial no encontrado');
      }

      // 5. Eliminar el registro de historial
      await this.prisma.fichaMedicaHistorial.delete({
        where: { id: historialId }
      });

      console.log('✅ [ELIMINAR_HISTORIAL] Registro de historial eliminado exitosamente:', historialId);

      return {
        success: true,
        message: 'Registro de historial eliminado exitosamente'
      };

    } catch (error) {
      console.error('❌ [ELIMINAR_HISTORIAL] Error eliminando registro de historial:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new Error('Error al eliminar el registro de historial');
    }
  }

  // ===== MÉTODOS DE ELIMINACIÓN LÓGICA (SOFT DELETE) =====

  async ocultarCarpeta(clinicaUrl: string, pacienteId: string, carpetaId: string): Promise<{ success: boolean; message: string }> {
    console.log('👁️ [OCULTAR_CARPETA] Ocultando carpeta (eliminación lógica)');
    console.log('👁️ [OCULTAR_CARPETA] Parámetros:', { clinicaUrl, pacienteId, carpetaId });

    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl }
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Verificar que el paciente existe y pertenece a la clínica
      const paciente = await this.prisma.patient.findFirst({
        where: { 
          id: pacienteId,
          clinicaId: clinica.id
        }
      });

      if (!paciente) {
        throw new NotFoundException('Paciente no encontrado');
      }

      // Obtener ficha médica del paciente primero
      const fichaMedica = await this.prisma.fichaMedica.findFirst({
        where: { pacienteId }
      });

      if (!fichaMedica) {
        throw new NotFoundException('Ficha médica no encontrada');
      }

      // Verificar que la carpeta existe y pertenece a la ficha médica
      const carpeta = await this.prisma.carpetaArchivo.findFirst({
        where: {
          id: carpetaId,
          fichaMedicaId: fichaMedica.id
        }
      });

      if (!carpeta) {
        throw new NotFoundException('Carpeta no encontrada');
      }

      // Marcar carpeta como oculta (soft delete)
      await this.prisma.carpetaArchivo.update({
        where: { id: carpetaId },
        data: { 
          oculta: true,
          fechaOcultacion: new Date()
        }
      });

      console.log('✅ [OCULTAR_CARPETA] Carpeta ocultada exitosamente');
      return {
        success: true,
        message: 'Carpeta ocultada exitosamente'
      };

    } catch (error) {
      console.error('❌ [OCULTAR_CARPETA] Error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Error al ocultar la carpeta');
    }
  }

  async ocultarFichaMedica(clinicaUrl: string, pacienteId: string): Promise<{ 
    success: boolean; 
    message: string; 
    archivosOcultados: number; 
    imagenesOcultadas: number; 
    carpetasOcultadas: number 
  }> {
    console.log('👁️ [OCULTAR_FICHA_MEDICA] Ocultando ficha médica completa (eliminación lógica)');
    console.log('👁️ [OCULTAR_FICHA_MEDICA] Parámetros:', { clinicaUrl, pacienteId });

    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl }
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Verificar que el paciente existe y pertenece a la clínica
      const paciente = await this.prisma.patient.findFirst({
        where: { 
          id: pacienteId,
          clinicaId: clinica.id
        }
      });

      if (!paciente) {
        throw new NotFoundException('Paciente no encontrado');
      }

      // Obtener ficha médica
      const fichaMedica = await this.prisma.fichaMedica.findFirst({
        where: { pacienteId }
      });

      if (!fichaMedica) {
        throw new NotFoundException('Ficha médica no encontrada');
      }

      // Ocultar archivos médicos
      const archivosOcultados = await this.prisma.archivoMedico.updateMany({
        where: { fichaMedicaId: fichaMedica.id },
        data: { 
          oculto: true,
          fechaOcultacion: new Date()
        }
      });

      // Ocultar imágenes médicas
      const imagenesOcultadas = await this.prisma.imagenMedica.updateMany({
        where: { fichaMedicaId: fichaMedica.id },
        data: { 
          oculta: true,
          fechaOcultacion: new Date()
        }
      });

      // Ocultar carpetas
      const carpetasOcultadas = await this.prisma.carpetaArchivo.updateMany({
        where: { fichaMedicaId: fichaMedica.id },
        data: { 
          oculta: true,
          fechaOcultacion: new Date()
        }
      });

      // Ocultar ficha médica
      await this.prisma.fichaMedica.update({
        where: { id: fichaMedica.id },
        data: { 
          oculta: true,
          fechaOcultacion: new Date()
        }
      });

      console.log('✅ [OCULTAR_FICHA_MEDICA] Ficha médica ocultada exitosamente');
      return {
        success: true,
        message: 'Ficha médica ocultada exitosamente',
        archivosOcultados: archivosOcultados.count,
        imagenesOcultadas: imagenesOcultadas.count,
        carpetasOcultadas: carpetasOcultadas.count
      };

    } catch (error) {
      console.error('❌ [OCULTAR_FICHA_MEDICA] Error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Error al ocultar la ficha médica');
    }
  }

  async ocultarFichaMedicaHistorial(clinicaUrl: string, pacienteId: string, historialId: string): Promise<{ success: boolean; message: string }> {
    console.log('👁️ [OCULTAR_HISTORIAL] Ocultando registro de historial (eliminación lógica)');
    console.log('👁️ [OCULTAR_HISTORIAL] Parámetros:', { clinicaUrl, pacienteId, historialId });

    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl }
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Verificar que el paciente existe y pertenece a la clínica
      const paciente = await this.prisma.patient.findFirst({
        where: { 
          id: pacienteId,
          clinicaId: clinica.id
        }
      });

      if (!paciente) {
        throw new NotFoundException('Paciente no encontrado');
      }

      // Verificar que el registro de historial existe
      const historial = await this.prisma.fichaMedicaHistorial.findFirst({
        where: {
          id: historialId,
          pacienteId: pacienteId
        }
      });

      if (!historial) {
        throw new NotFoundException('Registro de historial no encontrado');
      }

      // Ocultar archivos del historial
      await this.prisma.fichaMedicaArchivo.updateMany({
        where: { fichaHistorialId: historialId },
        data: { 
          oculto: true,
          fechaOcultacion: new Date()
        }
      });

      // Ocultar registro de historial
      await this.prisma.fichaMedicaHistorial.update({
        where: { id: historialId },
        data: { 
          oculto: true,
          fechaOcultacion: new Date()
        }
      });

      console.log('✅ [OCULTAR_HISTORIAL] Registro de historial ocultado exitosamente');
      return {
        success: true,
        message: 'Registro de historial ocultado exitosamente'
      };

    } catch (error) {
      console.error('❌ [OCULTAR_HISTORIAL] Error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Error al ocultar el registro de historial');
    }
  }
}
