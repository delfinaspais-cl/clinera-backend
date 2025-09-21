import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSuscripcionDto {
  @ApiProperty({ description: 'ID de la clínica' })
  @IsString()
  clinicaId: string;

  @ApiProperty({ description: 'ID del plan' })
  @IsString()
  planId: string;

  @ApiPropertyOptional({ description: 'Método de pago' })
  @IsOptional()
  @IsString()
  metodoPago?: string;

  @ApiPropertyOptional({ description: 'ID del pago en sistema externo' })
  @IsOptional()
  @IsString()
  idPagoExterno?: string;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notas?: string;
}
