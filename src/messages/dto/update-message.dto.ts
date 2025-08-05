import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateMensajeDto {
  @IsOptional()
  @IsString()
  contenido?: string;

  @IsOptional()
  @IsBoolean()
  leido?: boolean;
}
