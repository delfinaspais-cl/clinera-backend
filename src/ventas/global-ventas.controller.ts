import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';

@ApiTags('Ventas Globales')
@Controller('ventas')
export class GlobalVentasController {
  constructor(private readonly prisma: PrismaService) {}

  // Generar ID personalizado para la venta
  private generateVentaId(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return `V${timestamp}-${randomSuffix}`;
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva venta' })
  @ApiResponse({ status: 201, description: 'Venta creada exitosamente' })
  async create(@Body() createVentaDto: any) {
    try {
      // Validar que la clínica existe
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: createVentaDto.clinicaId },
      });

      if (!clinica) {
        throw new BadRequestException('Clínica no encontrada');
      }

      // Generar ID personalizado
      const ventaId = this.generateVentaId();

      // Crear la venta con todos los campos del frontend
      const venta = await this.prisma.venta.create({
        data: {
          ventaId,
          comprador: createVentaDto.comprador,
          paciente: createVentaDto.paciente,
          email: createVentaDto.email,
          telefono: createVentaDto.telefono,
          tratamiento: createVentaDto.tratamiento,
          profesional: createVentaDto.profesional,
          profesionalId: createVentaDto.profesionalId || '',
          sucursal: createVentaDto.sucursal,
          montoTotal: createVentaDto.montoTotal,
          montoAbonado: createVentaDto.montoAbonado,
          montoPendiente: createVentaDto.montoPendiente,
          estado: createVentaDto.estado || 'activa',
          estadoPago: createVentaDto.estadoPago || 'pendiente',
          medioPago: createVentaDto.medioPago,
          origen: createVentaDto.origen,
          ate: createVentaDto.ate,
          sesiones: createVentaDto.sesiones || 1,
          sesionesUsadas: createVentaDto.sesionesUsadas || 0,
          fechaCreacion: new Date(),
          fechaVencimiento: createVentaDto.fechaVencimiento 
            ? new Date(createVentaDto.fechaVencimiento) 
            : null,
          notas: createVentaDto.notas || '',
          clinicaId: createVentaDto.clinicaId,
        },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
      });

