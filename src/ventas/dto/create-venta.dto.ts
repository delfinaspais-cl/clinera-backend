import { ApiProperty } from '@nestjs/swagger';

export class VentaTratamientoDto {
  @ApiProperty({ description: 'ID del tratamiento' })
  tratamientoId: string;

  @ApiProperty({ description: 'Cantidad de tratamientos vendidos', default: 1 })
  cantidad?: number;

  @ApiProperty({ description: 'Precio unitario del tratamiento' })
  precioUnitario?: number;

  @ApiProperty({ description: 'Precio total para este tratamiento' })
  precioTotal?: number;

  @ApiProperty({ description: 'Sesiones incluidas para este tratamiento', default: 1 })
  sesionesIncluidas?: number;

  @ApiProperty({ description: 'Sesiones ya utilizadas para este tratamiento', default: 0 })
  sesionesUsadas?: number;

  @ApiProperty({ description: 'Notas específicas para este tratamiento' })
  notas?: string;
}

export class CreateVentaDto {
  @ApiProperty({ description: 'Nombre del comprador' })
  comprador: string;

  @ApiProperty({ description: 'Nombre del paciente' })
  paciente: string;

  @ApiProperty({ description: 'Email del comprador' })
  email: string;

  @ApiProperty({ description: 'Teléfono del comprador' })
  telefono: string;

  @ApiProperty({ description: 'Tratamiento vendido (compatibilidad hacia atrás)' })
  tratamiento: string;

  @ApiProperty({ 
    description: 'Lista de tratamientos asociados a la venta (nueva funcionalidad)', 
    type: [VentaTratamientoDto],
    required: false 
  })
  tratamientos?: VentaTratamientoDto[];

  @ApiProperty({ description: 'Nombre del profesional' })
  profesional: string;

  @ApiProperty({ description: 'ID del profesional (opcional)' })
  profesionalId?: string;

  @ApiProperty({ description: 'Sucursal donde se realizó la venta' })
  sucursal: string;

  @ApiProperty({ description: 'Monto total de la venta' })
  montoTotal: string;

  @ApiProperty({ description: 'Monto abonado' })
  montoAbonado: string;

  @ApiProperty({ description: 'Monto pendiente' })
  montoPendiente: string;

  @ApiProperty({ description: 'Estado de la venta', enum: ['activa', 'cancelada', 'completada'] })
  estado?: string;

  @ApiProperty({ description: 'Estado del pago', enum: ['pendiente', 'parcial', 'pagado'] })
  estadoPago?: string;

  @ApiProperty({ description: 'Medio de pago utilizado (texto libre)' })
  medioPago?: string;

  @ApiProperty({ description: 'ID del medio de pago (relación con tabla medios de pago)' })
  medioPagoId?: string;

  @ApiProperty({ description: 'Origen de la venta (ej: instagram, facebook, etc.)' })
  origen?: string;

  @ApiProperty({ description: 'ATE (Asistente Técnico de Ejecución)' })
  ate?: string;

  @ApiProperty({ description: 'Número de sesiones incluidas' })
  sesiones?: number;

  @ApiProperty({ description: 'Sesiones ya utilizadas' })
  sesionesUsadas?: number;

  @ApiProperty({ description: 'Fecha de vencimiento de la venta' })
  fechaVencimiento?: string;

  @ApiProperty({ description: 'Notas adicionales' })
  notas?: string;

  @ApiProperty({ description: 'ID de la clínica' })
  clinicaId: string;
}
