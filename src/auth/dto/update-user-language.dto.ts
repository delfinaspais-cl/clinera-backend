import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserLanguageDto {
  @ApiProperty({
    description: 'Idioma preferido del usuario',
    example: 'es',
    enum: ['es', 'pt-BR', 'en']
  })
  @IsString()
  @IsIn(['es', 'pt-BR', 'en'], {
    message: 'El idioma debe ser uno de: es, pt-BR, en'
  })
  preferredLanguage: string;
}
