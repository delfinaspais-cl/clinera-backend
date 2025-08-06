import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateTurnoDto {
  @IsString()
  @IsNotEmpty()
  paciente: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsNotEmpty()
  especialidad: string;

  @IsString()
  @IsNotEmpty()
  doctor: string;

  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsNotEmpty()
  hora: string;

  @IsString()
  @IsOptional()
  motivo?: string;
}