// src/professionals/dto/create-professional.dto.ts
import { IsArray, IsInt, IsOptional, IsString, IsEmail, IsObject } from 'class-validator';

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
  @IsString()
  especialidad: string; // Campo de texto libre para especialidad

  @IsOptional()
  @IsString()
  tratamientos?: string; // Campo de texto libre para tratamientos

  @IsOptional()
  @IsString()
  sucursal?: string; // ID de la sucursal seleccionada

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
