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
    const prof = await this.prisma.professional.findUnique({ where: { id } });
    if (!prof) throw new NotFoundException('Profesional no encontrado');

    return this.prisma.professional.update({
  where: { id },
  data: {
    specialties: dto.specialties,
    notes: dto.notes,
    defaultDurationMin: dto.defaultDurationMin,
    bufferMin: dto.bufferMin,
    user: {
      update: {
        name: dto.name,
        phone: dto.phone,
      },
    },
  },
  include: { user: true },
});

  }
}

