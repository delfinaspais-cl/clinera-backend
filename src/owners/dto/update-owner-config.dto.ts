import { IsString, IsEmail, IsOptional, IsObject, IsBoolean, IsNumber, IsIn, MinLength, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateOwnerConfigDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  telefono?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  facebook?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  instagram?: string;

  @IsOptional()
  @IsUrl({}, { message: 'La URL del website debe ser válida' })
  @Transform(({ value }) => value?.trim())
  website?: string;

  @IsOptional()
  @IsUrl({}, { message: 'La URL del avatar debe ser válida' })
  @Transform(({ value }) => value?.trim())
  avatar_url?: string;

  @IsOptional()
  @IsObject()
  configuracion?: {
    notifications?: {
      email?: boolean;
      push?: boolean;
      whatsapp?: boolean;
    };
    security?: {
      twoFactor?: boolean;
      sessionTimeout?: number;
    };
    appearance?: {
      theme?: 'light' | 'dark' | 'auto';
      language?: string;
    };
  };
}
