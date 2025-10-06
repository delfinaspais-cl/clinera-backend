import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserLanguageDto {
  @ApiProperty({
    description: 'Idioma preferido del usuario (es, pt-BR, en)',
    enum: ['es', 'pt-BR', 'en'],
    example: 'es',
  })
  @IsString()
  @IsIn(['es', 'pt-BR', 'en'], { message: 'El idioma debe ser: es (Español), pt-BR (Portugués) o en (Inglés)' })
  preferredLanguage: string;
}


