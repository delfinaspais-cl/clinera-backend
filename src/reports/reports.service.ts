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
      email: paciente.email,
      telefono: paciente.phone,
      ubicacion: null, // Ya no hay ubicación en pacientes
      estado: 'activo', // Los pacientes siempre están activos
      fechaNacimiento: paciente.birthDate
        ? paciente.birthDate.toISOString().split('T')[0]
        : null,
      notas: paciente.notes,
    }));
  }

  // Método para obtener datos de ventas para exportación
  async getVentasForExport(
    clinicaUrl: string,
    filters: {
      fechaDesde?: string;
      fechaHasta?: string;
      estado?: string;
      paciente?: string;
      profesional?: string;
      sucursal?: string;
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

    if (filters.estado && filters.estado !== 'Todos') {
      where.estado = filters.estado;
    }

    if (filters.paciente) {
      where.paciente = {
        contains: filters.paciente,
        mode: 'insensitive',
      };
    }

    if (filters.profesional) {
      where.doctor = {
        contains: filters.profesional,
        mode: 'insensitive',
      };
    }

    if (filters.sucursal) {
      where.sucursal = filters.sucursal;
    }

    const ventas = await this.prisma.turno.findMany({
      where,
      orderBy: { fecha: 'desc' },
      select: {
        id: true,
        fecha: true,
        paciente: true,
        doctor: true,
        sucursal: true,
        servicio: true,
        montoTotal: true,
        estado: true,
        medioPago: true,
        origen: true,
        notas: true,
        hora: true,
        duracionMin: true,
        estadoPago: true,
      },
    });

    return ventas.map((venta) => ({
      fecha: venta.fecha.toISOString().split('T')[0],
      paciente: venta.paciente || 'N/A',
      profesional: venta.doctor || 'N/A',
      sucursal: venta.sucursal || 'N/A',
      tratamiento: venta.servicio || 'Sin especialidad',
      montoTotal: venta.montoTotal ? `$${venta.montoTotal}` : 'N/A',
      estado: venta.estado || 'N/A',
      medioPago: venta.medioPago || 'N/A',
      origen: venta.origen || 'N/A',
      notas: venta.notas || 'N/A',
      hora: venta.hora || 'N/A',
      duracionMin: venta.duracionMin || 'N/A',
      estadoPago: venta.estadoPago || 'N/A',
    }));
  }

  // Método para obtener estadísticas de ventas
  async getVentasStats(clinicaUrl: string) {
    const clinica = await this.getClinicaInfo(clinicaUrl);
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Ventas de hoy
    const ventasHoy = await this.prisma.turno.count({
      where: {
        clinicaId: clinica.id,
        fecha: {
          gte: startOfDay,
        },
      },
    });

    // Ventas del mes
    const ventasMes = await this.prisma.turno.count({
      where: {
        clinicaId: clinica.id,
        fecha: {
          gte: startOfMonth,
        },
      },
    });

    // Total de ventas pagadas
    const turnosPagados = await this.prisma.turno.findMany({
      where: {
        clinicaId: clinica.id,
        estadoPago: 'pagado',
        montoTotal: { not: null },
      },
      select: {
        montoTotal: true,
      },
    });

    // Calcular total sumando los montos
    const totalVentas = turnosPagados.reduce((sum, turno) => {
      const monto = parseFloat(turno.montoTotal || '0');
      return sum + monto;
    }, 0);

    // Pacientes únicos
    const pacientesUnicos = await this.prisma.turno.groupBy({
      by: ['paciente'],
      where: {
        clinicaId: clinica.id,
        paciente: {
          not: '',
        },
      },
      _count: true,
    });

    return {
      ventasHoy,
      ventasMes,
      totalVentas,
      pacientesUnicos: pacientesUnicos.length,
    };
  }
}
