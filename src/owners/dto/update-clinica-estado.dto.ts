import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateClinicaEstadoDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['activa', 'inactiva'])
  estado: string;
}
