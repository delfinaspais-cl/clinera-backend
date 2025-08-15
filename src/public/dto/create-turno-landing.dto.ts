import { IsString, IsNotEmpty, IsEmail, IsDateString } from 'class-validator';

export class CreateTurnoLandingDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsNotEmpty()
  hora: string;

  @IsString()
  @IsNotEmpty()
  especialidad: string;

  @IsString()
  @IsNotEmpty()
  doctor: string;

  @IsString()
  @IsNotEmpty()
  motivo: string;
}
