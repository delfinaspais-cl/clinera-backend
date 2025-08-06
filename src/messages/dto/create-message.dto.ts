import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreateMensajeDto {
  @IsString()
  @IsNotEmpty()
  asunto: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;

  @IsString()
  @IsIn(['pago', 'soporte', 'general'])
  tipo: string;
}