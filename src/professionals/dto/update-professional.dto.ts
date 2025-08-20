// src/professionals/dto/update-professional.dto.ts
import { IsArray, IsInt, IsOptional, IsString, IsEmail } from 'class-validator';

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
}
