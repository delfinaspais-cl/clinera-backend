import { IsString, IsInt, IsUUID } from 'class-validator';

export class CreateScheduleDto {
  @IsUUID()
  professionalId: string;

  @IsString()
  dia: string;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;

  @IsInt()
  duracionMin: number;
}
