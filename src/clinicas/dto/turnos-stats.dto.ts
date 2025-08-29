import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TurnosStatsDto {
  @ApiProperty({
    description: 'Período de estadísticas',
    enum: ['hoy', 'mes', 'semana', 'año', 'personalizado'],
    required: false,
    default: 'hoy'
  })
  @IsOptional()
  @IsString()
  @IsIn(['hoy', 'mes', 'semana', 'año', 'personalizado'])
  periodo?: string = 'hoy';

  @ApiProperty({
    description: 'Fecha de inicio para período personalizado (YYYY-MM-DD)',
    required: false
  })
  @IsOptional()
  @IsString()
  fechaInicio?: string;

  @ApiProperty({
    description: 'Fecha de fin para período personalizado (YYYY-MM-DD)',
    required: false
  })
  @IsOptional()
  @IsString()
  fechaFin?: string;

  @ApiProperty({
    description: 'Estado de pago para filtrar',
    enum: ['pagado', 'parcial', 'pendiente', 'sin_cargo'],
    required: false
  })
  @IsOptional()
  @IsString()
  @IsIn(['pagado', 'parcial', 'pendiente', 'sin_cargo'])
  estadoPago?: string;

  @ApiProperty({
    description: 'Profesional para filtrar',
    required: false
  })
  @IsOptional()
  @IsString()
  profesional?: string;

  @ApiProperty({
    description: 'Sucursal para filtrar',
    required: false
  })
  @IsOptional()
  @IsString()
  sucursal?: string;
}

export class TurnosStatsResponseDto {
  @ApiProperty({ description: 'Total de ventas del período' })
  totalVentas: number;

  @ApiProperty({ description: 'Cantidad total de turnos del período' })
  totalTurnos: number;

  @ApiProperty({ description: 'Cantidad de pacientes únicos del período' })
  totalPacientes: number;

  @ApiProperty({ description: 'Promedio de venta por turno' })
  promedioVentaPorTurno: number;

  @ApiProperty({ description: 'Turnos pagados' })
  turnosPagados: number;

  @ApiProperty({ description: 'Turnos pendientes' })
  turnosPendientes: number;

  @ApiProperty({ description: 'Turnos parciales' })
  turnosParciales: number;

  @ApiProperty({ description: 'Turnos sin cargo' })
  turnosSinCargo: number;

  @ApiProperty({ description: 'Ventas por estado de pago' })
  ventasPorEstado: {
    pagado: number;
    parcial: number;
    pendiente: number;
    sin_cargo: number;
  };

  @ApiProperty({ description: 'Ventas por medio de pago' })
  ventasPorMedioPago: {
    efectivo: number;
    tarjeta: number;
    transferencia: number;
    mercadopago: number;
    paypal: number;
    otro: number;
  };

  @ApiProperty({ description: 'Ventas por origen' })
  ventasPorOrigen: {
    instagram: number;
    organico: number;
    'google-ads': number;
    whatsapp: number;
  };

  @ApiProperty({ description: 'Período de la consulta' })
  periodo: {
    inicio: string;
    fin: string;
  };
}
