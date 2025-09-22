import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'Formato de email inválido' })
  @IsNotEmpty({ message: 'Email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Código de verificación de 6 dígitos',
    example: '123456',
  })
  @IsString({ message: 'Código debe ser una cadena' })
  @IsNotEmpty({ message: 'Código es requerido' })
  @Length(6, 6, { message: 'Código debe tener exactamente 6 dígitos' })
  code: string;
}
