import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async findAll(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({ where: { url: clinicaUrl } });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    const professionals = await this.prisma.professional.findMany({
      where: { user: { clinicaId: clinica.id } },
      include: { agendas: true },
    });

    return professionals.map(p => ({
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
    const prof = await this.prisma.professional.findUnique({ where: { id: dto.professionalId } });
    if (!prof) throw new NotFoundException('Profesional no encontrado');

    return this.prisma.agenda.create({ data: dto });
  }
}
