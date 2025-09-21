import { IsObject, IsOptional } from 'class-validator';

export class UpdateUsuarioDto {
  @IsObject()
  @IsOptional()
  permisos?: {
    puedeGestionarCitas?: boolean;
    puedeGestionarUsuarios?: boolean;
    puedeGestionarTurnos?: boolean;
    puedeGestionarPacientes?: boolean;
    puedeGestionarProfesionales?: boolean;
    puedeGestionarEspecialidades?: boolean;
    puedeGestionarSucursales?: boolean;
  };
}
