import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './services/storage.service';
import { FileMicroserviceService } from './services/file-microservice.service';
import { FichaMedicaDto, FichaMedicaResponseDto, ArchivoMedicoDto, ImagenMedicaDto } from './dto/ficha-medica.dto';

@Injectable()
export class FichasMedicasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly fileMicroserviceService: FileMicroserviceService,
  ) {}

  async getFichaMedica(clinicaUrl: string, pacienteId: string): Promise<FichaMedicaResponseDto> {
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
        user: {
          clinicaId: clinica.id
        }
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
          imagenesMedicas: true
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
        imagenes: []
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
      archivos: fichaMedica.archivosMedicos.map(archivo => ({
        id: archivo.id,
        nombre: archivo.nombre,
        tipo: archivo.tipo,
        url: this.storageService.getFileUrl(archivo.url),
        fecha: archivo.fechaSubida.toISOString().split('T')[0]
      })),
      imagenes: fichaMedica.imagenesMedicas.map(imagen => ({
        id: imagen.id,
        nombre: imagen.nombre,
        url: this.storageService.getFileUrl(imagen.url),
        fecha: imagen.fechaSubida.toISOString().split('T')[0],
        descripcion: imagen.descripcion || undefined
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
        user: {
          clinicaId: clinica.id
        }
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

  async uploadFile(clinicaUrl: string, pacienteId: string, file: Express.Multer.File, userToken?: string): Promise<ArchivoMedicoDto> {
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
        user: {
          clinicaId: clinica.id
        }
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

    // Subir archivo al microservicio
    const scope = this.fileMicroserviceService.generateScope(clinica.id, pacienteId, 'archivos');
    const uploadResult = await this.fileMicroserviceService.uploadFile({
      file,
      visibility: 'private', // Los archivos médicos son privados
      scope,
      conversationId: fichaMedica.id, // Usar el ID de la ficha como conversation_id
      messageId: `archivo-${Date.now()}` // Generar un message_id único
    }, userToken);

    // Guardar en base de datos
    const archivoMedico = await this.prisma.archivoMedico.create({
      data: {
        fichaMedicaId: fichaMedica.id,
        nombre: uploadResult.nombre,
        nombreArchivo: uploadResult.nombre,
        tipo: file.mimetype.includes('pdf') ? 'pdf' : 'doc',
        url: uploadResult.url,
        tamañoBytes: BigInt(uploadResult.size),
        microserviceFileId: uploadResult.id // Guardar el ID del microservicio
      }
    });

    return {
      id: archivoMedico.id,
      nombre: archivoMedico.nombre,
      tipo: archivoMedico.tipo,
      url: uploadResult.url, // Usar la URL del microservicio directamente
      fecha: archivoMedico.fechaSubida.toISOString().split('T')[0]
    };
  }

  async uploadImage(clinicaUrl: string, pacienteId: string, file: Express.Multer.File, userToken?: string): Promise<ImagenMedicaDto> {
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
        user: {
          clinicaId: clinica.id
        }
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

    // Subir imagen al microservicio
    const scope = this.fileMicroserviceService.generateScope(clinica.id, pacienteId, 'imagenes');
    const uploadResult = await this.fileMicroserviceService.uploadFile({
      file,
      visibility: 'private', // Las imágenes médicas son privadas
      scope,
      conversationId: fichaMedica.id, // Usar el ID de la ficha como conversation_id
      messageId: `imagen-${Date.now()}` // Generar un message_id único
    }, userToken);

    // Guardar en base de datos
    const imagenMedica = await this.prisma.imagenMedica.create({
      data: {
        fichaMedicaId: fichaMedica.id,
        nombre: uploadResult.nombre,
        nombreArchivo: uploadResult.nombre,
        url: uploadResult.url,
        tamañoBytes: BigInt(uploadResult.size),
        microserviceFileId: uploadResult.id // Guardar el ID del microservicio
      }
    });

    return {
      id: imagenMedica.id,
      nombre: imagenMedica.nombre,
      url: uploadResult.url, // Usar la URL del microservicio directamente
      fecha: imagenMedica.fechaSubida.toISOString().split('T')[0],
      descripcion: imagenMedica.descripcion || undefined
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
        user: {
          clinicaId: clinica.id
        }
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
    if (archivo.microserviceFileId) {
      try {
        await this.fileMicroserviceService.deleteFile(archivo.microserviceFileId);
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
        user: {
          clinicaId: clinica.id
        }
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
    if (imagen.microserviceFileId) {
      try {
        await this.fileMicroserviceService.deleteFile(imagen.microserviceFileId);
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
}
