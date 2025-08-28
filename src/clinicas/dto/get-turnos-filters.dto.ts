import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum TurnoEstado {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  CANCELADO = 'cancelado',
  COMPLETADO = 'completado',
}

export class GetTurnosFiltersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TurnoEstado)
  estado?: TurnoEstado;

  @IsOptional()
  doctor?: string;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  paciente?: string;

  @IsOptional()
  email?: string;
}
