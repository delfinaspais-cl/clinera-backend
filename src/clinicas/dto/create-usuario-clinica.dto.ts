import { IsString, IsNotEmpty, IsOptional, IsIn, MinLength } from 'class-validator';

export class CreateUsuarioClinicaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['profesional', 'secretario', 'administrador'])
  rol: string;

  @IsString()
  @IsOptional()
  especialidad?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
} 