import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async turnosPorEstado(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    const estados = await this.prisma.turno.groupBy({
      by: ['estado'],
      where: { clinicaId: clinica.id },
      _count: true,
    });

    return estados;
  }

  async totalIngresos(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    // Obtener turnos con montoTotal real
    const turnos = await this.prisma.turno.findMany({
      where: {
        clinicaId: clinica.id,
        estado: 'confirmado',
        montoTotal: { not: null },
      },
      select: {
        montoTotal: true,
        estadoPago: true,
      },
    });

    // Calcular total real de ingresos
    const total = turnos.reduce((sum, turno) => {
      const monto = parseFloat(turno.montoTotal || '0');
      return sum + monto;
    }, 0);

    // Contar turnos pagados
    const turnosPagados = turnos.filter(turno => turno.estadoPago === 'pagado').length;

    return {
      total: total,
      moneda: 'ARS',
      descripcion: `Total real basado en ${turnosPagados} turnos pagados`,
      turnosPagados: turnosPagados,
      turnosTotales: turnos.length,
    };
  }

  async pacientesPorMes(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });
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

  // Métodos para exportación
  async getClinicaInfo(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
      select: { id: true, name: true },
    });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');
    return clinica;
  }

  async getTurnosForExport(
    clinicaUrl: string,
    filters: {
      fechaDesde?: string;
      fechaHasta?: string;
      estado?: string;
    },
  ) {
    const clinica = await this.getClinicaInfo(clinicaUrl);

    const where: any = { clinicaId: clinica.id };

    // Aplicar filtros
    if (filters.fechaDesde || filters.fechaHasta) {
      where.fecha = {};
      if (filters.fechaDesde) {
        where.fecha.gte = new Date(filters.fechaDesde);
      }
      if (filters.fechaHasta) {
        where.fecha.lte = new Date(filters.fechaHasta);
      }
    }

    if (filters.estado) {
      where.estado = filters.estado;
    }

    const turnos = await this.prisma.turno.findMany({
      where,
      orderBy: { fecha: 'desc' },
    });

    return turnos.map((turno) => ({
      paciente: turno.paciente,
      email: turno.email,
      telefono: turno.telefono,
      doctor: turno.doctor,
      especialidad: turno.especialidad,
      fecha: turno.fecha.toISOString().split('T')[0],
      hora: turno.hora,
      duracionMin: turno.duracionMin,
      estado: turno.estado,
      motivo: turno.motivo,
      notas: turno.notas,
      servicio: turno.servicio,
      montoTotal: turno.montoTotal,
      estadoPago: turno.estadoPago,
      medioPago: turno.medioPago,
      origen: turno.origen,
      ate: turno.ate,
      sucursal: turno.sucursal,
    }));
  }

  async getPacientesForExport(
    clinicaUrl: string,
    filters: {
      estado?: string;
    },
  ) {
    const clinica = await this.getClinicaInfo(clinicaUrl);

    const where: any = {
      user: {
        clinicaId: clinica.id,
        role: 'PATIENT',
      },
    };

    if (filters.estado) {
      where.user.estado = filters.estado;
    }

    const pacientes = await this.prisma.patient.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            location: true,
            estado: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return pacientes.map((paciente) => ({
      nombre: paciente.name,
      email: paciente.user.email,
      telefono: paciente.phone || paciente.user.phone,
      ubicacion: paciente.user.location,
      estado: paciente.user.estado,
      fechaNacimiento: paciente.birthDate
        ? paciente.birthDate.toISOString().split('T')[0]
        : null,
      notas: paciente.notes,
    }));
  }
}
