import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMensajeDto } from './dto/create-message.dto';
import { UpdateMensajeDto } from './dto/update-message.dto';

@Injectable()
export class MensajesService {
  constructor(private prisma: PrismaService) {}

  async findAll(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({ where: { url: clinicaUrl } });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    return this.prisma.mensaje.findMany({
      where: { clinicaId: clinica.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(clinicaUrl: string, dto: CreateMensajeDto) {
    const clinica = await this.prisma.clinica.findUnique({ where: { url: clinicaUrl } });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    return this.prisma.mensaje.create({
      data: {
        contenido: dto.contenido,
        clinicaId: clinica.id,
      },
    });
  }

  async update(clinicaUrl: string, id: string, dto: UpdateMensajeDto) {
    const mensaje = await this.prisma.mensaje.findUnique({ where: { id } });
    if (!mensaje) throw new NotFoundException('Mensaje no encontrado');

    return this.prisma.mensaje.update({
      where: { id },
      data: dto,
    });
  }
}
