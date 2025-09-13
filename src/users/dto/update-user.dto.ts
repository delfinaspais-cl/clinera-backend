import { IsOptional, IsString, IsEmail, IsEnum } from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  SECRETARY = 'SECRETARY',
  PROFESSIONAL = 'PROFESSIONAL',
  PATIENT = 'PATIENT',
}

export enum UserEstado {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  PENDIENTE = 'pendiente',
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserEstado)
  estado?: UserEstado;

  @IsOptional()
  @IsString()
  configuracion?: string; // Para permisos personalizados
}
