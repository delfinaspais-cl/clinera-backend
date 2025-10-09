import { IsObject, IsOptional } from 'class-validator';
import { Permisos } from '../../common/types/permisos.types';

export class UpdateUsuarioDto {
  @IsObject()
  @IsOptional()
  permisos?: Permisos;
}
