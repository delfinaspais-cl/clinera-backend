import { IsEmail, IsNotEmpty, MinLength, IsIn } from 'class-validator';

export class RegisterAuthDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsIn(['ADMIN', 'RECEPCIONIST', 'PROFESSIONAL', 'PATIENT'])
  role: string;
}
