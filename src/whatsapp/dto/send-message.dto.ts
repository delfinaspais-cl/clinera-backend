import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendWhatsAppMessageDto {
  @ApiProperty({
    description: 'Número de teléfono del destinatario (formato: 5491112345678)',
    example: '5491112345678',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Tipo de mensaje',
    enum: ['text', 'template', 'image', 'document', 'audio', 'video'],
    example: 'text',
  })
  @IsString()
  @IsIn(['text', 'template', 'image', 'document', 'audio', 'video'])
  messageType: string;

  @ApiProperty({
    description:
      'Contenido del mensaje de texto (requerido si messageType es "text")',
    example: 'Hola, tu turno ha sido confirmado',
    required: false,
  })
  @IsString()
  @IsOptional()
  messageText?: string;

  @ApiProperty({
    description:
      'Nombre de la plantilla (requerido si messageType es "template")',
    example: 'appointment_confirmation',
    required: false,
  })
  @IsString()
  @IsOptional()
  templateName?: string;

  @ApiProperty({
    description: 'Parámetros de la plantilla en formato JSON',
    example: '{"1": "Dr. García", "2": "15/01/2024", "3": "10:00"}',
    required: false,
  })
  @IsOptional()
  templateParams?: Record<string, any>;

  @ApiProperty({
    description:
      'URL del archivo multimedia (requerido si messageType es image/document/audio/video)',
    example: 'https://example.com/document.pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiProperty({
    description:
      'ID del archivo multimedia en WhatsApp (alternativo a mediaUrl)',
    example: '123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  mediaId?: string;

  @ApiProperty({
    description: 'ID de la clínica',
    example: 'clinica123',
    required: false,
  })
  @IsString()
  @IsOptional()
  clinicaId?: string;

  @ApiProperty({
    description: 'Datos adicionales en formato JSON',
    example: '{"appointmentId": "123", "patientName": "Juan Pérez"}',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
