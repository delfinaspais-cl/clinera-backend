import {
  IsEmail,
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  MinLength,
} from 'class-validator';

export class CreateProfessionalDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsArray()
  @IsOptional()
  specialties?: string[];

  @IsNumber()
  @IsOptional()
  defaultDurationMin?: number;

  @IsNumber()
  @IsOptional()
  bufferMin?: number;
}
