import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';
import { AssignProfessionalsDto } from './dto/assign-professionals.dto';

@Injectable()
export class TratamientosService {
  constructor(private prisma: PrismaService) {}

  async createTratamiento(clinicaUrl: string, createTratamientoDto: CreateTratamientoDto) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    return this.prisma.tratamiento.create({
      data: {
        name: createTratamientoDto.name,
        descripcion: createTratamientoDto.description,
        duracionPorSesion: createTratamientoDto.duracionPorSesion,
        cantidadSesiones: createTratamientoDto.cantidadSesiones,
        precio: createTratamientoDto.price,
        clinicaId: clinica.id,
        allowSobreturno: createTratamientoDto.allowSobreturno,
        allowVideocall: createTratamientoDto.allowVideocall,
        showInLanding: createTratamientoDto.showInLanding,
      },
      include: {
        profesionales: {
          include: {
            professional: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findAllTratamientos(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    return this.prisma.tratamiento.findMany({
      where: { 
        clinicaId: clinica.id,
        estado: 'activo'
      },
      include: {
        profesionales: {
          include: {
            professional: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findTratamientoById(clinicaUrl: string, id: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const tratamiento = await this.prisma.tratamiento.findFirst({
      where: { 
        id,
        clinicaId: clinica.id 
      },
      include: {
        profesionales: {
          include: {
            professional: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tratamiento) {
      throw new NotFoundException('Tratamiento no encontrado');
    }

    return tratamiento;
  }

  async updateTratamiento(clinicaUrl: string, id: string, updateTratamientoDto: UpdateTratamientoDto) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const tratamiento = await this.prisma.tratamiento.findFirst({
      where: { 
        id,
        clinicaId: clinica.id 
      },
    });

    if (!tratamiento) {
      throw new NotFoundException('Tratamiento no encontrado');
    }

    const updateData: any = {};
    
    if (updateTratamientoDto.name !== undefined) {
      updateData.name = updateTratamientoDto.name;
    }
    
    if (updateTratamientoDto.description !== undefined) {
      updateData.descripcion = updateTratamientoDto.description;
    }
    
    if (updateTratamientoDto.duracionPorSesion !== undefined) {
      updateData.duracionPorSesion = updateTratamientoDto.duracionPorSesion;
    }
    
    if (updateTratamientoDto.cantidadSesiones !== undefined) {
      updateData.cantidadSesiones = updateTratamientoDto.cantidadSesiones;
    }
    
    if (updateTratamientoDto.price !== undefined) {
      updateData.precio = updateTratamientoDto.price;
    }
    
    if (updateTratamientoDto.allowSobreturno !== undefined) {
      updateData.allowSobreturno = updateTratamientoDto.allowSobreturno;
    }

    if (updateTratamientoDto.allowVideocall !== undefined) {
      updateData.allowVideocall = updateTratamientoDto.allowVideocall;
    }

    if (updateTratamientoDto.showInLanding !== undefined) {
      updateData.showInLanding = updateTratamientoDto.showInLanding;
    }

    return this.prisma.tratamiento.update({
      where: { id },
      data: updateData,
      include: {
        profesionales: {
          include: {
            professional: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async removeTratamiento(clinicaUrl: string, id: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const tratamiento = await this.prisma.tratamiento.findFirst({
      where: { 
        id,
        clinicaId: clinica.id 
      },
    });

    if (!tratamiento) {
      throw new NotFoundException('Tratamiento no encontrado');
    }

    // Soft delete - cambiar estado a inactivo
    return this.prisma.tratamiento.update({
      where: { id },
      data: { estado: 'inactivo' },
    });
  }

  async assignProfessionals(clinicaUrl: string, id: string, assignProfessionalsDto: AssignProfessionalsDto) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const tratamiento = await this.prisma.tratamiento.findFirst({
      where: { 
        id,
        clinicaId: clinica.id 
      },
    });

    if (!tratamiento) {
      throw new NotFoundException('Tratamiento no encontrado');
    }

    // Eliminar asignaciones existentes
    await this.prisma.professionalTratamiento.deleteMany({
      where: { tratamientoId: id },
    });

    // Crear nuevas asignaciones
    if (assignProfessionalsDto.professionalIds.length > 0) {
      const assignments = assignProfessionalsDto.professionalIds.map(professionalId => ({
        professionalId,
        tratamientoId: id,
        precio: assignProfessionalsDto.price,
        duracionMin: assignProfessionalsDto.duracionPorSesion || 30,
      }));

      await this.prisma.professionalTratamiento.createMany({
        data: assignments,
      });
    }

    return this.findTratamientoById(clinicaUrl, id);
  }

  async getAvailableProfessionals(clinicaUrl: string) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    return this.prisma.professional.findMany({
      where: { 
        user: {
          clinicaId: clinica.id
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        especialidades: {
          include: {
            especialidad: true,
          },
        },
      },
    });
  }
}
