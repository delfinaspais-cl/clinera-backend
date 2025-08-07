import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEmail, Matches, MinLength } from 'class-validator';

export class CreateTurnoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del paciente es requerido' })
  @MinLength(2, { message: 'El nombre del paciente debe tener al menos 2 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { 
    message: 'El nombre del paciente solo puede contener letras y espacios' 
  })
  paciente: string;

  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[\d\s\-\(\)]+$/, { 
    message: 'El teléfono debe tener un formato válido' 
  })
  telefono?: string;

  @IsString()
  @IsNotEmpty({ message: 'La especialidad es requerida' })
  @MinLength(2, { message: 'La especialidad debe tener al menos 2 caracteres' })
  especialidad: string;

  @IsString()
  @IsNotEmpty({ message: 'El doctor es requerido' })
  @MinLength(2, { message: 'El nombre del doctor debe tener al menos 2 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { 
    message: 'El nombre del doctor solo puede contener letras y espacios' 
  })
  doctor: string;

  @IsDateString({}, { message: 'La fecha debe tener un formato válido (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  fecha: string;

  @IsString()
  @IsNotEmpty({ message: 'La hora es requerida' })
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'La hora debe tener formato HH:MM (24 horas)' 
  })
  hora: string;

  @IsString()
  @IsOptional()
  @MinLength(10, { message: 'El motivo debe tener al menos 10 caracteres' })
  motivo?: string;
}