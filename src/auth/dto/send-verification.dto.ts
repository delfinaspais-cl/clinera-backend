import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendVerificationDto {
  @ApiProperty({
    description: 'Email del usuario a verificar',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'Formato de email inválido' })
  @IsNotEmpty({ message: 'Email es requerido' })
  email: string;
}
