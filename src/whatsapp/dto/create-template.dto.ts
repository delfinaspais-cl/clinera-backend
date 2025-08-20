import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWhatsAppTemplateDto {
  @ApiProperty({
    description: 'Nombre de la plantilla',
    example: 'appointment_confirmation',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Código de idioma',
    example: 'es',
    default: 'es',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({
    description: 'Categoría de la plantilla',
    enum: ['marketing', 'utility', 'authentication'],
    example: 'utility',
  })
  @IsString()
  @IsIn(['marketing', 'utility', 'authentication'])
  category: string;

  @ApiProperty({
    description: 'Componentes de la plantilla en formato JSON',
    example:
      '{"header": {"type": "text", "text": "Confirmación de Turno"}, "body": {"type": "text", "text": "Hola {{1}}, tu turno con {{2}} ha sido confirmado para el {{3}} a las {{4}}."}}',
  })
  @IsString()
  @IsNotEmpty()
  components: string;

  @ApiProperty({
    description: 'Ejemplo de uso de la plantilla',
    example:
      'Hola Juan Pérez, tu turno con Dr. García ha sido confirmado para el 15/01/2024 a las 10:00.',
    required: false,
  })
  @IsString()
  @IsOptional()
  example?: string;

  @ApiProperty({
    description: 'ID de la clínica',
    example: 'clinica123',
    required: false,
  })
  @IsString()
  @IsOptional()
  clinicaId?: string;
}
