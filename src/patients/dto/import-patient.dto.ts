import { IsString, IsOptional, IsEmail, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para una fila de paciente en el CSV
 * Acepta múltiples nombres de columna para flexibilidad (nombre/name, RUT/DNI/documento, etc.)
 */
export class ImportPatientDto {
  @ApiProperty({ description: 'Nombre completo del paciente', required: true })
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Email del paciente (opcional pero recomendado)', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Teléfono del paciente', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Fecha de nacimiento (formato: YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ description: 'Documento de identidad (DNI/RUT/CURP/Pasaporte)', required: false })
  @IsOptional()
  @IsString()
  documento?: string;

  @ApiProperty({ description: 'Número de cliente interno', required: false })
  @IsOptional()
  @IsString()
  clientNumber?: string;

  @ApiProperty({ description: 'Dirección', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Ciudad', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Provincia/Región/Estado', required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ description: 'País', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Género (Masculino/Femenino/Otro)', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ description: 'Condiciones preexistentes', required: false })
  @IsOptional()
  @IsString()
  preExistingConditions?: string;

  @ApiProperty({ description: 'Notas adicionales', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

