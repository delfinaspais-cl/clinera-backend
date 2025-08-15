import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EspecialidadesService {
  constructor(private prisma: PrismaService) {}

  async getEspecialidades(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    return this.prisma.especialidad.findMany({
      where: { clinicaId: clinica.id },
    });
  }

  async updateEspecialidades(clinicaUrl: string, especialidades: string[]) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    await this.prisma.especialidad.deleteMany({
      where: { clinicaId: clinica.id },
    });

    return this.prisma.especialidad.createMany({
      data: especialidades.map((name) => ({
        name,
        clinicaId: clinica.id,
      })),
    });
  }
}
