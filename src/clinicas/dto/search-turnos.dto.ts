import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsNumber,
} from 'class-validator';

export class SearchTurnosDto {
  @IsOptional()
  @IsString()
  paciente?: string;

  @IsOptional()
  @IsString()
  profesional?: string;

  @IsOptional()
  @IsString()
  especialidad?: string;

  @IsOptional()
  @IsEnum(['pendiente', 'confirmado', 'cancelado', 'completado'])
  estado?: string;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'fecha';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'asc';
}
