import { IsArray, IsString } from 'class-validator';

export class UpdateEspecialidadesDto {
  @IsArray()
  @IsString({ each: true })
  especialidades: string[];
}
