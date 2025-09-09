import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';

@ApiTags('Gestión de Sucursales')
@Controller('clinica/:clinicaUrl/sucursales')
export class SucursalesController {
  constructor(private readonly prisma: PrismaService) {}
  
  @Get()
  @ApiOperation({ summary: 'Obtener todas las sucursales de una clínica' })
  @ApiResponse({ status: 200, description: 'Lista de sucursales obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async getSucursales(@Param('clinicaUrl') clinicaUrl: string) {
    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Obtener sucursales de la base de datos
      const sucursales = await this.prisma.sucursal.findMany({
        where: { clinicaId: clinica.id },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: sucursales,
        message: 'Sucursales obtenidas exitosamente',
      };
    } catch (error) {
      console.error('Error obteniendo sucursales:', error);
      throw new BadRequestException('Error al obtener las sucursales');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva sucursal' })
  @ApiResponse({ status: 201, description: 'Sucursal creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async createSucursal(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() createSucursalDto: CreateSucursalDto,
  ) {
    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Crear la sucursal
      const sucursal = await this.prisma.sucursal.create({
        data: {
          nombre: createSucursalDto.nombre,
          direccion: createSucursalDto.direccion,
          telefono: createSucursalDto.telefono,
          email: createSucursalDto.email,
          ciudad: createSucursalDto.ciudad,
          provincia: createSucursalDto.provincia,
          pais: createSucursalDto.pais,
          clinicaId: clinica.id,
        },
      });

      return {
        success: true,
        data: sucursal,
        message: 'Sucursal creada exitosamente',
      };
    } catch (error) {
      console.error('Error creando sucursal:', error);
      throw new BadRequestException('Error al crear la sucursal');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una sucursal específica' })
  @ApiResponse({ status: 200, description: 'Sucursal obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  async getSucursalById(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
  ) {
    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Obtener la sucursal
      const sucursal = await this.prisma.sucursal.findFirst({
        where: {
          id: id,
          clinicaId: clinica.id,
        },
      });

      if (!sucursal) {
        throw new NotFoundException('Sucursal no encontrada');
      }

      return {
        success: true,
        data: sucursal,
        message: 'Sucursal obtenida exitosamente',
      };
    } catch (error) {
      console.error('Error obteniendo sucursal:', error);
      throw new BadRequestException('Error al obtener la sucursal');
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una sucursal' })
  @ApiResponse({ status: 200, description: 'Sucursal actualizada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  async updateSucursal(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() updateSucursalDto: UpdateSucursalDto,
  ) {
    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Verificar que la sucursal existe
      const existingSucursal = await this.prisma.sucursal.findFirst({
        where: {
          id: id,
          clinicaId: clinica.id,
        },
      });

      if (!existingSucursal) {
        throw new NotFoundException('Sucursal no encontrada');
      }

      // Actualizar la sucursal
      const sucursal = await this.prisma.sucursal.update({
        where: { id: id },
        data: updateSucursalDto,
      });

      return {
        success: true,
        data: sucursal,
        message: 'Sucursal actualizada exitosamente',
      };
    } catch (error) {
      console.error('Error actualizando sucursal:', error);
      throw new BadRequestException('Error al actualizar la sucursal');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una sucursal' })
  @ApiResponse({ status: 200, description: 'Sucursal eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  async deleteSucursal(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
  ) {
    try {
      // Verificar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        throw new NotFoundException('Clínica no encontrada');
      }

      // Verificar que la sucursal existe
      const existingSucursal = await this.prisma.sucursal.findFirst({
        where: {
          id: id,
          clinicaId: clinica.id,
        },
      });

      if (!existingSucursal) {
        throw new NotFoundException('Sucursal no encontrada');
      }

      // Eliminar la sucursal
      await this.prisma.sucursal.delete({
        where: { id: id },
      });

      return {
        success: true,
        message: 'Sucursal eliminada exitosamente',
      };
    } catch (error) {
      console.error('Error eliminando sucursal:', error);
      throw new BadRequestException('Error al eliminar la sucursal');
    }
  }
}
