import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEspecialidadDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
