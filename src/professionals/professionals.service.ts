import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfessionalsService {
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

    return this.prisma.professional.findMany({
      where: { user: { clinicaId: clinica.id } },
      include: { user: true },
    });
  }

  async create(clinicaUrl: string, dto: CreateProfessionalDto) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
      include: {
        especialidades: true,
        horarios: true,
      },
    });

    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: 'PROFESSIONAL',
        name: dto.name,
        phone: dto.phone,
        clinicaId: clinica.id,
      },
    });

    return this.prisma.professional.create({
      data: {
        userId: user.id,
        name: dto.name,
        specialties: dto.specialties,
        defaultDurationMin: dto.defaultDurationMin ?? 30,
        bufferMin: dto.bufferMin ?? 10,
      },
      include: { user: true },
    });
  }

  async findOne(clinicaUrl: string, id: string) {
    const prof = await this.prisma.professional.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!prof) throw new NotFoundException('Profesional no encontrado');

    return prof;
  }

  async update(clinicaUrl: string, id: string, dto: UpdateProfessionalDto) {
    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new Error('Clínica no encontrada');
      }

      // Verificar que el profesional existe y pertenece a la clínica
      const existingProfessional = await this.prisma.professional.findFirst({
        where: {
          id,
          user: {
            clinicaId: clinica.id,
          },
        },
        include: { user: true },
      });

      if (!existingProfessional) {
        throw new Error('Profesional no encontrado en esta clínica');
      }

      // Preparar datos para actualizar el profesional
      const professionalData: any = {};
      if (dto.name) professionalData.name = dto.name;
      if (dto.specialties) professionalData.specialties = dto.specialties;
      if (dto.defaultDurationMin !== undefined) professionalData.defaultDurationMin = dto.defaultDurationMin;
      if (dto.bufferMin !== undefined) professionalData.bufferMin = dto.bufferMin;
      if (dto.notes !== undefined) professionalData.notes = dto.notes;

      // Preparar datos para actualizar el usuario
      const userData: any = {};
      if (dto.email) userData.email = dto.email;
      if (dto.phone) userData.phone = dto.phone;

      // Actualizar el profesional
      const updatedProfessional = await this.prisma.professional.update({
        where: { id },
        data: professionalData,
        include: { user: true },
      });

      // Actualizar el usuario si hay datos de usuario
      if (Object.keys(userData).length > 0) {
        await this.prisma.user.update({
          where: { id: existingProfessional.user.id },
          data: userData,
        });

        // Obtener el profesional actualizado con el usuario actualizado
        return this.prisma.professional.findUnique({
          where: { id },
          include: { user: true },
        });
      }

      return updatedProfessional;
    } catch (error) {
      console.error('Error actualizando profesional:', error);
      throw error;
    }
  }

  async remove(clinicaUrl: string, id: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new Error('Clínica no encontrada');
    }

    // Verificar que el profesional pertenece a la clínica
    const professional = await this.prisma.professional.findFirst({
      where: {
        id,
        user: {
          clinicaId: clinica.id,
        },
      },
      include: {
        user: true,
        agendas: true,
      },
    });

    if (!professional) {
      throw new Error('Profesional no encontrado en esta clínica');
    }

    // Eliminar agendas asociadas
    if (professional.agendas.length > 0) {
      await this.prisma.agenda.deleteMany({
        where: { professionalId: id },
      });
    }

    // Eliminar el profesional y su usuario asociado
    await this.prisma.professional.delete({
      where: { id },
    });

    await this.prisma.user.delete({
      where: { id: professional.user.id },
    });

    return { message: 'Profesional eliminado correctamente' };
  }
}