      return {
        success: true,
        data: venta,
        message: 'Nueva venta guardada exitosamente',
      };
    } catch (error) {
      console.error('Error creando venta:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la venta');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las ventas' })
  @ApiResponse({ status: 200, description: 'Lista de ventas obtenida exitosamente' })
  @ApiQuery({ name: 'clinicaId', required: false, description: 'Filtrar por clínica' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'estadoPago', required: false, description: 'Filtrar por estado de pago' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findAll(
    @Query('clinicaId') clinicaId?: string,
    @Query('estado') estado?: string,
    @Query('estadoPago') estadoPago?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const where: any = {};
      if (clinicaId) where.clinicaId = clinicaId;
      if (estado) where.estado = estado;
      if (estadoPago) where.estadoPago = estadoPago;

      const ventas = await this.prisma.venta.findMany({
        where,
        take: limitNum,
        skip: offsetNum,
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
        orderBy: {
          fechaCreacion: 'desc',
        },
      });

      return {
        success: true,
        data: ventas,
        message: 'Ventas obtenidas exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.venta.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo ventas:', error);
      throw new BadRequestException('Error al obtener las ventas');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener venta específica' })
  @ApiResponse({ status: 200, description: 'Venta obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async findOne(@Param('id') id: string) {
    try {
      const venta = await this.prisma.venta.findUnique({
        where: { id },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
      });

      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }

      return {
        success: true,
        data: venta,
        message: 'Venta obtenida exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo venta:', error);
      throw new BadRequestException('Error al obtener la venta');
    }
  }

  @Get('venta-id/:ventaId')
  @ApiOperation({ summary: 'Obtener venta por ventaId personalizado' })
  @ApiResponse({ status: 200, description: 'Venta obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async findByVentaId(@Param('ventaId') ventaId: string) {
    try {
      const venta = await this.prisma.venta.findUnique({
        where: { ventaId },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
      });

      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }

      return {
        success: true,
        data: venta,
        message: 'Venta obtenida exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error obteniendo venta:', error);
      throw new BadRequestException('Error al obtener la venta');
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar venta' })
  @ApiResponse({ status: 200, description: 'Venta actualizada exitosamente' })
  async update(@Param('id') id: string, @Body() updateVentaDto: any) {
    try {
      const venta = await this.prisma.venta.findUnique({
        where: { id },
      });

      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }

      // Preparar datos para actualización
      const updateData: any = { ...updateVentaDto };
      
      // Convertir fecha de vencimiento si se proporciona
      if (updateVentaDto.fechaVencimiento) {
        updateData.fechaVencimiento = new Date(updateVentaDto.fechaVencimiento);
      }

      const updatedVenta = await this.prisma.venta.update({
        where: { id },
        data: updateData,
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
      });

      return {
        success: true,
        data: updatedVenta,
        message: 'Venta actualizada exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error actualizando venta:', error);
      throw new BadRequestException('Error al actualizar la venta');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar venta' })
  @ApiResponse({ status: 200, description: 'Venta eliminada exitosamente' })
  async remove(@Param('id') id: string) {
    try {
      const venta = await this.prisma.venta.findUnique({
        where: { id },
      });

      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }

      await this.prisma.venta.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Venta eliminada exitosamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error eliminando venta:', error);
      throw new BadRequestException('Error al eliminar la venta');
    }
  }

  @Get('clinica/:clinicaId')
  @ApiOperation({ summary: 'Obtener ventas de una clínica específica' })
  @ApiResponse({ status: 200, description: 'Ventas de la clínica obtenidas exitosamente' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'estadoPago', required: false, description: 'Filtrar por estado de pago' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findByClinica(
    @Param('clinicaId') clinicaId: string,
    @Query('estado') estado?: string,
    @Query('estadoPago') estadoPago?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const where: any = { clinicaId };
      if (estado) where.estado = estado;
      if (estadoPago) where.estadoPago = estadoPago;

      const ventas = await this.prisma.venta.findMany({
        where,
        take: limitNum,
        skip: offsetNum,
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
        orderBy: {
          fechaCreacion: 'desc',
        },
      });

      return {
        success: true,
        data: ventas,
        message: 'Ventas de la clínica obtenidas exitosamente',
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: await this.prisma.venta.count({ where }),
        },
      };
    } catch (error) {
      console.error('Error obteniendo ventas de la clínica:', error);
      throw new BadRequestException('Error al obtener las ventas de la clínica');
    }
  }

  @Get('stats/:clinicaId')
  @ApiOperation({ summary: 'Obtener estadísticas de ventas de una clínica' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async getStats(@Param('clinicaId') clinicaId: string) {
    try {
      const totalVentas = await this.prisma.venta.count({
        where: { clinicaId },
      });

      const ventasActivas = await this.prisma.venta.count({
        where: { clinicaId, estado: 'activa' },
      });

      const ventasPagadas = await this.prisma.venta.count({
        where: { clinicaId, estadoPago: 'pagado' },
      });

      const ventasParciales = await this.prisma.venta.count({
        where: { clinicaId, estadoPago: 'parcial' },
      });

      const ventasPendientes = await this.prisma.venta.count({
        where: { clinicaId, estadoPago: 'pendiente' },
      });

      // Calcular totales monetarios
      const ventasData = await this.prisma.venta.findMany({
        where: { clinicaId },
        select: {
          montoTotal: true,
          montoAbonado: true,
          montoPendiente: true,
        },
      });

      const totalMonto = ventasData.reduce((sum, venta) => {
        return sum + parseFloat(venta.montoTotal || '0');
      }, 0);

      const totalAbonado = ventasData.reduce((sum, venta) => {
        return sum + parseFloat(venta.montoAbonado || '0');
      }, 0);

      const totalPendiente = ventasData.reduce((sum, venta) => {
        return sum + parseFloat(venta.montoPendiente || '0');
      }, 0);

      return {
        success: true,
        data: {
          totalVentas,
          ventasActivas,
          ventasPagadas,
          ventasParciales,
          ventasPendientes,
          totalMonto: totalMonto.toFixed(2),
          totalAbonado: totalAbonado.toFixed(2),
          totalPendiente: totalPendiente.toFixed(2),
        },
        message: 'Estadísticas de ventas obtenidas exitosamente',
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de ventas:', error);
      throw new BadRequestException('Error al obtener las estadísticas de ventas');
    }
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Descargar PDF de una venta específica' })
  @ApiResponse({ status: 200, description: 'PDF generado y descargado exitosamente' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async downloadPDF(@Param('id') id: string, @Res() res: Response) {
    try {
      // Obtener la venta
      const venta = await this.prisma.venta.findUnique({
        where: { id },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
              email: true,
              phone: true,
              address: true,
            },
          },
          medioPagoRel: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
            },
          },
        },
      });

      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }

      // Crear documento PDF
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
      });

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=venta-${venta.ventaId}.pdf`);

      // Pipe el PDF al response
      doc.pipe(res);

      // Configurar fuentes y colores
      const primaryColor = '#3B82F6';
      const secondaryColor = '#1E40AF';
      const textColor = '#374151';
      const lightGray = '#F3F4F6';

      // HEADER - Logo y datos de la clínica
      doc.fontSize(24)
         .fillColor(primaryColor)
         .text(venta.clinica.name.toUpperCase(), { align: 'center' })
         .moveDown(0.3);

      doc.fontSize(10)
         .fillColor(textColor)
         .text(venta.clinica.address || 'Dirección no disponible', { align: 'center' })
         .text(`Tel: ${venta.clinica.phone || 'No disponible'} | Email: ${venta.clinica.email || 'No disponible'}`, { align: 'center' })
         .moveDown(1);

      // Línea separadora
      doc.moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .strokeColor(primaryColor)
         .lineWidth(2)
         .stroke()
         .moveDown(1);

      // TÍTULO DEL DOCUMENTO
      doc.fontSize(20)
         .fillColor(secondaryColor)
         .text('DETALLE DE VENTA', { align: 'center' })
         .moveDown(0.5);

      // ID de venta
      doc.fontSize(12)
         .fillColor(textColor)
         .text(`ID: ${venta.ventaId}`, { align: 'center' })
         .moveDown(1.5);

      // SECCIÓN: INFORMACIÓN GENERAL
      const startY = doc.y;
      
      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('INFORMACIÓN GENERAL', 50, startY)
         .moveDown(0.8);

      // Cuadro con fondo gris claro
      const infoBoxY = doc.y;
      doc.rect(50, infoBoxY, 495, 140)
         .fillAndStroke(lightGray, textColor);

      // Contenido del cuadro
      doc.fontSize(11)
         .fillColor(textColor);

      let yPos = infoBoxY + 15;
      const leftColumn = 70;
      const rightColumn = 320;
      
      // Columna izquierda
      doc.font('Helvetica-Bold').text('Fecha de Creación:', leftColumn, yPos);
      doc.font('Helvetica').text(new Date(venta.fechaCreacion).toLocaleDateString('es-ES', { 
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      }), leftColumn + 120, yPos);

      yPos += 25;
      doc.font('Helvetica-Bold').text('Comprador:', leftColumn, yPos);
      doc.font('Helvetica').text(venta.comprador, leftColumn + 120, yPos);

      yPos += 25;
      doc.font('Helvetica-Bold').text('Paciente:', leftColumn, yPos);
      doc.font('Helvetica').text(venta.paciente, leftColumn + 120, yPos);

      yPos += 25;
      doc.font('Helvetica-Bold').text('Email:', leftColumn, yPos);
      doc.font('Helvetica').text(venta.email, leftColumn + 120, yPos, { width: 200 });

      yPos += 25;
      doc.font('Helvetica-Bold').text('Teléfono:', leftColumn, yPos);
      doc.font('Helvetica').text(venta.telefono, leftColumn + 120, yPos);

      // Columna derecha
      yPos = infoBoxY + 15;
      
      doc.font('Helvetica-Bold').text('Profesional:', rightColumn, yPos);
      doc.font('Helvetica').text(venta.profesional, rightColumn + 90, yPos, { width: 150 });

      yPos += 25;
      doc.font('Helvetica-Bold').text('Sucursal:', rightColumn, yPos);
      doc.font('Helvetica').text(venta.sucursal, rightColumn + 90, yPos);

      yPos += 25;
      doc.font('Helvetica-Bold').text('Estado:', rightColumn, yPos);
      doc.font('Helvetica').text(venta.estado.toUpperCase(), rightColumn + 90, yPos);

      yPos += 25;
      doc.font('Helvetica-Bold').text('Origen:', rightColumn, yPos);
      doc.font('Helvetica').text(venta.origen || 'No especificado', rightColumn + 90, yPos);

      doc.y = infoBoxY + 150;
      doc.moveDown(1.5);

      // SECCIÓN: TRATAMIENTO Y SESIONES
      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('TRATAMIENTO Y SESIONES', 50)
         .moveDown(0.8);

      const tratamientoBoxY = doc.y;
      doc.rect(50, tratamientoBoxY, 495, 70)
         .fillAndStroke(lightGray, textColor);

      yPos = tratamientoBoxY + 15;
      
      doc.fontSize(11)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text('Tratamiento:', leftColumn, yPos);
      doc.font('Helvetica').text(venta.tratamiento, leftColumn + 120, yPos, { width: 350 });

      yPos += 25;
      doc.font('Helvetica-Bold').text('Sesiones:', leftColumn, yPos);
      doc.font('Helvetica').text(`${venta.sesionesUsadas} / ${venta.sesiones}`, leftColumn + 120, yPos);

      if (venta.fechaVencimiento) {
        yPos += 25;
        doc.font('Helvetica-Bold').text('Fecha de Vencimiento:', leftColumn, yPos);
        doc.font('Helvetica').text(new Date(venta.fechaVencimiento).toLocaleDateString('es-ES'), leftColumn + 120, yPos);
      }

      doc.y = tratamientoBoxY + 80;
      doc.moveDown(1.5);

      // SECCIÓN: DETALLES FINANCIEROS
      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('DETALLES FINANCIEROS', 50)
         .moveDown(0.8);

      const financialBoxY = doc.y;
      doc.rect(50, financialBoxY, 495, 120)
         .fillAndStroke(lightGray, textColor);

      yPos = financialBoxY + 15;
      
      doc.fontSize(11)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text('Monto Total:', leftColumn, yPos);
      doc.font('Helvetica')
         .fontSize(13)
         .text(`$${parseFloat(venta.montoTotal).toFixed(2)}`, leftColumn + 120, yPos);

      yPos += 30;
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('Monto Abonado:', leftColumn, yPos);
      doc.font('Helvetica')
         .fillColor('#10B981')
         .fontSize(13)
         .text(`$${parseFloat(venta.montoAbonado).toFixed(2)}`, leftColumn + 120, yPos);

      yPos += 30;
      doc.fontSize(11)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text('Monto Pendiente:', leftColumn, yPos);
      doc.font('Helvetica')
         .fillColor('#EF4444')
         .fontSize(13)
         .text(`$${parseFloat(venta.montoPendiente).toFixed(2)}`, leftColumn + 120, yPos);

      yPos = financialBoxY + 15;
      doc.fontSize(11)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text('Estado de Pago:', rightColumn, yPos);
      
      const estadoPagoColors: Record<string, string> = {
        'pagado': '#10B981',
        'parcial': '#F59E0B',
        'pendiente': '#EF4444',
      };
      
      doc.font('Helvetica')
         .fillColor(estadoPagoColors[venta.estadoPago] || textColor)
         .text(venta.estadoPago.toUpperCase(), rightColumn + 120, yPos);

      yPos += 30;
      doc.fontSize(11)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text('Medio de Pago:', rightColumn, yPos);
      doc.font('Helvetica').text(venta.medioPagoRel?.nombre || venta.medioPago || 'No especificado', rightColumn + 120, yPos);

      if (venta.ate) {
        yPos += 30;
        doc.font('Helvetica-Bold').text('ATE:', rightColumn, yPos);
        doc.font('Helvetica').text(venta.ate, rightColumn + 120, yPos);
      }

      doc.y = financialBoxY + 130;
      doc.moveDown(1.5);

      // SECCIÓN: NOTAS (si existen)
      if (venta.notas) {
        doc.fontSize(14)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text('NOTAS ADICIONALES', 50)
           .moveDown(0.8);

        const notasBoxY = doc.y;
        doc.rect(50, notasBoxY, 495, 60)
           .fillAndStroke(lightGray, textColor);

        doc.fontSize(10)
           .fillColor(textColor)
           .font('Helvetica')
           .text(venta.notas, 70, notasBoxY + 15, { width: 455, align: 'justify' });

        doc.y = notasBoxY + 70;
        doc.moveDown(1);
      }

      // FOOTER
      doc.fontSize(8)
         .fillColor('#9CA3AF')
         .text(
           `Documento generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );

      // Finalizar el documento
      doc.end();

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error generando PDF de venta:', error);
      throw new BadRequestException('Error al generar el PDF de la venta');
    }
  }
}
