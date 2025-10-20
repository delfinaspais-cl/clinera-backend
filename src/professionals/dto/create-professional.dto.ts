// src/professionals/dto/create-professional.dto.ts
import { IsArray, IsInt, IsOptional, IsString, IsEmail, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class HorarioDiaDto {
  @IsString()
  dia: string; // "LUNES", "MARTES", etc.

  @IsString()
  horaInicio: string; // "09:00"

  @IsString()
  horaFin: string; // "17:00"
}

class HorarioRangoDto {
  @IsString()
  dia: string; // "LUNES", "MARTES", etc.

  @IsString()
  horaInicio: string; // "09:00"

  @IsString()
  horaFin: string; // "12:00"
}

class HorarioMultiRangoDto {
  @IsString()
  dia: string; // "LUNES", "MARTES", etc.

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioRangoDto)
  rangos: HorarioRangoDto[]; // Array de rangos horarios para el mismo día
}

export class ProfessionalSucursalDto {
  @IsString()
  sucursalId: string;

  @IsOptional()
  @IsString()
  fechaInicio?: string;

  @IsOptional()
  @IsString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioDiaDto)
  horariosDetallados?: HorarioDiaDto[]; // Horarios específicos para esta sucursal
}

export class CreateProfessionalDto {
  // Campos para User
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  // Campos para Professional
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[]; // Array de especialidades (como envía el frontend)

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tratamientos?: string[]; // Array de tratamientos

  @IsOptional()
  @IsString()
  sucursal?: string; // ID de la sucursal seleccionada (compatibilidad hacia atrás)

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfessionalSucursalDto)
  sucursales?: ProfessionalSucursalDto[]; // Nueva funcionalidad: múltiples sucursales

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  defaultDurationMin?: number;

  @IsOptional()
  @IsInt()
  bufferMin?: number;

  // Horarios de atención - Formato simple (para compatibilidad)
  @IsOptional()
  @IsObject()
  horarios?: {
    dias: string[]; // Array de días seleccionados: ["Lunes", "Martes", etc.]
    horaInicio?: string; // "08:00"
    horaFin?: string; // "18:00"
  };

  // Horarios de atención - Formato avanzado (horarios específicos por día)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioDiaDto)
  horariosDetallados?: HorarioDiaDto[];

  // Horarios de atención - Formato multi-rango (múltiples rangos por día)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioMultiRangoDto)
  horariosMultiRango?: HorarioMultiRangoDto[];
}
