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
  @Matches(/^[a-zA-Z0-9-]+$/, { message: 'La URL solo puede contener letras, números y guiones' })
  url: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  // Campo adicional para la contraseña del usuario logueado (para login en Fluentia)
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña del usuario debe tener al menos 6 caracteres' })
  userPassword?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'El color primario debe ser un color hex válido (#RRGGBB)' })
  colorPrimario?: string = '#3B82F6';

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'El color secundario debe ser un color hex válido (#RRGGBB)' })
  colorSecundario?: string = '#1E40AF';

  // Campos adicionales que envía el frontend
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'El color primario debe ser un color hex válido (#RRGGBB)' })
  color_primario?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'El color secundario debe ser un color hex válido (#RRGGBB)' })
  color_secundario?: string;

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

  @IsString()
  @IsOptional()
  planId?: string;

  @IsOptional()
  horarios?: HorarioDto[] | string;

  @IsArray()
  @IsOptional()
  especialidades?: string[];

  @IsString()
  @IsOptional()
  estado?: string = 'activa';

  // Campo adicional para admin
  @IsOptional()
  admin?: {
    nombre: string;
    email: string;
  };
}
