import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClinicaPendienteDto } from './dto/create-clinica-pendiente.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PublicClinicasPendientesService {
  constructor(private prisma: PrismaService) {}

  async createClinicaPendiente(dto: CreateClinicaPendienteDto) {
    try {
      // Convertir URL a minúsculas para consistencia
      const urlNormalizada = dto.url.toLowerCase();
      
      // Verificar que la URL no exista
      const existingClinica = await this.prisma.clinica.findUnique({
        where: { url: urlNormalizada },
      });

      if (existingClinica) {
        throw new BadRequestException('URL de clínica ya existe');
      }

      // Verificar que el email no exista
      if (dto.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: dto.email },
        });

        if (existingUser) {
          throw new BadRequestException('El email ya está registrado');
        }
      }

      // Verificar que el email del admin no exista
      if (dto.admin?.email) {
        const existingAdminUser = await this.prisma.user.findUnique({
          where: { email: dto.admin.email },
        });

        if (existingAdminUser) {
          throw new BadRequestException('El email del administrador ya está registrado');
        }
      }

      // Crear la clínica con estado pendiente
      const clinica = await this.prisma.clinica.create({
        data: {
          name: dto.nombre,
          url: urlNormalizada,
          address: dto.direccion || '',
          phone: dto.telefono || '',
          email: dto.email,
          colorPrimario: dto.color_primario || '#3B82F6',
          colorSecundario: dto.color_secundario || '#1E40AF',
          descripcion: dto.descripcion || '',
          estado: dto.estado || 'inactiva',
          estadoPago: 'pendiente',
          pendienteAprobacion: dto.pendiente_aprobacion !== undefined ? dto.pendiente_aprobacion : true,
          fuente: dto.fuente || 'landing_page',
          fechaCreacion: new Date(),
          ultimoPago: null,
          proximoPago: null,
        },
      });

      // Crear el usuario admin si se proporciona
      if (dto.admin) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        
        await this.prisma.user.create({
          data: {
            email: dto.admin.email,
            password: hashedPassword,
            name: dto.admin.nombre,
            role: 'ADMIN',
            clinicaId: clinica.id,
            estado: 'activo',
          },
        });
      }

      return {
        success: true,
        message: 'Clínica creada exitosamente. Será revisada por nuestro equipo.',
        clinica: {
          id: clinica.id,
          nombre: clinica.name,
          url: clinica.url,
          estado: clinica.estado,
          pendiente_aprobacion: clinica.pendienteAprobacion,
          fuente: clinica.fuente,
          createdAt: clinica.createdAt,
          updatedAt: clinica.updatedAt,
        },
        pendiente_aprobacion: clinica.pendienteAprobacion,
      };
    } catch (error) {
      console.error('Error al crear clínica pendiente desde landing page:', error);
      throw new BadRequestException(error.message || 'Error interno del servidor');
    }
  }
}
