import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserLoginDto {
  @ApiProperty({
    description: 'Nombre de usuario o email',
    example: 'juan_perez',
  })
  @IsString({ message: 'El username/email debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El username/email es requerido' })
  username: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'miContraseña123',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}
