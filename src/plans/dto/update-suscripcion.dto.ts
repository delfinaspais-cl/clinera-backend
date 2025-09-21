import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSuscripcionDto {
  @ApiPropertyOptional({ description: 'Estado de la suscripción' })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin de la suscripción' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

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
