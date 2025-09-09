import { IsString, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSucursalDto {
  @ApiProperty({
    description: 'Nombre de la sucursal',
    example: 'Sucursal Centro',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Dirección de la sucursal',
    example: 'Av. Principal 123, Centro',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La dirección no puede exceder 200 caracteres' })
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de la sucursal',
    example: '+54 9 11 1234-5678',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Email de la sucursal',
    example: 'sucursal@clinica.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Ciudad de la sucursal',
    example: 'Buenos Aires',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La ciudad no puede exceder 100 caracteres' })
  ciudad?: string;

  @ApiPropertyOptional({
    description: 'Provincia de la sucursal',
    example: 'CABA',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La provincia no puede exceder 100 caracteres' })
  provincia?: string;

  @ApiPropertyOptional({
    description: 'País de la sucursal',
    example: 'Argentina',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'El país no puede exceder 100 caracteres' })
  pais?: string;
}
