import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsIn,
  IsString,
  IsOptional,
} from 'class-validator';

export class RegisterAuthDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(['ADMIN', 'PROFESSIONAL', 'PATIENT', 'OWNER'])
  role: string;

  @IsOptional()
  @IsString()
  clinicaId?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
