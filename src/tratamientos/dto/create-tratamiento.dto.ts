import { IsString, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateTratamientoDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  duracionPorSesion: number; // Duración de cada sesión en minutos

  @IsNumber()
  @IsPositive()
  cantidadSesiones: number; // Cantidad total de sesiones del tratamiento
}
