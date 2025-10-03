import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-client.dto';
import { SearchPatientsDto } from './dto/search-patients.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl },
      include: {
        especialidades: true,
        horarios: true,
      },
    });

    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    const pacientes = await this.prisma.patient.findMany({
      where: {
        clinicaId: clinica.id,
      },
      include: { clinica: true },
    });

    // Agregar conteo de turnos para cada paciente
    const pacientesConTurnos = await Promise.all(
      pacientes.map(async (paciente) => {
        const turnosCount = await this.prisma.turno.count({
          where: {
            email: paciente.email,
            clinicaId: clinica.id,
          },
        });

        return {
          ...paciente,
          totalTurnos: turnosCount,
        };
      })
    );

    return pacientesConTurnos;
  }

  async create(clinicaUrl: string, dto: CreatePatientDto) {
    try {
      console.log('🔍 Creando paciente para clínica:', clinicaUrl);
      console.log('🔍 DTO recibido:', JSON.stringify(dto, null, 2));
      
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });
      
      console.log('🔍 Clínica encontrada:', clinica ? 'Sí' : 'No');
      if (!clinica) throw new NotFoundException('Clínica no encontrada');

      // Usar telefono si está disponible, sino phone
      const phoneNumber = dto.telefono || dto.phone;
      
      // Usar fechaNacimiento si está disponible, sino birthDate, sino fecha_nacimiento
      const birthDate = dto.fechaNacimiento || dto.birthDate || dto.fecha_nacimiento;
      
      // Usar name si está disponible, sino nombre
      const patientName = dto.name || dto.nombre;
      
      // Validar que el nombre no esté vacío
      if (!patientName || patientName.trim() === '') {
        throw new BadRequestException('El nombre del paciente es requerido');
      }

      // Validar que al menos uno de los campos de teléfono esté presente
      if (!phoneNumber || phoneNumber.trim() === '') {
        throw new BadRequestException('El teléfono del paciente es requerido');
      }

      // Validar email si se proporciona
      let patientEmail = dto.email || null;
      if (patientEmail && patientEmail.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(patientEmail)) {
          throw new BadRequestException('El formato del email no es válido');
        }
      }

      // Verificar si ya existe un paciente con ese email en esta clínica (si se proporciona email)
      if (patientEmail) {
        const existingPatient = await this.prisma.patient.findFirst({
          where: { 
            email: patientEmail,
            clinicaId: clinica.id
          },
        });

        if (existingPatient) {
          throw new BadRequestException('Ya existe un paciente con este email');
        }
      }

      console.log('🔍 Datos procesados - Nombre:', patientName, 'Teléfono:', phoneNumber, 'Email:', patientEmail, 'Fecha nacimiento:', birthDate);
      
      // Combinar notas existentes con documento si está presente
      let combinedNotes = dto.notes || '';
      if (dto.documento) {
        combinedNotes = combinedNotes ? 
          `${combinedNotes}\nDocumento: ${dto.documento}` : 
          `Documento: ${dto.documento}`;
      }
      
      console.log('🔍 Creando paciente directamente en la tabla patients...');
      
      const patient = await this.prisma.patient.create({
        data: {
          name: patientName,
          email: patientEmail,
          birthDate: birthDate ? new Date(birthDate) : null,
          phone: phoneNumber,
          notes: combinedNotes,
          clinicaId: clinica.id,
        },
        include: { clinica: true },
      });

      console.log('🔍 Paciente creado exitosamente con ID:', patient.id);

      return {
        success: true,
        data: patient,
        message: 'Paciente creado exitosamente',
      };
    } catch (error) {
      console.error('🚨 Error creando paciente:', error);
      console.error('🚨 Error stack:', error.stack);
      console.error('🚨 Error message:', error.message);
      console.error('🚨 Error name:', error.name);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        console.error('🚨 Re-throwing known exception:', error);
        throw error;
      }
      
      // Si es un error de Prisma, capturar más detalles
      if (error.code) {
        console.error('🚨 Prisma error code:', error.code);
        console.error('🚨 Prisma error meta:', error.meta);
        throw new BadRequestException(`Error de base de datos: ${error.message}`);
      }
      
      throw new BadRequestException(`Error interno del servidor al crear paciente: ${error.message}`);
    }
  }

  async findOne(clinicaUrl: string, id: string) {
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl },
    });

    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    const paciente = await this.prisma.patient.findFirst({
      where: { 
        id,
        clinicaId: clinica.id,
      },
      include: { clinica: true },
    });
    
    if (!paciente) throw new NotFoundException('Paciente no encontrado');

    return paciente;
  }

  async update(clinicaUrl: string, id: string, dto: UpdatePatientDto) {
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Verificar que el paciente pertenece a esta clínica
    const existingPatient = await this.prisma.patient.findFirst({
      where: { 
        id,
        clinicaId: clinica.id,
      },
    });

    if (!existingPatient) {
      throw new NotFoundException('Paciente no encontrado en esta clínica');
    }

    return this.prisma.patient.update({
      where: { id },
      data: dto,
      include: { clinica: true },
    });
  }

  async updatePatient(clinicaUrl: string, id: string, dto: any) {
    try {
      console.log('🔍 Actualizando paciente para clínica:', clinicaUrl);
      console.log('🔍 DTO recibido:', JSON.stringify(dto, null, 2));
      
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });
      
      console.log('🔍 Clínica encontrada:', clinica ? 'Sí' : 'No');
      if (!clinica) throw new NotFoundException('Clínica no encontrada');

      // Buscar el paciente existente
      const existingPatient = await this.prisma.patient.findFirst({
        where: { 
          id,
          clinicaId: clinica.id,
        },
        include: { clinica: true },
      });

      console.log('🔍 Paciente encontrado:', existingPatient ? 'Sí' : 'No');
      if (!existingPatient) throw new NotFoundException('Paciente no encontrado');

      // Procesar los datos como en el método create
      const phoneNumber = dto.telefono || dto.phone;
      const birthDate = dto.fechaNacimiento || dto.birthDate || dto.fecha_nacimiento;
      const patientName = dto.name || dto.nombre;
      const patientEmail = dto.email || null;

      // Validar que el nombre no esté vacío si se proporciona
      if (patientName && patientName.trim() === '') {
        throw new BadRequestException('El nombre del paciente no puede estar vacío');
      }

      // Validar email si se proporciona
      if (patientEmail && patientEmail.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(patientEmail)) {
          throw new BadRequestException('El formato del email no es válido');
        }
      }

      console.log('🔍 Datos procesados - Nombre:', patientName, 'Teléfono:', phoneNumber, 'Email:', patientEmail, 'Fecha nacimiento:', birthDate);

      // Preparar datos de actualización para el paciente
      const patientUpdateData: any = {};
      if (patientName) patientUpdateData.name = patientName;
      if (patientEmail !== null) patientUpdateData.email = patientEmail;
      if (birthDate) patientUpdateData.birthDate = new Date(birthDate);
      if (phoneNumber) patientUpdateData.phone = phoneNumber;
      
      // Manejar notas y documento
      let combinedNotes = dto.notes || existingPatient.notes || '';
      if (dto.documento) {
        // Remover documento anterior si existe
        combinedNotes = combinedNotes.replace(/Documento: \d+/g, '').trim();
        // Agregar nuevo documento
        combinedNotes = combinedNotes ? 
          `${combinedNotes}\nDocumento: ${dto.documento}` : 
          `Documento: ${dto.documento}`;
      }
      if (combinedNotes) patientUpdateData.notes = combinedNotes;

      // Actualizar paciente si hay datos para actualizar
      if (Object.keys(patientUpdateData).length > 0) {
        console.log('🔍 Actualizando paciente...');
        const updatedPatient = await this.prisma.patient.update({
          where: { id },
          data: patientUpdateData,
          include: { clinica: true },
        });
        console.log('🔍 Paciente actualizado exitosamente con ID:', updatedPatient.id);

        return {
          success: true,
          data: updatedPatient,
          message: 'Paciente actualizado exitosamente',
        };
      } else {
        // Si no hay datos para actualizar, retornar el paciente actual
        return {
          success: true,
          data: existingPatient,
          message: 'No se encontraron cambios para actualizar',
        };
      }
    } catch (error) {
      console.error('Error actualizando paciente:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error interno del servidor al actualizar paciente');
    }
  }

  async remove(clinicaUrl: string, id: string) {
    const clinica = await this.prisma.clinica.findFirst({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Verificar que el paciente pertenece a la clínica
    const patient = await this.prisma.patient.findFirst({
      where: {
        id,
        clinicaId: clinica.id,
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado en esta clínica');
    }

    // Eliminar el paciente
    await this.prisma.patient.delete({
      where: { id },
    });

    return { message: 'Paciente eliminado correctamente' };
  }

  async getMisTurnos(email: string) {
    // Buscar paciente por email directamente
    const patient = await this.prisma.patient.findFirst({
      where: { email },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return this.prisma.turno.findMany({
      where: {
        email: email,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  // Método de búsqueda avanzada de pacientes
  async searchPatients(clinicaUrl: string, searchDto: SearchPatientsDto) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Construir filtros de búsqueda
      const where: any = {
        clinicaId: clinica.id,
      };

      // Filtro por nombre
      if (searchDto.nombre) {
        where.name = { contains: searchDto.nombre, mode: 'insensitive' };
      }

      // Filtro por email
      if (searchDto.email) {
        where.email = { contains: searchDto.email, mode: 'insensitive' };
      }

      // Filtro por teléfono
      if (searchDto.telefono) {
        where.phone = { contains: searchDto.telefono, mode: 'insensitive' };
      }

      // Filtro por fecha de nacimiento
      if (searchDto.fechaNacimientoDesde || searchDto.fechaNacimientoHasta) {
        where.birthDate = {};
        if (searchDto.fechaNacimientoDesde) {
          where.birthDate.gte = new Date(searchDto.fechaNacimientoDesde);
        }
        if (searchDto.fechaNacimientoHasta) {
          where.birthDate.lte = new Date(searchDto.fechaNacimientoHasta);
        }
      }

      // Filtro por fecha de creación
      if (searchDto.fechaCreacionDesde || searchDto.fechaCreacionHasta) {
        where.createdAt = {};
        if (searchDto.fechaCreacionDesde) {
          where.createdAt.gte = new Date(searchDto.fechaCreacionDesde);
        }
        if (searchDto.fechaCreacionHasta) {
          where.createdAt.lte = new Date(searchDto.fechaCreacionHasta);
        }
      }

      // Construir ordenamiento
      const orderBy: any = {};
      if (searchDto.sortBy) {
        orderBy[searchDto.sortBy] = searchDto.sortOrder || 'asc';
      } else {
        orderBy.name = 'asc';
      }

      // Calcular paginación
      const page = searchDto.page || 1;
      const limit = searchDto.limit || 10;
      const skip = (page - 1) * limit;

      // Obtener pacientes con paginación
      const [pacientes, total] = await Promise.all([
        this.prisma.patient.findMany({
          where,
          include: {
            clinica: {
              select: {
                id: true,
                name: true,
                url: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.patient.count({ where }),
      ]);

      // Transformar los datos para el formato requerido
      const pacientesFormateados = pacientes.map((paciente) => ({
        id: paciente.id,
        nombre: paciente.name,
        email: paciente.email,
        telefono: paciente.phone,
        fechaNacimiento: paciente.birthDate
          ? paciente.birthDate.toISOString().split('T')[0]
          : null,
        notas: paciente.notes,
        fechaCreacion: paciente.createdAt.toISOString(),
        clinica: paciente.clinica,
      }));

      return {
        success: true,
        pacientes: pacientesFormateados,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          nombre: searchDto.nombre,
          email: searchDto.email,
          telefono: searchDto.telefono,
          fechaNacimientoDesde: searchDto.fechaNacimientoDesde,
          fechaNacimientoHasta: searchDto.fechaNacimientoHasta,
          fechaCreacionDesde: searchDto.fechaCreacionDesde,
          fechaCreacionHasta: searchDto.fechaCreacionHasta,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error al buscar pacientes:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

}
