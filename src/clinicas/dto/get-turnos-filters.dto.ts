import { IsOptional, IsString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetTurnosFiltersDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  especialidad?: string;
} 