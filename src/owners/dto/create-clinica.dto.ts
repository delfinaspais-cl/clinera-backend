import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEmail,
  MinLength,
  Matches,
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
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'La URL solo puede contener letras minúsculas, números y guiones' })
  url: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'El color primario debe ser un color hex válido (#RRGGBB)' })
  colorPrimario?: string = '#3B82F6';

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'El color secundario debe ser un color hex válido (#RRGGBB)' })
  colorSecundario?: string = '#1E40AF';

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  plan?: 'basic' | 'professional' | 'enterprise' = 'basic';

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
  estado?: string = 'activa';
}
