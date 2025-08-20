// src/professionals/dto/create-professional.dto.ts
import { IsArray, IsInt, IsOptional, IsString, IsEmail } from 'class-validator';

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
  @IsArray()
  specialties: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  defaultDurationMin?: number;

  @IsOptional()
  @IsInt()
  bufferMin?: number;
}
