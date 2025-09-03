import { IsArray, IsString, IsNumber, IsPositive } from 'class-validator';

export class AssignProfessionalsDto {
  @IsArray()
  @IsString({ each: true })
  professionalIds: string[];

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  sessions: number;
}
