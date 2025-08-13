import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'Token del dispositivo para notificaciones push',
    example: 'fMEP0vJqS0:APA91bHqX...'
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Plataforma del dispositivo',
    enum: ['android', 'ios', 'web'],
    example: 'android'
  })
  @IsString()
  @IsIn(['android', 'ios', 'web'])
  platform: string;

  @ApiProperty({
    description: 'Identificador único del dispositivo (opcional)',
    example: 'device_123456',
    required: false
  })
  @IsString()
  @IsOptional()
  deviceId?: string;
}
