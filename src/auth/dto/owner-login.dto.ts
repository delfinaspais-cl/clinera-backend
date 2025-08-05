import { IsString, IsNotEmpty } from 'class-validator';

export class OwnerLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
} 