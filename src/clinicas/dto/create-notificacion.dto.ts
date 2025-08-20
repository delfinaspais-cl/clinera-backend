import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateNotificacionDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;

  @IsString()
  @IsNotEmpty()
  categoria: 'turno' | 'recordatorio' | 'sistema' | 'pago' | 'emergencia';

  @IsOptional()
  @IsString()
  usuarioId?: string;

  @IsOptional()
  @IsObject()
  datos?: Record<string, any>;
}
