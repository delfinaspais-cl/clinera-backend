import { IsString, IsEmail, IsEnum, IsOptional, IsArray, MinLength } from 'class-validator';

export enum UserRole {
  ADMINISTRADOR = 'ADMIN',
  SECRETARIO = 'SECRETARY', 
  PROFESIONAL = 'PROFESSIONAL'
}

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  tipo: UserRole;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}