import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('Pagos')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('turno/:turnoId/details')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalles de pago de un turno' })
  @ApiResponse({ status: 200, description: 'Detalles de pago obtenidos exitosamente' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  async getTurnoPaymentDetails(@Param('turnoId') turnoId: string) {
    try {
      const details = await this.paymentsService.getTurnoPaymentDetails(turnoId);
      return {
        success: true,
        data: details,
        message: 'Detalles de pago obtenidos exitosamente',
      };
    } catch (error) {
      if (error.message === 'Turno no encontrado') {
        throw new NotFoundException('Turno no encontrado');
      }
      console.error('Error obteniendo detalles de pago:', error);
      throw new BadRequestException('Error al obtener los detalles de pago');
    }
  }

  @Patch('turno/:turnoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar montos de pago de un turno' })
  @ApiResponse({ status: 200, description: 'Montos de pago actualizados exitosamente' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  async updateTurnoPayment(
    @Param('turnoId') turnoId: string,
    @Body() paymentUpdateDto: {
      montoAbonado?: number;
      montoPendiente?: number;
      estadoPago?: string;
      medioPago?: string;
    },
  ) {
    try {
      const updatedPayment = await this.paymentsService.updateTurnoPayment(
        turnoId,
        paymentUpdateDto,
      );
      return {
        success: true,
        data: updatedPayment,
        message: 'Montos de pago actualizados exitosamente',
      };
    } catch (error) {
      if (error.message === 'Turno no encontrado') {
        throw new NotFoundException('Turno no encontrado');
      }
      console.error('Error actualizando montos de pago:', error);
      throw new BadRequestException('Error al actualizar los montos de pago');
    }
  }

  @Get('invoice/:clinicaUrl/:turnoId/payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener pagos de una factura/turno' })
  @ApiResponse({ status: 200, description: 'Pagos obtenidos exitosamente' })
  async getInvoicePayments(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('turnoId') turnoId: string,
  ) {
    try {
      const payments = await this.paymentsService.getInvoicePayments(clinicaUrl, turnoId);
      return {
        success: true,
        data: payments,
        message: 'Pagos obtenidos exitosamente',
      };
    } catch (error) {
      console.error('Error obteniendo pagos de factura:', error);
      throw new BadRequestException('Error al obtener los pagos de la factura');
    }
  }
}
