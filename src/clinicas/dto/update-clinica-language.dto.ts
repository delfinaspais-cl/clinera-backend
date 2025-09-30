import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClinicaLanguageDto {
  @ApiProperty({ 
    description: 'Idioma predeterminado de la clínica',
    enum: ['es', 'pt-BR', 'en'],
    example: 'es',
    required: true
  })
  @IsString()
  @IsIn(['es', 'pt-BR', 'en'], { 
    message: 'El idioma debe ser: es (Español), pt-BR (Portugués) o en (Inglés)' 
  })
  defaultLanguage: string;
}
