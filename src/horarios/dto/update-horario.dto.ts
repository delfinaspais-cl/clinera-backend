import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class HorarioItemDto {
  @IsString()
  day: string;

  @IsString()
  openTime: string;

  @IsString()
  closeTime: string;
}

export class UpdateHorariosDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioItemDto)
  horarios: HorarioItemDto[];
}
