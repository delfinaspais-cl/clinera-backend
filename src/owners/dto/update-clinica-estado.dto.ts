import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateClinicaEstadoDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['activo', 'inactiva'], { message: 'El estado debe ser "activo" o "inactiva"' })
  estado: 'activo' | 'inactiva';
}
