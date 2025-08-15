import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

class HorarioDto {
  @IsString()
  day: string;

  @IsString()
  openTime: string;

  @IsString()
  closeTime: string;
}

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

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioDto)
  horarios?: HorarioDto[];

  @IsArray()
  @IsOptional()
  especialidades?: string[];

  @IsString()
  @IsOptional()
  estado?: string;
}
