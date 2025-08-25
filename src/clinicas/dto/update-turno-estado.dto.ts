import { IsString, IsIn } from 'class-validator';

export class UpdateTurnoEstadoDto {
  @IsString()
  @IsIn(['confirmado', 'pendiente', 'cancelado', 'completado'])
  estado: string;
}
