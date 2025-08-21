import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
  Matches,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AdminDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class CreateClinicaPendienteDto {
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

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'El color primario debe ser un color hex válido (#RRGGBB)' })
  color_primario?: string = '#3B82F6';

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'El color secundario debe ser un color hex válido (#RRGGBB)' })
  color_secundario?: string = '#1E40AF';

  @IsString()
  @IsOptional()
  plan?: string = 'basic';

  @ValidateNested()
  @Type(() => AdminDto)
  admin: AdminDto;

  @IsString()
  @IsOptional()
  estado?: string = 'inactiva';

  @IsBoolean()
  @IsOptional()
  pendiente_aprobacion?: boolean = true;

  @IsString()
  @IsOptional()
  fuente?: string = 'landing_page';
}
