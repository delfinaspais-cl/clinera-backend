import { IsArray, IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class AssignProfessionalsDto {
  @IsArray()
  @IsString({ each: true })
  professionalIds: string[];

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  duracionPorSesion?: number; // Duración de cada sesión en minutos

  @IsNumber()
  @IsPositive()
  @IsOptional()
  cantidadSesiones?: number; // Cantidad total de sesiones del tratamiento
}
