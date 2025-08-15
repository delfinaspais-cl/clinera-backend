import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async findAll(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    const professionals = await this.prisma.professional.findMany({
      where: { user: { clinicaId: clinica.id } },
      include: { agendas: true },
    });

    return professionals.map((p) => ({
      professionalId: p.id,
      name: p.name,
      schedules: p.agendas,
    }));
  }

  async findByProfessional(clinicaUrl: string, professionalId: string) {
    const prof = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      include: { agendas: true },
    });
    if (!prof) throw new NotFoundException('Profesional no encontrado');

    return prof.agendas;
  }

  async create(clinicaUrl: string, dto: CreateScheduleDto) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new Error('Clínica no encontrada');
    }

    return this.prisma.agenda.create({ data: dto });
  }

  async remove(clinicaUrl: string, id: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new Error('Clínica no encontrada');
    }

    // Verificar que la agenda pertenece a un profesional de la clínica
    const agenda = await this.prisma.agenda.findFirst({
      where: {
        id,
        professional: {
          user: {
            clinicaId: clinica.id,
          },
        },
      },
    });

    if (!agenda) {
      throw new Error('Agenda no encontrada en esta clínica');
    }

    await this.prisma.agenda.delete({
      where: { id },
    });

    return { message: 'Agenda eliminada correctamente' };
  }
}
