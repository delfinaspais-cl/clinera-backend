import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async turnosPorEstado(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({ where: { url: clinicaUrl } });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    const estados = await this.prisma.turno.groupBy({
      by: ['estado'],
      where: { clinicaId: clinica.id },
      _count: true,
    });

    return estados;
  }

  async totalIngresos(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({ where: { url: clinicaUrl } });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    // Simulación de ingresos: 10.000 por turno confirmado
    const count = await this.prisma.turno.count({
      where: {
        clinicaId: clinica.id,
        estado: 'confirmado',
      },
    });

    return {
      total: count * 10000,
      moneda: 'ARS',
      descripcion: 'Simulación basada en turnos confirmados',
    };
  }

  async pacientesPorMes(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({ where: { url: clinicaUrl } });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    const pacientes = await this.prisma.patient.findMany({
      where: {
        user: {
          clinicaId: clinica.id,
        },
      },
      select: {
        createdAt: true,
      },
    });

    const conteo: Record<string, number> = {};

    pacientes.forEach((p) => {
      const key = `${p.createdAt.getFullYear()}-${(p.createdAt.getMonth() + 1).toString().padStart(2, '0')}`;
      conteo[key] = (conteo[key] || 0) + 1;
    });

    return conteo;
  }
}
