import { IsOptional, IsString, IsEmail, IsEnum, IsObject } from 'class-validator';

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

export interface Permisos {
  puedeGestionarCitas: boolean;
  puedeGestionarVentas: boolean;
  puedeGestionarPacientes: boolean;
  puedeGestionarProfesionales: boolean;
  puedeGestionarUsuarios: boolean;
  puedeGestionarTratamientosYEspecialidades: boolean;
  puedeGestionarSucursales: boolean;
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
  @IsObject()
  permisos?: Permisos; // Para permisos personalizados
}
