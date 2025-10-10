import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateClinicaEstadoDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['activa', 'inactiva'], { message: 'El estado debe ser "activa" o "inactiva"' })
  estado: 'activa' | 'inactiva';
}
