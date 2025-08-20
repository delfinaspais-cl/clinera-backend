import { IsString, IsEmail, IsOptional, IsIn, MinLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateContactoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  telefono?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  empresa?: string;

  @IsString()
  @IsNotEmpty({ message: 'El tipo de consulta es requerido' })
  @IsIn(['contratacion', 'demo', 'precios', 'soporte', 'personalizacion', 'otro'], {
    message: 'El tipo de consulta debe ser uno de: contratacion, demo, precios, soporte, personalizacion, otro'
  })
  tipoConsulta: 'contratacion' | 'demo' | 'precios' | 'soporte' | 'personalizacion' | 'otro';

  @IsOptional()
  @IsString()
  @IsIn(['basico', 'profesional', 'empresarial', 'personalizado'], {
    message: 'El plan debe ser uno de: basico, profesional, empresarial, personalizado'
  })
  plan?: 'basico' | 'profesional' | 'empresarial' | 'personalizado';

  @IsString()
  @IsNotEmpty({ message: 'El mensaje es requerido' })
  @MinLength(10, { message: 'El mensaje debe tener al menos 10 caracteres' })
  @Transform(({ value }) => value?.trim())
  mensaje: string;
}
