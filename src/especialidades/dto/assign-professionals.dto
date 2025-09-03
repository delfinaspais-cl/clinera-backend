import { IsArray, IsString } from 'class-validator';

export class AssignProfessionalsDto {
  @IsArray()
  @IsString({ each: true })
  professionalIds: string[];
}
