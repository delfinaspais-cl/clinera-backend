import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './services/storage.service';
import {
  CrearVersionFichaMedicaDto,
  FichaMedicaHistorialResponseDto,
  HistorialFichaMedicaResponseDto,
  ComparacionFichaMedicaResponseDto,
  ArchivoMedicoHistorialDto,
  EstadisticasFichasMedicasDto,
  PacienteFichaRecienteDto,
  DiferenciaVersionDto
} from './dto/ficha-medica-historial.dto';

@Injectable()
export class FichasMedicasHistorialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // Obtener ficha médica actual (última versión)
  async getFichaMedicaActual(clinicaUrl: string, pacienteId: string): Promise<FichaMedicaHistorialResponseDto> {
    const clinica = await this.verificarClinica(clinicaUrl);
    const paciente = await this.verificarPaciente(pacienteId, clinica.id);

    // Obtener la versión actual
    const versionActual = await this.prisma.fichaMedicaHistorial.findFirst({
      where: {
        pacienteId,
        clinicaId: clinica.id,
        esVersionActual: true
      },
      include: {
        creadoPorUser: {
          include: {
            professional: {
              include: {
                especialidades: {
                  include: {
                    especialidad: true
                  }
                }
              }
            }
          }
        },
        archivos: {
          orderBy: { fechaSubida: 'desc' }
        }
      }
    });

    if (!versionActual) {
      // Si no hay versión actual, crear la primera versión
      return await this.crearPrimeraVersion(pacienteId, clinica.id);
    }

    return this.mapearVersionAResponse(versionActual);
  }

  // Obtener historial completo de fichas médicas
  async getHistorialFichaMedica(clinicaUrl: string, pacienteId: string): Promise<HistorialFichaMedicaResponseDto> {
    const clinica = await this.verificarClinica(clinicaUrl);
    const paciente = await this.verificarPaciente(pacienteId, clinica.id);

    const versiones = await this.prisma.fichaMedicaHistorial.findMany({
      where: {
        pacienteId,
        clinicaId: clinica.id
      },
      include: {
        creadoPorUser: true
      },
      orderBy: { version: 'desc' }
    });

    const versionesMapeadas = versiones.map(version => ({
      id: version.id,
      version: version.version,
      fechaCreacion: version.fechaCreacion.toISOString(),
      creadoPor: version.creadoPorUser?.name || 'Sistema',
      notasCambio: version.notasCambio || undefined,
      esVersionActual: version.esVersionActual,
      resumenCambios: this.generarResumenCambios(version)
    }));

    return {
      paciente: {
        id: paciente.id,
        nombre: paciente.name,
        email: paciente.user.email
      },
      versiones: versionesMapeadas,
      totalVersiones: versiones.length
    };
  }

  // Obtener una versión específica
  async getVersionEspecifica(clinicaUrl: string, pacienteId: string, versionId: string): Promise<FichaMedicaHistorialResponseDto> {
    const clinica = await this.verificarClinica(clinicaUrl);
    const paciente = await this.verificarPaciente(pacienteId, clinica.id);

    const version = await this.prisma.fichaMedicaHistorial.findFirst({
      where: {
        id: versionId,
        pacienteId,
        clinicaId: clinica.id
      },
      include: {
        creadoPorUser: {
          include: {
            professional: {
              include: {
                especialidades: {
                  include: {
                    especialidad: true
                  }
                }
              }
            }
          }
        },
        archivos: {
          orderBy: { fechaSubida: 'desc' }
        }
      }
    });

    if (!version) {
      throw new NotFoundException('Versión no encontrada');
    }

    return this.mapearVersionAResponse(version);
  }

  // Actualizar ficha médica (modifica la versión actual)
  async actualizarFichaMedica(
    clinicaUrl: string, 
    pacienteId: string, 
    datos: CrearVersionFichaMedicaDto
  ): Promise<FichaMedicaHistorialResponseDto> {
    const clinica = await this.verificarClinica(clinicaUrl);
    const paciente = await this.verificarPaciente(pacienteId, clinica.id);

    // Buscar la versión actual
    let versionActual = await this.prisma.fichaMedicaHistorial.findFirst({
      where: {
        pacienteId,
        clinicaId: clinica.id,
        esVersionActual: true
      },
      include: {
        creadoPorUser: {
          include: {
            professional: {
              include: {
                especialidades: {
                  include: {
                    especialidad: true
                  }
                }
              }
            }
          }
        },
        archivos: {
          orderBy: { fechaSubida: 'desc' }
        }
      }
    });

    // Si no existe versión actual, crear la primera
    if (!versionActual) {
      const primeraVersion = await this.prisma.fichaMedicaHistorial.create({
        data: {
          pacienteId,
          clinicaId: clinica.id,
          version: 1,
          esVersionActual: true,
          notasCambio: datos.notasCambio || 'Primera versión de la ficha médica',
          // Datos básicos
          grupoSanguineo: datos.datosBasicos?.grupoSanguineo,
          ocupacion: datos.datosBasicos?.ocupacion,
          alergias: datos.datosBasicos?.alergias,
          medicamentosActuales: datos.datosBasicos?.medicamentosActuales,
          antecedentesPatologicos: datos.datosBasicos?.antecedentesPatologicos,
          antecedentesQuirurgicos: datos.datosBasicos?.antecedentesQuirurgicos,
          antecedentesFamiliares: datos.datosBasicos?.antecedentesFamiliares,
          habitos: datos.datosBasicos?.habitos,
          // Historia clínica
          motivoConsulta: datos.historiaClinica?.motivoConsulta,
          sintomas: datos.historiaClinica?.sintomas,
          diagnostico: datos.historiaClinica?.diagnostico,
          tratamiento: datos.historiaClinica?.tratamiento,
          evolucion: datos.historiaClinica?.evolucion
        },
        include: {
          creadoPorUser: {
            include: {
              professional: {
                include: {
                  especialidades: {
                    include: {
                      especialidad: true
                    }
                  }
                }
              }
            }
          },
          archivos: {
            orderBy: { fechaSubida: 'desc' }
          }
        }
      });

      return this.mapearVersionAResponse(primeraVersion);
    }

    // Actualizar la versión actual existente
    const versionActualizada = await this.prisma.fichaMedicaHistorial.update({
      where: { id: versionActual.id },
      data: {
        notasCambio: datos.notasCambio || 'Actualización de ficha médica',
        // Datos básicos
        grupoSanguineo: datos.datosBasicos?.grupoSanguineo,
        ocupacion: datos.datosBasicos?.ocupacion,
        alergias: datos.datosBasicos?.alergias,
        medicamentosActuales: datos.datosBasicos?.medicamentosActuales,
        antecedentesPatologicos: datos.datosBasicos?.antecedentesPatologicos,
        antecedentesQuirurgicos: datos.datosBasicos?.antecedentesQuirurgicos,
        antecedentesFamiliares: datos.datosBasicos?.antecedentesFamiliares,
        habitos: datos.datosBasicos?.habitos,
        // Historia clínica
        motivoConsulta: datos.historiaClinica?.motivoConsulta,
        sintomas: datos.historiaClinica?.sintomas,
        diagnostico: datos.historiaClinica?.diagnostico,
        tratamiento: datos.historiaClinica?.tratamiento,
        evolucion: datos.historiaClinica?.evolucion
      },
      include: {
        creadoPorUser: {
          include: {
            professional: {
              include: {
                especialidades: {
                  include: {
                    especialidad: true
                  }
                }
              }
            }
          }
        },
        archivos: {
          orderBy: { fechaSubida: 'desc' }
        }
      }
    });

    return this.mapearVersionAResponse(versionActualizada);
  }

  // Crear nueva versión de ficha médica
  async crearNuevaVersion(
    clinicaUrl: string, 
    pacienteId: string, 
    datos: CrearVersionFichaMedicaDto
  ): Promise<FichaMedicaHistorialResponseDto> {
    const clinica = await this.verificarClinica(clinicaUrl);
    const paciente = await this.verificarPaciente(pacienteId, clinica.id);

    // Obtener la siguiente versión
    const ultimaVersion = await this.prisma.fichaMedicaHistorial.findFirst({
      where: { pacienteId, clinicaId: clinica.id },
      orderBy: { version: 'desc' }
    });

    const nuevaVersion = ultimaVersion ? ultimaVersion.version + 1 : 1;

    // Marcar todas las versiones anteriores como no actuales
    await this.prisma.fichaMedicaHistorial.updateMany({
      where: { pacienteId, clinicaId: clinica.id },
      data: { esVersionActual: false }
    });

    // Crear nueva versión
    const versionCreada = await this.prisma.fichaMedicaHistorial.create({
      data: {
        pacienteId,
        clinicaId: clinica.id,
        version: nuevaVersion,
        esVersionActual: true,
        notasCambio: datos.notasCambio,
        // Datos básicos
        grupoSanguineo: datos.datosBasicos?.grupoSanguineo,
        ocupacion: datos.datosBasicos?.ocupacion,
        alergias: datos.datosBasicos?.alergias,
        medicamentosActuales: datos.datosBasicos?.medicamentosActuales,
        antecedentesPatologicos: datos.datosBasicos?.antecedentesPatologicos,
        antecedentesQuirurgicos: datos.datosBasicos?.antecedentesQuirurgicos,
        antecedentesFamiliares: datos.datosBasicos?.antecedentesFamiliares,
        habitos: datos.datosBasicos?.habitos,
        // Historia clínica
        motivoConsulta: datos.historiaClinica?.motivoConsulta,
        sintomas: datos.historiaClinica?.sintomas,
        diagnostico: datos.historiaClinica?.diagnostico,
        tratamiento: datos.historiaClinica?.tratamiento,
        evolucion: datos.historiaClinica?.evolucion
      },
      include: {
        creadoPorUser: {
          include: {
            professional: {
              include: {
                especialidades: {
                  include: {
                    especialidad: true
                  }
                }
              }
            }
          }
        },
        archivos: {
          orderBy: { fechaSubida: 'desc' }
        }
      }
    });

    return this.mapearVersionAResponse(versionCreada);
  }

  // Comparar dos versiones
  async compararVersiones(
    clinicaUrl: string, 
    pacienteId: string, 
    version1Id: string, 
    version2Id: string
  ): Promise<ComparacionFichaMedicaResponseDto> {
    const clinica = await this.verificarClinica(clinicaUrl);
    const paciente = await this.verificarPaciente(pacienteId, clinica.id);

    const [version1, version2] = await Promise.all([
      this.getVersionEspecifica(clinicaUrl, pacienteId, version1Id),
      this.getVersionEspecifica(clinicaUrl, pacienteId, version2Id)
    ]);

    const diferencias = this.calcularDiferencias(version1, version2);
    const archivosAgregados = this.calcularArchivosAgregados(version1, version2);
    const archivosEliminados = this.calcularArchivosEliminados(version1, version2);
    const imagenesAgregadas = this.calcularImagenesAgregadas(version1, version2);
    const imagenesEliminadas = this.calcularImagenesEliminadas(version1, version2);

    return {
      version1,
      version2,
      diferencias,
      archivosAgregados,
      archivosEliminados,
      imagenesAgregadas,
      imagenesEliminadas
    };
  }

  // Subir archivo a una versión específica
  async subirArchivoVersion(
    clinicaUrl: string,
    pacienteId: string,
    versionId: string,
    file: Express.Multer.File,
    tipo: string,
    descripcion?: string
  ): Promise<ArchivoMedicoHistorialDto> {
    const clinica = await this.verificarClinica(clinicaUrl);
    const paciente = await this.verificarPaciente(pacienteId, clinica.id);

    // Verificar que la versión existe
    const version = await this.prisma.fichaMedicaHistorial.findFirst({
      where: {
        id: versionId,
        pacienteId,
        clinicaId: clinica.id
      }
    });

    if (!version) {
      throw new NotFoundException('Versión no encontrada');
    }

    // Validar tipo de archivo
    if (tipo === 'archivo') {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException('Tipo de archivo no permitido');
      }
    } else if (tipo === 'imagen') {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('El archivo debe ser una imagen');
      }
    }

    // Subir archivo
    const uploadResult = await this.storageService.uploadFile(file, clinica.id, pacienteId, tipo as 'archivos' | 'imagenes');

    // Guardar en base de datos
    const archivo = await this.prisma.fichaMedicaArchivo.create({
      data: {
        fichaHistorialId: versionId,
        tipo,
        nombre: file.originalname,
        url: uploadResult.url,
        descripcion
      }
    });

    return {
      id: archivo.id,
      tipo: archivo.tipo,
      nombre: archivo.nombre,
      url: this.storageService.getFileUrl(archivo.url),
      descripcion: archivo.descripcion || undefined,
      fechaSubida: archivo.fechaSubida.toISOString()
    };
  }

  // Obtener archivos de una versión
  async getArchivosVersion(clinicaUrl: string, pacienteId: string, versionId: string): Promise<ArchivoMedicoHistorialDto[]> {
    const clinica = await this.verificarClinica(clinicaUrl);
    const paciente = await this.verificarPaciente(pacienteId, clinica.id);

    const archivos = await this.prisma.fichaMedicaArchivo.findMany({
      where: {
        fichaHistorialId: versionId,
        fichaHistorial: {
          pacienteId,
          clinicaId: clinica.id
        }
      },
      orderBy: { fechaSubida: 'desc' }
    });

    return archivos.map(archivo => ({
      id: archivo.id,
      tipo: archivo.tipo,
      nombre: archivo.nombre,
      url: this.storageService.getFileUrl(archivo.url),
      descripcion: archivo.descripcion || undefined,
      fechaSubida: archivo.fechaSubida.toISOString()
    }));
  }

  // Eliminar archivo de una versión
  async eliminarArchivoVersion(
    clinicaUrl: string,
    pacienteId: string,
    versionId: string,
    archivoId: string
  ): Promise<{ success: boolean; message: string }> {
    const clinica = await this.verificarClinica(clinicaUrl);
    const paciente = await this.verificarPaciente(pacienteId, clinica.id);

    const archivo = await this.prisma.fichaMedicaArchivo.findFirst({
      where: {
        id: archivoId,
        fichaHistorialId: versionId,
        fichaHistorial: {
          pacienteId,
          clinicaId: clinica.id
        }
      }
    });

    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }

    // Eliminar de almacenamiento
    await this.storageService.deleteFile(archivo.url);

    // Eliminar de base de datos
    await this.prisma.fichaMedicaArchivo.delete({
      where: { id: archivoId }
    });

    return {
      success: true,
      message: 'Archivo eliminado correctamente'
    };
  }

  // Buscar fichas médicas por clínica (con filtros)
  async buscarFichasMedicas(clinicaUrl: string, filtros: any): Promise<any[]> {
    const clinica = await this.verificarClinica(clinicaUrl);

    const where: any = {
      clinicaId: clinica.id,
      esVersionActual: true
    };

    if (filtros.search) {
      where.OR = [
        { paciente: { name: { contains: filtros.search, mode: 'insensitive' } } },
        { diagnostico: { contains: filtros.search, mode: 'insensitive' } },
        { sintomas: { contains: filtros.search, mode: 'insensitive' } }
      ];
    }

    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.fechaCreacion = {};
      if (filtros.fechaDesde) {
        where.fechaCreacion.gte = new Date(filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
        where.fechaCreacion.lte = new Date(filtros.fechaHasta);
      }
    }

    if (filtros.doctorId) {
      where.creadoPor = filtros.doctorId;
    }

    const fichas = await this.prisma.fichaMedicaHistorial.findMany({
      where,
      include: {
        paciente: {
          include: {
            user: true
          }
        },
        creadoPorUser: true
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    return fichas.map(ficha => ({
      id: ficha.id,
      paciente: {
        id: ficha.paciente.id,
        nombre: ficha.paciente.name,
        email: ficha.paciente.user.email
      },
      version: ficha.version,
      fechaCreacion: ficha.fechaCreacion.toISOString(),
      creadoPor: ficha.creadoPorUser?.name || 'Sistema',
      diagnostico: ficha.diagnostico,
      sintomas: ficha.sintomas
    }));
  }

  // Obtener estadísticas de fichas médicas
  async getEstadisticasFichasMedicas(clinicaUrl: string): Promise<EstadisticasFichasMedicasDto> {
    const clinica = await this.verificarClinica(clinicaUrl);

    const [
      totalFichas,
      fichasActualizadas30Dias,
      fichasPendientes,
      promedioVersiones
    ] = await Promise.all([
      this.prisma.fichaMedicaHistorial.count({
        where: { clinicaId: clinica.id, esVersionActual: true }
      }),
      this.prisma.fichaMedicaHistorial.count({
        where: {
          clinicaId: clinica.id,
          esVersionActual: true,
          fechaCreacion: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      this.prisma.fichaMedicaHistorial.count({
        where: {
          clinicaId: clinica.id,
          esVersionActual: true,
          fechaCreacion: {
            lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      this.prisma.fichaMedicaHistorial.aggregate({
        where: { clinicaId: clinica.id },
        _avg: { version: true }
      })
    ]);

    return {
      totalFichas,
      fichasActualizadas30Dias,
      fichasPendientesActualizacion: fichasPendientes,
      promedioVersionesPorFicha: promedioVersiones._avg.version || 0
    };
  }

  // Buscar pacientes con fichas médicas actualizadas recientemente
  async getPacientesFichasRecientes(clinicaUrl: string, dias: number = 7): Promise<PacienteFichaRecienteDto[]> {
    const clinica = await this.verificarClinica(clinicaUrl);

    const fechaLimite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    const fichas = await this.prisma.fichaMedicaHistorial.findMany({
      where: {
        clinicaId: clinica.id,
        esVersionActual: true,
        fechaCreacion: {
          gte: fechaLimite
        }
      },
      include: {
        paciente: {
          include: {
            user: true
          }
        }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    return fichas.map(ficha => ({
      id: ficha.paciente.id,
      nombre: ficha.paciente.name,
      email: ficha.paciente.user.email,
      ultimaActualizacion: ficha.fechaCreacion.toISOString(),
      versionActual: ficha.version
    }));
  }

  // Restaurar una versión anterior (crear nueva versión basada en una anterior)
  async restaurarVersion(
    clinicaUrl: string,
    pacienteId: string,
    versionId: string,
    notasCambio: string
  ): Promise<FichaMedicaHistorialResponseDto> {
    const versionAnterior = await this.getVersionEspecifica(clinicaUrl, pacienteId, versionId);

    const datosRestauracion: CrearVersionFichaMedicaDto = {
      datosBasicos: versionAnterior.datosBasicos,
      historiaClinica: versionAnterior.historiaClinica,
      notasCambio: `Restauración de la versión ${versionAnterior.version}. ${notasCambio}`
    };

    return await this.crearNuevaVersion(clinicaUrl, pacienteId, datosRestauracion);
  }

  // Métodos privados auxiliares
  private async verificarClinica(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl }
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    return clinica;
  }

  private async verificarPaciente(pacienteId: string, clinicaId: string) {
    const paciente = await this.prisma.patient.findFirst({
      where: {
        id: pacienteId,
        user: {
          clinicaId
        }
      },
      include: {
        user: true
      }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return paciente;
  }

  private async crearPrimeraVersion(pacienteId: string, clinicaId: string): Promise<FichaMedicaHistorialResponseDto> {
    const primeraVersion = await this.prisma.fichaMedicaHistorial.create({
      data: {
        pacienteId,
        clinicaId,
        version: 1,
        esVersionActual: true,
        notasCambio: 'Primera versión de la ficha médica'
      },
      include: {
        creadoPorUser: true,
        archivos: true
      }
    });

    return this.mapearVersionAResponse(primeraVersion);
  }

  private mapearVersionAResponse(version: any): FichaMedicaHistorialResponseDto {
    const archivos = version.archivos.filter((a: any) => a.tipo === 'archivo');
    const imagenes = version.archivos.filter((a: any) => a.tipo === 'imagen');

    return {
      id: version.id,
      pacienteId: version.pacienteId,
      version: version.version,
      fechaCreacion: version.fechaCreacion.toISOString(),
      creadoPor: {
        id: version.creadoPorUser?.id || '',
        nombre: version.creadoPorUser?.name || 'Sistema',
        especialidad: version.creadoPorUser?.professional?.especialidades?.[0]?.especialidad?.name
      },
      datosBasicos: {
        grupoSanguineo: version.grupoSanguineo,
        ocupacion: version.ocupacion,
        alergias: version.alergias,
        medicamentosActuales: version.medicamentosActuales,
        antecedentesPatologicos: version.antecedentesPatologicos,
        antecedentesQuirurgicos: version.antecedentesQuirurgicos,
        antecedentesFamiliares: version.antecedentesFamiliares,
        habitos: version.habitos
      },
      historiaClinica: {
        motivoConsulta: version.motivoConsulta,
        sintomas: version.sintomas,
        diagnostico: version.diagnostico,
        tratamiento: version.tratamiento,
        evolucion: version.evolucion
      },
      archivos: archivos.map((archivo: any) => ({
        id: archivo.id,
        tipo: archivo.tipo,
        nombre: archivo.nombre,
        url: this.storageService.getFileUrl(archivo.url),
        descripcion: archivo.descripcion,
        fechaSubida: archivo.fechaSubida.toISOString()
      })),
      imagenes: imagenes.map((imagen: any) => ({
        id: imagen.id,
        tipo: imagen.tipo,
        nombre: imagen.nombre,
        url: this.storageService.getFileUrl(imagen.url),
        descripcion: imagen.descripcion,
        fechaSubida: imagen.fechaSubida.toISOString()
      })),
      notasCambio: version.notasCambio,
      esVersionActual: version.esVersionActual
    };
  }

  private generarResumenCambios(version: any): string {
    const cambios: string[] = [];
    
    if (version.notasCambio) {
      cambios.push(version.notasCambio);
    }

    // Analizar campos modificados
    const camposModificados: string[] = [];
    if (version.alergias) camposModificados.push('alergias');
    if (version.medicamentosActuales) camposModificados.push('medicamentos');
    if (version.diagnostico) camposModificados.push('diagnóstico');
    if (version.tratamiento) camposModificados.push('tratamiento');

    if (camposModificados.length > 0) {
      cambios.push(`Se actualizaron: ${camposModificados.join(', ')}`);
    }

    return cambios.join('. ') || 'Sin cambios específicos registrados';
  }

  private calcularDiferencias(version1: FichaMedicaHistorialResponseDto, version2: FichaMedicaHistorialResponseDto): DiferenciaVersionDto[] {
    const diferencias: DiferenciaVersionDto[] = [];

    // Comparar datos básicos
    const camposBasicos = ['grupoSanguineo', 'ocupacion', 'alergias', 'medicamentosActuales', 'antecedentesPatologicos', 'antecedentesQuirurgicos', 'antecedentesFamiliares', 'habitos'];
    
    camposBasicos.forEach(campo => {
      const valor1 = version1.datosBasicos[campo] || '';
      const valor2 = version2.datosBasicos[campo] || '';
      
      if (valor1 !== valor2) {
        diferencias.push({
          campo: `datosBasicos.${campo}`,
          valorAnterior: valor1,
          valorNuevo: valor2,
          tipo: valor1 === '' ? 'agregado' : valor2 === '' ? 'eliminado' : 'modificado'
        });
      }
    });

    // Comparar historia clínica
    const camposClinicos = ['motivoConsulta', 'sintomas', 'diagnostico', 'tratamiento', 'evolucion'];
    
    camposClinicos.forEach(campo => {
      const valor1 = version1.historiaClinica[campo] || '';
      const valor2 = version2.historiaClinica[campo] || '';
      
      if (valor1 !== valor2) {
        diferencias.push({
          campo: `historiaClinica.${campo}`,
          valorAnterior: valor1,
          valorNuevo: valor2,
          tipo: valor1 === '' ? 'agregado' : valor2 === '' ? 'eliminado' : 'modificado'
        });
      }
    });

    return diferencias;
  }

  private calcularArchivosAgregados(version1: FichaMedicaHistorialResponseDto, version2: FichaMedicaHistorialResponseDto): ArchivoMedicoHistorialDto[] {
    const archivos1 = version1.archivos.map(a => a.id);
    return version2.archivos.filter(a => !archivos1.includes(a.id));
  }

  private calcularArchivosEliminados(version1: FichaMedicaHistorialResponseDto, version2: FichaMedicaHistorialResponseDto): ArchivoMedicoHistorialDto[] {
    const archivos2 = version2.archivos.map(a => a.id);
    return version1.archivos.filter(a => !archivos2.includes(a.id));
  }

  private calcularImagenesAgregadas(version1: FichaMedicaHistorialResponseDto, version2: FichaMedicaHistorialResponseDto): ArchivoMedicoHistorialDto[] {
    const imagenes1 = version1.imagenes.map(i => i.id);
    return version2.imagenes.filter(i => !imagenes1.includes(i.id));
  }

  private calcularImagenesEliminadas(version1: FichaMedicaHistorialResponseDto, version2: FichaMedicaHistorialResponseDto): ArchivoMedicoHistorialDto[] {
    const imagenes2 = version2.imagenes.map(i => i.id);
    return version1.imagenes.filter(i => !imagenes2.includes(i.id));
  }
}
