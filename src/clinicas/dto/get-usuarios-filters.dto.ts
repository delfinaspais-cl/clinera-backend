import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum UserRole {
  PATIENT = 'PATIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  ADMIN = 'ADMIN',
  SECRETARY = 'SECRETARY',
}

export enum UserEstado {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

export class GetUsuariosFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserEstado)
  estado?: UserEstado;

  @IsOptional()
  especialidad?: string;
}
