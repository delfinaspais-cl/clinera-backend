import { IsOptional, IsString } from 'class-validator';

export class GetTurnosFiltersDto {
  @IsOptional()
  @IsString()
  fecha?: string; // formato: YYYY-MM-DD

  @IsOptional()
  @IsString()
  estado?: string; // pendiente | confirmado | cancelado

  @IsOptional()
  @IsString()
  especialidad?: string;
}