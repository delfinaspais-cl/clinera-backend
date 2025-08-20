import { IsOptional, IsBoolean, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GetNotificacionesFiltersDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  leida?: boolean;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  usuarioId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;
}
