import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class NotificationTemplateDto {
  @IsString()
  name: string;

  @IsString()
  type: 'whatsapp' | 'email' | 'sms';

  @IsString()
  subject?: string;

  @IsString()
  message: string;

  @IsArray()
  @IsString({ each: true })
  variables: string[]; // ['nombre', 'fecha', 'doctor', 'clinica']

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
