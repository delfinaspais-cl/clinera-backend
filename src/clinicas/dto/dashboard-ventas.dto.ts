import { ApiProperty } from '@nestjs/swagger';

export class DashboardVentasResponseDto {
  @ApiProperty({ description: 'Cantidad de turnos del día de hoy' })
  turnosHoy: number;

  @ApiProperty({ description: 'Cantidad de turnos del mes actual' })
  turnosMes: number;

  @ApiProperty({ description: 'Monto total de todas las ventas pagadas' })
  totalVentasPagadas: number;

  @ApiProperty({ description: 'Cantidad de pacientes únicos' })
  totalPacientes: number;

  @ApiProperty({ description: 'Ventas de hoy' })
  ventasHoy: number;

  @ApiProperty({ description: 'Ventas del mes' })
  ventasMes: number;
}
