import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  MinLength,
  IsEmail,
  Matches,
} from 'class-validator';

export class CreateUsuarioClinicaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre solo puede contener letras y espacios',
  })
  nombre: string;

  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'El rol es requerido' })
  @IsIn(['profesional', 'secretario', 'administrador'], {
    message: 'El rol debe ser: profesional, secretario o administrador',
  })
  rol: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'La especialidad debe tener al menos 2 caracteres' })
  especialidad?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;
}
