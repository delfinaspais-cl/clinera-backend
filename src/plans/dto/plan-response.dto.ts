import { ApiProperty } from '@nestjs/swagger';

export class PlanResponseDto {
  @ApiProperty({ description: 'ID del plan' })
  id: string;

  @ApiProperty({ description: 'Nombre del plan' })
  nombre: string;

  @ApiProperty({ description: 'Descripción del plan' })
  descripcion: string;

  @ApiProperty({ description: 'Precio del plan' })
  precio: number;

  @ApiProperty({ description: 'Moneda del plan' })
  moneda: string;

  @ApiProperty({ description: 'Intervalo de facturación' })
  intervalo: string;

  @ApiProperty({ description: 'Si el plan está activo' })
  activo: boolean;

  @ApiProperty({ description: 'Características del plan' })
  caracteristicas: string[];

  @ApiProperty({ description: 'Limitaciones del plan' })
  limitaciones: any;

  @ApiProperty({ description: 'Orden de visualización' })
  orden: number;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
}
