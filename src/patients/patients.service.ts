import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-client.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientsService {
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

    return this.prisma.patient.findMany({
      where: {
        user: { clinicaId: clinica.id },
      },
      include: { user: true },
    });
  }

  async create(clinicaUrl: string, dto: CreatePatientDto) {
  const clinica = await this.prisma.clinica.findUnique({
    where: { url: clinicaUrl },
  });
  if (!clinica) throw new NotFoundException('Clínica no encontrada');

  const hashedPassword = await bcrypt.hash(dto.password, 10); // 👈 encriptar

  const user = await this.prisma.user.create({
    data: {
      email: dto.email,
      password: hashedPassword,
      role: 'PATIENT',
      name: dto.name,
      phone: dto.phone,
      clinicaId: clinica.id,
    },
  });

  return this.prisma.patient.create({
    data: {
      name: dto.name,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      phone: dto.phone,
      notes: dto.notes,
      userId: user.id,
    },
    include: { user: true },
  });
}

  async findOne(clinicaUrl: string, id: string) {
    const paciente = await this.prisma.patient.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!paciente) throw new NotFoundException('Paciente no encontrado');

    // Opcional: validar que pertenezca a la clínica
    return paciente;
  }

  async update(clinicaUrl: string, id: string, dto: UpdatePatientDto) {
    const paciente = await this.prisma.patient.findUnique({ where: { id } });
    if (!paciente) throw new NotFoundException('Paciente no encontrado');

    return this.prisma.patient.update({
      where: { id },
      data: dto,
      include: { user: true },
    });
  }
}
