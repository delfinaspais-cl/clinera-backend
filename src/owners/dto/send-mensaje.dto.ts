import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

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

  @IsString()
  @IsOptional()
  clinicaId?: string;
} 