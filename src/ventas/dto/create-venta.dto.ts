import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreateVentaDto {
  @ApiProperty({ description: 'Nombre del comprador' })
  @IsString()
  comprador: string;

  @ApiProperty({ description: 'Nombre del paciente' })
  @IsString()
  paciente: string;

  @ApiProperty({ description: 'Email del comprador' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Teléfono del comprador' })
  @IsString()
  telefono: string;

  @ApiProperty({ description: 'Tratamiento vendido' })
  @IsString()
  tratamiento: string;

  @ApiProperty({ description: 'Nombre del profesional' })
  @IsString()
  profesional: string;

  @ApiProperty({ description: 'ID del profesional (opcional)' })
  @IsOptional()
  @IsString()
  profesionalId?: string;

  @ApiProperty({ description: 'Sucursal donde se realizó la venta' })
  @IsString()
  sucursal: string;

  @ApiProperty({ description: 'Monto total de la venta' })
  @IsString()
  montoTotal: string;

  @ApiProperty({ description: 'Monto abonado' })
  @IsString()
  montoAbonado: string;

  @ApiProperty({ description: 'Monto pendiente' })
  @IsString()
  montoPendiente: string;

  @ApiProperty({ description: 'Estado de la venta', enum: ['activa', 'cancelada', 'completada'] })
  @IsEnum(['activa', 'cancelada', 'completada'])
  @IsOptional()
  estado?: string;

  @ApiProperty({ description: 'Estado del pago', enum: ['pendiente', 'parcial', 'pagado'] })
  @IsEnum(['pendiente', 'parcial', 'pagado'])
  @IsOptional()
  estadoPago?: string;

  @ApiProperty({ description: 'Medio de pago utilizado' })
  @IsOptional()
  @IsString()
  medioPago?: string;

  @ApiProperty({ description: 'Origen de la venta (ej: instagram, facebook, etc.)' })
  @IsOptional()
  @IsString()
  origen?: string;

  @ApiProperty({ description: 'ATE (Asistente Técnico de Ejecución)' })
  @IsOptional()
  @IsString()
  ate?: string;

  @ApiProperty({ description: 'Número de sesiones incluidas' })
  @IsNumber()
  @IsOptional()
  sesiones?: number;

  @ApiProperty({ description: 'Sesiones ya utilizadas' })
  @IsNumber()
  @IsOptional()
  sesionesUsadas?: number;

  @ApiProperty({ description: 'Fecha de vencimiento de la venta' })
  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @ApiProperty({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notas?: string;

  @ApiProperty({ description: 'ID de la clínica' })
  @IsString()
  clinicaId: string;
}
