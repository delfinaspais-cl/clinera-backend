import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ description: 'Nombre del plan' })
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Descripción del plan' })
  @IsString()
  descripcion: string;

  @ApiProperty({ description: 'Precio del plan' })
  @IsNumber()
  @Min(0)
  precio: number;

  @ApiPropertyOptional({ description: 'Moneda del plan', default: 'USD' })
  @IsOptional()
  @IsString()
  moneda?: string = 'USD';

  @ApiPropertyOptional({ description: 'Intervalo de facturación', default: 'monthly' })
  @IsOptional()
  @IsString()
  intervalo?: string = 'monthly';

  @ApiPropertyOptional({ description: 'Si el plan está activo', default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;

  @ApiPropertyOptional({ description: 'Características del plan' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  caracteristicas?: string[] = [];

  @ApiPropertyOptional({ description: 'Limitaciones del plan' })
  @IsOptional()
  @IsObject()
  limitaciones?: any;

  @ApiPropertyOptional({ description: 'Orden de visualización' })
  @IsOptional()
  @IsNumber()
  orden?: number = 0;
}
