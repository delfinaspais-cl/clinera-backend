import { IsArray, IsString, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class AssignProfessionalsDto {
  @IsArray()
  @IsString({ each: true })
  professionalIds: string[];

  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  sessions?: number;
}
