import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HorariosService {
  constructor(private prisma: PrismaService) {}

  async getHorarios(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    return this.prisma.horario.findMany({
      where: { clinicaId: clinica.id },
    });
  }

  async updateHorarios(clinicaUrl: string, horarios: any[]) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    await this.prisma.horario.deleteMany({
      where: { clinicaId: clinica.id },
    });

    return this.prisma.horario.createMany({
      data: horarios.map((h) => ({
        day: h.day,
        openTime: h.openTime,
        closeTime: h.closeTime,
        clinicaId: clinica.id,
      })),
    });
  }
}
