import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateMensajeDto {
  @IsOptional()
  @IsString()
  mensaje?: string;

  @IsOptional()
  @IsBoolean()
  leido?: boolean;
}
