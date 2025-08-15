import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateUsuarioEstadoDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['activo', 'inactivo'])
  estado: string;
}
