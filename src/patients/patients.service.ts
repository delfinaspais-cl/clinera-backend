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
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
      include: {
        especialidades: true,
        horarios: true,
      },
    });

    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    return this.prisma.patient.findMany({
      where: {
        user: { clinicaId: clinica.id },
      },
      include: { user: true },
    });
  }

  async create(clinicaUrl: string, dto: CreatePatientDto) {
    try {
      console.log('🔍 Creando paciente para clínica:', clinicaUrl);
      console.log('🔍 DTO recibido:', JSON.stringify(dto, null, 2));
      
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });
      
      console.log('🔍 Clínica encontrada:', clinica ? 'Sí' : 'No');
      if (!clinica) throw new NotFoundException('Clínica no encontrada');

      // Generar contraseña automáticamente
      const password = this.generateRandomPassword();

      // Verificar si ya existe un usuario con ese email
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      console.log('🔍 Usuario existente:', existingUser ? 'Sí' : 'No');
      if (existingUser) {
        throw new BadRequestException('Ya existe un usuario con este email');
      }

      console.log('🔍 Encriptando contraseña...');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Usar telefono si está disponible, sino phone
      const phoneNumber = dto.telefono || dto.phone;
      
      // Usar fechaNacimiento si está disponible, sino birthDate
      const birthDate = dto.fechaNacimiento || dto.birthDate;

      console.log('🔍 Datos procesados - Teléfono:', phoneNumber, 'Fecha nacimiento:', birthDate);

      console.log('🔍 Creando usuario...');
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: 'PATIENT',
          name: dto.name,
          phone: phoneNumber,
          location: dto.direccion,
          clinicaId: clinica.id,
        },
      });

      console.log('🔍 Usuario creado con ID:', user.id);

      console.log('🔍 Creando paciente...');
      const patient = await this.prisma.patient.create({
        data: {
          name: dto.name,
          birthDate: birthDate ? new Date(birthDate) : null,
          phone: phoneNumber,
          notes: dto.notes,
          userId: user.id,
        },
        include: { user: true },
      });

      console.log('🔍 Paciente creado exitosamente con ID:', patient.id);

      return {
        success: true,
        data: patient,
        message: 'Paciente creado exitosamente',
      };
    } catch (error) {
      console.error('Error creando paciente:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error interno del servidor al crear paciente');
    }
  }

  async findOne(clinicaUrl: string, id: string) {
    const paciente = await this.prisma.patient.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!paciente) throw new NotFoundException('Paciente no encontrado');

    // Opcional: validar que pertenezca a la clínica
    return paciente;
  }

  async update(clinicaUrl: string, id: string, dto: UpdatePatientDto) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new Error('Clínica no encontrada');
    }

    return this.prisma.patient.update({
      where: { id },
      data: dto,
    });
  }

  async remove(clinicaUrl: string, id: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new Error('Clínica no encontrada');
    }

    // Verificar que el paciente pertenece a la clínica
    const patient = await this.prisma.patient.findFirst({
      where: {
        id,
        user: {
          clinicaId: clinica.id,
        },
      },
      include: {
        user: true,
      },
    });

    if (!patient) {
      throw new Error('Paciente no encontrado en esta clínica');
    }

    // Eliminar el paciente y su usuario asociado
    await this.prisma.patient.delete({
      where: { id },
    });

    await this.prisma.user.delete({
      where: { id: patient.user.id },
    });

    return { message: 'Paciente eliminado correctamente' };
  }

  async getMisTurnos(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
      },
    });

    if (!user || !user.patient) {
      throw new Error('Paciente no encontrado');
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
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Construir filtros de búsqueda
      const where: any = {
        user: {
          clinicaId: clinica.id,
          role: 'PATIENT',
        },
      };

      // Filtro por nombre
      if (searchDto.nombre) {
        where.OR = [
          { name: { contains: searchDto.nombre, mode: 'insensitive' } },
          {
            user: { name: { contains: searchDto.nombre, mode: 'insensitive' } },
          },
        ];
      }

      // Filtro por email
      if (searchDto.email) {
        where.user = {
          ...where.user,
          email: { contains: searchDto.email, mode: 'insensitive' },
        };
      }

      // Filtro por teléfono
      if (searchDto.telefono) {
        where.OR = [
          { phone: { contains: searchDto.telefono, mode: 'insensitive' } },
          {
            user: {
              phone: { contains: searchDto.telefono, mode: 'insensitive' },
            },
          },
        ];
      }

      // Filtro por ubicación
      if (searchDto.ubicacion) {
        where.user = {
          ...where.user,
          location: { contains: searchDto.ubicacion, mode: 'insensitive' },
        };
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
        where.user = {
          ...where.user,
          createdAt: {},
        };
        if (searchDto.fechaCreacionDesde) {
          where.user.createdAt.gte = new Date(searchDto.fechaCreacionDesde);
        }
        if (searchDto.fechaCreacionHasta) {
          where.user.createdAt.lte = new Date(searchDto.fechaCreacionHasta);
        }
      }

      // Filtro por estado
      if (searchDto.estado) {
        where.user = {
          ...where.user,
          estado: searchDto.estado,
        };
      }

      // Construir ordenamiento
      const orderBy: any = {};
      if (searchDto.sortBy) {
        if (searchDto.sortBy === 'name') {
          orderBy.name = searchDto.sortOrder || 'asc';
        } else if (searchDto.sortBy === 'email') {
          orderBy.user = { email: searchDto.sortOrder || 'asc' };
        } else if (searchDto.sortBy === 'createdAt') {
          orderBy.user = { createdAt: searchDto.sortOrder || 'asc' };
        } else {
          orderBy[searchDto.sortBy] = searchDto.sortOrder || 'asc';
        }
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
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                location: true,
                estado: true,
                createdAt: true,
                updatedAt: true,
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
        email: paciente.user.email,
        telefono: paciente.phone || paciente.user.phone,
        ubicacion: paciente.user.location,
        fechaNacimiento: paciente.birthDate
          ? paciente.birthDate.toISOString().split('T')[0]
          : null,
        notas: paciente.notes,
        estado: paciente.user.estado,
        fechaCreacion: paciente.user.createdAt.toISOString(),
        fechaActualizacion: paciente.user.updatedAt.toISOString(),
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
          ubicacion: searchDto.ubicacion,
          fechaNacimientoDesde: searchDto.fechaNacimientoDesde,
          fechaNacimientoHasta: searchDto.fechaNacimientoHasta,
          fechaCreacionDesde: searchDto.fechaCreacionDesde,
          fechaCreacionHasta: searchDto.fechaCreacionHasta,
          estado: searchDto.estado,
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

  private generateRandomPassword(): string {
    const length = 8;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }
}
