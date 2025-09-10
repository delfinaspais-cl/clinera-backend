import { IsString, IsEmail, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({
    description: 'Email del destinatario',
    example: 'paciente@email.com'
  })
  @IsEmail()
  to: string;

  @ApiProperty({
    description: 'Asunto del email',
    example: 'Confirmación de Cita - 2025-09-09'
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Contenido del email en texto plano',
    example: 'Estimado/a MARIA TERESITA INOCENCIO,\n\nLe confirmamos que su cita ha sido agendada exitosamente...'
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'Contenido HTML del email (opcional)',
    example: '<html><body><h1>Confirmación de Cita</h1></body></html>'
  })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({
    description: 'Template a usar (opcional)',
    example: 'turno-confirmation'
  })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({
    description: 'Variables para el template (opcional)',
    example: {
      paciente: 'María González',
      fecha: '2025-09-09',
      hora: '09:00'
    }
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}
