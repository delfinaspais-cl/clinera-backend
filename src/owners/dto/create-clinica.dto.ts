import { IsString, IsNotEmpty, IsOptional, IsArray, IsUrl } from 'class-validator';

export class CreateClinicaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  colorPrimario?: string;

  @IsString()
  @IsOptional()
  colorSecundario?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  horarios?: string;

  @IsArray()
  @IsOptional()
  especialidades?: string[];
} 