import { IsString } from 'class-validator';

export class CreateMensajeDto {
  @IsString()
  contenido: string;
}
