import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMensajeDto } from './dto/create-message.dto';
import { UpdateMensajeDto } from './dto/update-message.dto';

@Injectable()
export class MensajesService {
  constructor(private prisma: PrismaService) {}

  async findAll(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    return this.prisma.mensaje.findMany({
      where: { clinicaId: clinica.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(clinicaUrl: string, dto: CreateMensajeDto) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');

    return this.prisma.mensaje.create({
      data: {
        asunto: dto.asunto,
        mensaje: dto.mensaje,
        tipo: dto.tipo,
        clinicaId: clinica.id,
      },
    });
  }

  async update(clinicaUrl: string, id: string, dto: UpdateMensajeDto) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new Error('Clínica no encontrada');
    }

    return this.prisma.mensaje.update({
      where: { id },
      data: dto,
    });
  }

  async remove(clinicaUrl: string, id: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new Error('Clínica no encontrada');
    }

    // Verificar que el mensaje pertenece a la clínica
    const mensaje = await this.prisma.mensaje.findFirst({
      where: {
        id,
        clinicaId: clinica.id,
      },
    });

    if (!mensaje) {
      throw new Error('Mensaje no encontrado en esta clínica');
    }

    await this.prisma.mensaje.delete({
      where: { id },
    });

    return { message: 'Mensaje eliminado correctamente' };
  }
}
