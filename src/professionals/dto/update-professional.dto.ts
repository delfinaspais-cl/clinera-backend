// src/professionals/dto/update-professional.dto.ts
import { IsArray, IsInt, IsOptional, IsString, IsEmail, IsObject } from 'class-validator';

export class UpdateProfessionalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  especialidad?: string[]; // Array de especialidades

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tratamientos?: string[]; // Array de tratamientos

  @IsOptional()
  @IsString()
  sucursal?: string; // ID de la sucursal seleccionada

  @IsOptional()
  @IsArray()
  specialties?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  defaultDurationMin?: number;

  @IsOptional()
  @IsInt()
  bufferMin?: number;

  // Horarios de atención
  @IsOptional()
  @IsObject()
  horarios?: {
    dias: string[]; // Array de días seleccionados: ["Lunes", "Martes", etc.]
    horaInicio?: string; // "08:00"
    horaFin?: string; // "18:00"
  };
}
