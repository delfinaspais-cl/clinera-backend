import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './services/storage.service';
import { FichaMedicaDto, FichaMedicaResponseDto, ArchivoMedicoDto, ImagenMedicaDto } from './dto/ficha-medica.dto';

@Injectable()
export class FichasMedicasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
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

  async uploadFile(clinicaUrl: string, pacienteId: string, file: Express.Multer.File): Promise<ArchivoMedicoDto> {
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
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido');
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

    // Subir archivo
    const uploadResult = await this.storageService.uploadFile(file, clinica.id, pacienteId, 'archivos');

    // Guardar en base de datos
    const archivoMedico = await this.prisma.archivoMedico.create({
      data: {
        fichaMedicaId: fichaMedica.id,
        nombre: file.originalname,
        nombreArchivo: uploadResult.nombreArchivo,
        tipo: file.mimetype.includes('pdf') ? 'pdf' : 'doc',
        url: uploadResult.url,
        tamañoBytes: BigInt(file.size)
      }
    });

    return {
      id: archivoMedico.id,
      nombre: archivoMedico.nombre,
      tipo: archivoMedico.tipo,
      url: this.storageService.getFileUrl(archivoMedico.url),
      fecha: archivoMedico.fechaSubida.toISOString().split('T')[0]
    };
  }

  async uploadImage(clinicaUrl: string, pacienteId: string, file: Express.Multer.File): Promise<ImagenMedicaDto> {
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
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen');
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

    // Subir imagen
    const uploadResult = await this.storageService.uploadFile(file, clinica.id, pacienteId, 'imagenes');

    // Guardar en base de datos
    const imagenMedica = await this.prisma.imagenMedica.create({
      data: {
        fichaMedicaId: fichaMedica.id,
        nombre: file.originalname,
        nombreArchivo: uploadResult.nombreArchivo,
        url: uploadResult.url,
        tamañoBytes: BigInt(file.size)
      }
    });

    return {
      id: imagenMedica.id,
      nombre: imagenMedica.nombre,
      url: this.storageService.getFileUrl(imagenMedica.url),
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

    // Eliminar de almacenamiento
    await this.storageService.deleteFile(archivo.url);

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

    // Eliminar de almacenamiento
    await this.storageService.deleteFile(imagen.url);

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
