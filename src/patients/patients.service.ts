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

  async findAll(clinicaUrl: string, page: number = 1, limit: number = 20, search?: string) {
    try {
      const clinica = await this.prisma.clinica.findFirst({
        where: { url: clinicaUrl },
        select: { id: true, name: true, url: true }
      });

      if (!clinica) throw new NotFoundException('Clínica no encontrada');

      // Calcular offset para paginación
      const skip = (page - 1) * limit;

      // Construir filtro de búsqueda
      const whereCondition: any = {
        clinicaId: clinica.id,
      };

      // Si hay un término de búsqueda, agregar condiciones OR para buscar en múltiples campos
      if (search) {
        whereCondition.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { documento: { contains: search, mode: 'insensitive' } },
          { clientNumber: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { province: { contains: search, mode: 'insensitive' } },
          { country: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Obtener pacientes con paginación
      const pacientes = await this.prisma.patient.findMany({
        where: whereCondition,
        include: { clinica: true },
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      // Contar total de pacientes para paginación
      const total = await this.prisma.patient.count({
        where: whereCondition
      });

      // Solo contar turnos para los pacientes de esta página (optimización)
      const pacientesConTurnos = await Promise.all(
        pacientes.map(async (paciente) => {
          let turnosCount = 0;
          
          // Solo contar turnos si el paciente tiene email
          if (paciente.email) {
            turnosCount = await this.prisma.turno.count({
              where: {
                email: paciente.email,
                clinicaId: clinica.id,
              },
            });
          }

          return {
            ...paciente,
            totalTurnos: turnosCount,
          };
        })
      );

      return {
        success: true,
        data: pacientesConTurnos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error en findAll pacientes:', error);
      throw new BadRequestException('Error al obtener los pacientes');
    }
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
      
      console.log('🔍 Creando paciente directamente en la tabla patients...');
      
      const patient = await this.prisma.patient.create({
        data: {
          name: patientName,
          email: patientEmail,
          birthDate: birthDate ? new Date(birthDate) : null,
          phone: phoneNumber,
          notes: dto.notes || null,
          documento: dto.documento || null,
          clientNumber: dto.clientNumber || null,
          address: dto.address || null,
          city: dto.city || null,
          province: dto.province || null,
          country: dto.country || null,
          gender: dto.gender || null,
          preExistingConditions: dto.preExistingConditions || null,
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
      if (dto.notes !== undefined) patientUpdateData.notes = dto.notes;
      if (dto.documento !== undefined) patientUpdateData.documento = dto.documento;
      if (dto.clientNumber !== undefined) patientUpdateData.clientNumber = dto.clientNumber;
      if (dto.address !== undefined) patientUpdateData.address = dto.address;
      if (dto.city !== undefined) patientUpdateData.city = dto.city;
      if (dto.province !== undefined) patientUpdateData.province = dto.province;
      if (dto.country !== undefined) patientUpdateData.country = dto.country;
      if (dto.gender !== undefined) patientUpdateData.gender = dto.gender;
      if (dto.preExistingConditions !== undefined) patientUpdateData.preExistingConditions = dto.preExistingConditions;

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

      // Filtro por documento
      if (searchDto.documento) {
        where.documento = { contains: searchDto.documento, mode: 'insensitive' };
      }

      // Filtro por número de cliente
      if (searchDto.clientNumber) {
        where.clientNumber = { contains: searchDto.clientNumber, mode: 'insensitive' };
      }

      // Filtro por ciudad
      if (searchDto.city) {
        where.city = { contains: searchDto.city, mode: 'insensitive' };
      }

      // Filtro por provincia
      if (searchDto.province) {
        where.province = { contains: searchDto.province, mode: 'insensitive' };
      }

      // Filtro por país
      if (searchDto.country) {
        where.country = { contains: searchDto.country, mode: 'insensitive' };
      }

      // Filtro por género
      if (searchDto.gender) {
        where.gender = { contains: searchDto.gender, mode: 'insensitive' };
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
        documento: paciente.documento,
        clientNumber: paciente.clientNumber,
        address: paciente.address,
        city: paciente.city,
        province: paciente.province,
        country: paciente.country,
        gender: paciente.gender,
        preExistingConditions: paciente.preExistingConditions,
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
