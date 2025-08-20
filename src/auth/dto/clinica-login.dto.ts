import { IsString, IsNotEmpty } from 'class-validator';

export class ClinicaLoginDto {
  @IsString()
  @IsNotEmpty()
  clinicaUrl: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
