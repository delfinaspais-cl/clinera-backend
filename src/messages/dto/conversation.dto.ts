import { IsString, IsOptional, IsBoolean, IsArray, IsDateString } from 'class-validator';

export class ConversationDto {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  tags: string[];
  isOnline: boolean;
  phone?: string;
  email?: string;
  stage: string; // 'prospectos' | 'activas' | 'agendados' | 'completados' | 'cerradas'
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateConversationDto {
  @IsString()
  name: string;

  @IsString()
  role: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  stage?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class UpdateConversationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  stage?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;
}

export class MessageDto {
  id: string;
  content: string;
  timestamp: string;
  isFromUser: boolean;
  conversationId: string;
  messageType: string; // 'text' | 'whatsapp' | 'email'
  status: string; // 'sent' | 'delivered' | 'read' | 'failed'
  createdAt: Date;
}

export class CreateMessageDto {
  @IsString()
  content: string;

  @IsString()
  conversationId: string;

  @IsString()
  @IsOptional()
  messageType?: string;

  @IsBoolean()
  isFromUser: boolean;
}

export class UpdateMessageDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class ConversationFiltersDto {
  @IsString()
  @IsOptional()
  stage?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;
}
