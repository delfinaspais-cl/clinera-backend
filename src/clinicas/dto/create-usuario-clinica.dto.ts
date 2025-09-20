import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  MinLength,
  IsEmail,
  Matches,
  ValidateIf,
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
  @ValidateIf((o) => !o.tipo) // Solo validar si no hay tipo
  @IsNotEmpty({ message: 'El rol es requerido si no se proporciona tipo' })
  @IsIn(['profesional', 'secretario', 'administrador', 'ADMIN', 'PROFESSIONAL', 'SECRETARY'], {
    message: 'El rol debe ser: profesional, secretario o administrador',
  })
  rol?: string;

  @IsString()
  @ValidateIf((o) => !o.rol) // Solo validar si no hay rol
  @IsNotEmpty({ message: 'El tipo es requerido si no se proporciona rol' })
  @IsIn(['profesional', 'secretario', 'administrador', 'ADMIN', 'PROFESSIONAL', 'SECRETARY'], {
    message: 'El tipo debe ser: profesional, secretario o administrador',
  })
  tipo?: string;

  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'La especialidad debe tener al menos 2 caracteres' })
  especialidad?: string;

  // Password siempre se genera automáticamente - no se acepta del frontend
}
