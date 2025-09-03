import { IsString, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateTratamientoDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  sessions: number;
}
