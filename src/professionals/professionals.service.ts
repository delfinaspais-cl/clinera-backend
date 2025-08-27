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

    const professionals = await this.prisma.professional.findMany({
      where: { user: { clinicaId: clinica.id } },
      include: { 
        user: true,
        agendas: true,
      },
    });

    // Formatear cada profesional con información adicional
    return professionals.map(prof => {
      const horarios = prof.agendas.map(agenda => ({
        dia: agenda.dia,
        horaInicio: agenda.horaInicio,
        horaFin: agenda.horaFin,
        duracionMin: agenda.duracionMin,
      }));

      return {
        ...prof,
        especialidad: prof.specialties, // Retornar array completo de especialidades
        tratamientos: prof.notes ? [prof.notes] : [], // Convertir notes a array temporalmente
        horarios: {
          dias: horarios.map(h => h.dia),
          horaInicio: horarios.length > 0 ? horarios[0].horaInicio : null,
          horaFin: horarios.length > 0 ? horarios[0].horaFin : null,
        },
      };
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

    // Crear el profesional con los nuevos campos
    const professional = await this.prisma.professional.create({
      data: {
        userId: user.id,
        name: dto.name,
        specialties: dto.specialties, // Usar specialties como envía el frontend
        defaultDurationMin: dto.defaultDurationMin ?? 30,
        bufferMin: dto.bufferMin ?? 10,
        notes: dto.notes,
      },
      include: { user: true },
    });

    // Crear horarios de atención si se proporcionan
    if (dto.horarios && dto.horarios.dias && dto.horarios.dias.length > 0) {
      const horariosData = dto.horarios.dias.map(dia => ({
        professionalId: professional.id,
        dia: dia.toUpperCase(),
        horaInicio: dto.horarios?.horaInicio || '08:00',
        horaFin: dto.horarios?.horaFin || '18:00',
        duracionMin: dto.defaultDurationMin ?? 30,
      }));

      await this.prisma.agenda.createMany({
        data: horariosData,
      });
    }

    // Retornar el profesional con información adicional
    return {
      ...professional,
      especialidad: dto.specialties, // Usar specialties como especialidad
      tratamientos: dto.tratamientos || [],
      sucursal: dto.sucursal,
      horarios: dto.horarios,
    };
  }

  async findOne(clinicaUrl: string, id: string) {
    const prof = await this.prisma.professional.findUnique({
      where: { id },
      include: { 
        user: true,
        agendas: true,
      },
    });

    if (!prof) throw new NotFoundException('Profesional no encontrado');

    // Formatear horarios para el frontend
    const horarios = prof.agendas.map(agenda => ({
      dia: agenda.dia,
      horaInicio: agenda.horaInicio,
      horaFin: agenda.horaFin,
      duracionMin: agenda.duracionMin,
    }));

    return {
      ...prof,
      especialidad: prof.specialties, // Retornar array completo de especialidades
      tratamientos: prof.notes ? [prof.notes] : [], // Convertir notes a array temporalmente
      horarios: {
        dias: horarios.map(h => h.dia),
        horaInicio: horarios.length > 0 ? horarios[0].horaInicio : null,
        horaFin: horarios.length > 0 ? horarios[0].horaFin : null,
      },
    };
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
      if (dto.specialties) professionalData.specialties = dto.specialties; // Usar specialties
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

      // Actualizar horarios si se proporcionan
      if (dto.horarios && dto.horarios.dias && dto.horarios.dias.length > 0) {
        // Eliminar horarios existentes
        await this.prisma.agenda.deleteMany({
          where: { professionalId: id },
        });

        // Crear nuevos horarios
        const horariosData = dto.horarios.dias.map(dia => ({
          professionalId: id,
          dia: dia.toUpperCase(),
          horaInicio: dto.horarios?.horaInicio || '08:00',
          horaFin: dto.horarios?.horaFin || '18:00',
          duracionMin: dto.defaultDurationMin ?? 30,
        }));

        await this.prisma.agenda.createMany({
          data: horariosData,
        });
      }

      // Actualizar el usuario si hay datos de usuario
      if (Object.keys(userData).length > 0) {
        await this.prisma.user.update({
          where: { id: existingProfessional.user.id },
          data: userData,
        });

        // Obtener el profesional actualizado con el usuario actualizado
        const finalProfessional = await this.prisma.professional.findUnique({
          where: { id },
          include: { user: true },
        });

        return {
          ...finalProfessional,
          especialidad: dto.specialties, // Usar specialties como especialidad
          tratamientos: dto.tratamientos || [],
          sucursal: dto.sucursal,
          horarios: dto.horarios,
        };
      }

      return {
        ...updatedProfessional,
        especialidad: dto.specialties, // Usar specialties como especialidad
        tratamientos: dto.tratamientos || [],
        sucursal: dto.sucursal,
        horarios: dto.horarios,
      };
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
