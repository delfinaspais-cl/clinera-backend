import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class SendMensajeDto {
  @IsString()
  @IsNotEmpty()
  asunto: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['pago', 'soporte', 'general'])
  tipo: string;
} 