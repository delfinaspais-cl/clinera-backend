import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsEmail,
  Matches,
  MinLength,
  IsHexColor,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

class HorarioDto {
  @IsString({ message: 'El día es requerido' })
  @Matches(/^(LUNES|MARTES|MIERCOLES|JUEVES|VIERNES|SABADO|DOMINGO)$/, {
    message:
      'El día debe ser: LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO o DOMINGO',
  })
  day: string;

  @IsString({ message: 'La hora de apertura es requerida' })
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'La hora debe tener formato HH:MM (24 horas)',
  })
  openTime: string;

  @IsString({ message: 'La hora de cierre es requerida' })
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'La hora debe tener formato HH:MM (24 horas)',
  })
  closeTime: string;
}

export class UpdateClinicaDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\d\-\.]+$/, {
    message:
      'El nombre solo puede contener letras, números, espacios, guiones y puntos',
  })
  nombre?: string;

  // Alias para compatibilidad con frontend
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\d\-\.]+$/, {
    message:
      'El nombre solo puede contener letras, números, espacios, guiones y puntos',
  })
  name?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  direccion?: string;

  // Alias para compatibilidad con frontend
  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  telefono?: string;

  // Alias para compatibilidad con frontend
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email?: string;

  @IsOptional()
  @IsHexColor({
    message: 'El color primario debe ser un color hexadecimal válido',
  })
  colorPrimario?: string;

  @IsOptional()
  @IsHexColor({
    message: 'El color secundario debe ser un color hexadecimal válido',
  })
  colorSecundario?: string;

  @IsOptional()
  @IsArray({ message: 'Las especialidades deben ser un array' })
  @IsString({
    each: true,
    message: 'Cada especialidad debe ser una cadena de texto',
  })
  @MinLength(2, {
    each: true,
    message: 'Cada especialidad debe tener al menos 2 caracteres',
  })
  especialidades?: string[];

  @IsOptional()
  @IsArray({ message: 'Los horarios deben ser un array' })
  @ValidateNested({ each: true, message: 'Cada horario debe ser válido' })
  @Type(() => HorarioDto)
  horarios?: HorarioDto[];

  @IsOptional()
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @Matches(/^(activa|inactiva)$/, {
    message: 'El estado debe ser "activa" o "inactiva"',
  })
  estado?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  descripcion?: string;

  @IsOptional()
  @IsString({ message: 'El título debe ser una cadena de texto' })
  titulo?: string;

  @IsOptional()
  @IsString({ message: 'El subtítulo debe ser una cadena de texto' })
  subtitulo?: string;

  @IsOptional()
  @IsString({ message: 'Los comentarios HTML deben ser una cadena de texto' })
  comentariosHTML?: string;

  @IsOptional()
  @IsString({ message: 'El código de moneda debe ser una cadena de texto' })
  @IsIn(['USD', 'BRL', 'PEN', 'ARS', 'CLP', 'COP', 'MXN'], { 
    message: 'El código de moneda debe ser: USD, BRL, PEN, ARS, CLP, COP, o MXN' 
  })
  currencyCode?: string;
}
