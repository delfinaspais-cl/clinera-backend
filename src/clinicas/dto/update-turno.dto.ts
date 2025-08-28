import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEmail,
  Matches,
  MinLength,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsIn,
} from 'class-validator';
import { TurnoEstado } from './get-turnos-filters.dto';

export class UpdateTurnoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del paciente es requerido' })
  @MinLength(2, {
    message: 'El nombre del paciente debe tener al menos 2 caracteres',
  })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre del paciente solo puede contener letras y espacios',
  })
  paciente: string;

  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[\d\s\-\(\)]+$/, {
    message: 'El teléfono debe tener un formato válido',
  })
  telefono?: string;

  @IsString()
  @IsNotEmpty({ message: 'El profesional es requerido' })
  @MinLength(2, {
    message: 'El nombre del profesional debe tener al menos 2 caracteres',
  })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.]+$/, {
    message: 'El nombre del profesional solo puede contener letras, espacios y puntos',
  })
  profesional: string;

  @IsDateString(
    {},
    { message: 'La fecha debe tener un formato válido (YYYY-MM-DD)' },
  )
  @IsNotEmpty({ message: 'La fecha es requerida' })
  fecha: string;

  @IsString()
  @IsNotEmpty({ message: 'La hora es requerida' })
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'La hora debe tener formato HH:MM (24 horas)',
  })
  hora: string;

  @IsInt({ message: 'La duración debe ser un número entero' })
  @Min(15, { message: 'La duración mínima es 15 minutos' })
  @Max(480, { message: 'La duración máxima es 8 horas (480 minutos)' })
  @IsOptional()
  duracion?: number;

  @IsString()
  @IsOptional()
  @MinLength(10, { message: 'El motivo debe tener al menos 10 caracteres' })
  motivo?: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsString()
  @IsOptional()
  tratamiento?: string;

  @IsString()
  @IsOptional()
  professionalId?: string;

  @IsEnum(TurnoEstado, { message: 'Estado inválido' })
  @IsOptional()
  estado?: TurnoEstado;

  // Nuevos campos para datos de pago
  @IsString()
  @IsOptional()
  montoTotal?: string;

  @IsString()
  @IsOptional()
  @IsIn(['pagado', 'parcial', 'pendiente'], {
    message: 'El estado de pago debe ser: pagado, parcial o pendiente',
  })
  estadoPago?: string;

  @IsString()
  @IsOptional()
  @IsIn(['transferencia', 'efectivo', 'tarjeta'], {
    message: 'El medio de pago debe ser: transferencia, efectivo o tarjeta',
  })
  medioPago?: string;

  // Nuevos campos adicionales
  @IsString()
  @IsOptional()
  @IsIn(['instagram', 'organico', 'google-ads', 'whatsapp'], {
    message: 'El origen debe ser: instagram, organico, google-ads o whatsapp',
  })
  origen?: string;

  @IsString()
  @IsOptional()
  ate?: string;

  @IsString()
  @IsOptional()
  sucursal?: string;
}
