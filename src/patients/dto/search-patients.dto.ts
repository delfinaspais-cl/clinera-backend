import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  IsEnum,
} from 'class-validator';

export class SearchPatientsDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimientoDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimientoHasta?: string;

  @IsOptional()
  @IsDateString()
  fechaCreacionDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaCreacionHasta?: string;

  @IsOptional()
  @IsEnum(['activo', 'inactivo'])
  estado?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'asc';
}
