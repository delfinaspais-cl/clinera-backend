import { IsString, IsOptional, IsObject, IsIn } from 'class-validator';

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
  @IsString()
  @IsIn(['es', 'pt-BR', 'en'], { message: 'El idioma debe ser: es (Español), pt-BR (Portugués) o en (Inglés)' })
  defaultLanguage?: string;

  @IsOptional()
  @IsObject()
  contacto?: {
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
  };
}
