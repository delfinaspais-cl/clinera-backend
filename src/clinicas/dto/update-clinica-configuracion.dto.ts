import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateClinicaConfiguracionDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  colorPrimario?: string;

  @IsOptional()
  @IsString()
  colorSecundario?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsObject()
  contacto?: {
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
  };
}
