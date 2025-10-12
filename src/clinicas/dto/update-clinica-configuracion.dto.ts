import { IsString, IsOptional, IsObject, IsIn, IsBoolean, IsArray, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

class TestimonialDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  foto?: string;

  @IsString()
  texto: string;

  @IsOptional()
  @IsString()
  cargo?: string;
}

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
  titulo?: string;

  @IsOptional()
  @IsString()
  subtitulo?: string;

  @IsOptional()
  @IsString()
  comentariosHTML?: string;

  @IsOptional()
  @IsString()
  @IsIn(['es', 'pt-BR', 'en'], { message: 'El idioma debe ser: es (Español), pt-BR (Portugués) o en (Inglés)' })
  defaultLanguage?: string;

  @IsOptional()
  @IsString()
  @IsIn(['USD', 'BRL', 'PEN', 'ARS', 'CLP', 'COP', 'MXN'], { 
    message: 'El código de moneda debe ser: USD, BRL, PEN, ARS, CLP, COP, o MXN' 
  })
  currencyCode?: string;

  @IsOptional()
  @IsObject()
  contacto?: {
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
  };

  @IsOptional()
  @IsString()
  pixel_id?: string;

  @IsOptional()
  @IsString()
  gtm_id?: string;

  @IsOptional()
  @IsString()
  ga_id?: string;

  @IsOptional()
  @IsUrl({}, { message: 'video_url debe ser una URL válida' })
  video_url?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestimonialDto)
  testimonials?: TestimonialDto[];

  @IsOptional()
  @IsString()
  consentimiento_informado?: string;

  // Toggles para mostrar/ocultar secciones
  @IsOptional()
  @IsBoolean()
  showTreatments?: boolean;

  @IsOptional()
  @IsBoolean()
  showTestimonials?: boolean;

  @IsOptional()
  @IsBoolean()
  showProfessionals?: boolean;

  @IsOptional()
  @IsBoolean()
  showSchedule?: boolean;

  @IsOptional()
  @IsBoolean()
  showSpecialties?: boolean;

  @IsOptional()
  @IsBoolean()
  showGallery?: boolean;

  @IsOptional()
  @IsBoolean()
  showVideo?: boolean;

  @IsOptional()
  @IsBoolean()
  showContactForm?: boolean;

  @IsOptional()
  @IsBoolean()
  showLocation?: boolean;
}
