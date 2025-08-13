import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({
    description: 'Título de la notificación',
    example: 'Nuevo turno confirmado'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Cuerpo del mensaje',
    example: 'Tu turno para el Dr. García ha sido confirmado para mañana a las 10:00'
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Datos adicionales para la aplicación',
    example: { type: 'appointment', appointmentId: '123' },
    required: false
  })
  @IsOptional()
  data?: Record<string, any>;

  @ApiProperty({
    description: 'URL de la imagen (opcional)',
    example: 'https://example.com/image.jpg',
    required: false
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    description: 'IDs de usuarios específicos para enviar la notificación',
    example: ['user1', 'user2'],
    required: false
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[];

  @ApiProperty({
    description: 'ID de la clínica para enviar a todos los usuarios',
    example: 'clinica123',
    required: false
  })
  @IsString()
  @IsOptional()
  clinicaId?: string;

  @ApiProperty({
    description: 'Plataformas específicas para enviar',
    enum: ['android', 'ios', 'web'],
    example: ['android', 'ios'],
    required: false
  })
  @IsArray()
  @IsIn(['android', 'ios', 'web'], { each: true })
  @IsOptional()
  platforms?: string[];
}
