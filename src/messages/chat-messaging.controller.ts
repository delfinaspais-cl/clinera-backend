import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { ChatMessagingService } from './chat-messaging.service';
import { 
  CreateConversationDto, 
  UpdateConversationDto,
  CreateMessageDto,
  ConversationFiltersDto
} from './dto/conversation.dto';

@ApiTags('Chat Messaging')
@UseGuards(JwtAuthGuard)
@Controller('clinica/:clinicaUrl/chat')
export class ChatMessagingController {
  private readonly logger = new Logger(ChatMessagingController.name);
  
  constructor(private readonly chatMessagingService: ChatMessagingService) {}

  // ===== CONVERSACIONES =====

  @Get('conversations')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener conversaciones',
    description: 'Obtiene todas las conversaciones de la clínica con filtros opcionales',
  })
  @ApiQuery({ name: 'stage', required: false, description: 'Filtrar por etapa' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, teléfono o email' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filtrar por tags (array)' })
  @ApiQuery({ name: 'isOnline', required: false, description: 'Filtrar por estado online' })
  @ApiResponse({
    status: 200,
    description: 'Conversaciones obtenidas exitosamente',
  })
  async getConversations(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() filters: ConversationFiltersDto,
  ) {
    this.logger.log(`Solicitud GET para conversaciones de clínica: ${clinicaUrl}`);
    return this.chatMessagingService.getConversations(clinicaUrl, filters);
  }

  @Get('conversations/:conversationId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener conversación específica',
    description: 'Obtiene una conversación específica con sus detalles',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversación obtenida exitosamente',
  })
  async getConversation(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('conversationId') conversationId: string,
  ) {
    this.logger.log(`Solicitud GET para conversación: ${conversationId}`);
    return this.chatMessagingService.getConversation(clinicaUrl, conversationId);
  }

  @Post('conversations')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear nueva conversación',
    description: 'Crea una nueva conversación en la clínica',
  })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({
    status: 201,
    description: 'Conversación creada exitosamente',
  })
  async createConversation(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateConversationDto,
  ) {
    this.logger.log(`Solicitud POST para crear conversación en clínica: ${clinicaUrl}`);
    return this.chatMessagingService.createConversation(clinicaUrl, dto);
  }

  @Patch('conversations/:conversationId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar conversación',
    description: 'Actualiza los datos de una conversación específica',
  })
  @ApiBody({ type: UpdateConversationDto })
  @ApiResponse({
    status: 200,
    description: 'Conversación actualizada exitosamente',
  })
  async updateConversation(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: UpdateConversationDto,
  ) {
    this.logger.log(`Solicitud PATCH para actualizar conversación: ${conversationId}`);
    return this.chatMessagingService.updateConversation(clinicaUrl, conversationId, dto);
  }

  @Post('conversations/:conversationId/move/:stage')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mover conversación a etapa',
    description: 'Mueve una conversación a una etapa específica (prospectos, activas, agendados, completados, cerradas)',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversación movida exitosamente',
  })
  async moveConversationToStage(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('conversationId') conversationId: string,
    @Param('stage') stage: string,
  ) {
    this.logger.log(`Solicitud POST para mover conversación ${conversationId} a etapa: ${stage}`);
    return this.chatMessagingService.moveConversationToStage(clinicaUrl, conversationId, stage);
  }

  // ===== MENSAJES =====

  @Get('conversations/:conversationId/messages')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener mensajes de conversación',
    description: 'Obtiene todos los mensajes de una conversación específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensajes obtenidos exitosamente',
  })
  async getMessages(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('conversationId') conversationId: string,
  ) {
    this.logger.log(`Solicitud GET para mensajes de conversación: ${conversationId}`);
    return this.chatMessagingService.getMessages(clinicaUrl, conversationId);
  }

  @Post('conversations/:conversationId/messages')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enviar mensaje',
    description: 'Envía un nuevo mensaje en una conversación específica',
  })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Mensaje enviado exitosamente',
  })
  async createMessage(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('conversationId') conversationId: string,
    @Body() dto: CreateMessageDto,
    @Request() req,
  ) {
    this.logger.log(`Solicitud POST para enviar mensaje en conversación: ${conversationId}`);
    
    // Asegurar que el conversationId del DTO coincida con el parámetro
    dto.conversationId = conversationId;
    
    return this.chatMessagingService.createMessage(clinicaUrl, dto, req.user?.id);
  }

  @Post('conversations/:conversationId/messages/read')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marcar mensajes como leídos',
    description: 'Marca todos los mensajes no leídos de una conversación como leídos',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensajes marcados como leídos exitosamente',
  })
  async markMessagesAsRead(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('conversationId') conversationId: string,
  ) {
    this.logger.log(`Solicitud POST para marcar mensajes como leídos en conversación: ${conversationId}`);
    return this.chatMessagingService.markMessagesAsRead(clinicaUrl, conversationId);
  }

  // ===== ESTADÍSTICAS =====

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener estadísticas de conversaciones',
    description: 'Obtiene estadísticas generales de las conversaciones de la clínica',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getConversationStats(@Param('clinicaUrl') clinicaUrl: string) {
    this.logger.log(`Solicitud GET para estadísticas de conversaciones de clínica: ${clinicaUrl}`);
    return this.chatMessagingService.getConversationStats(clinicaUrl);
  }

  // ===== ENDPOINTS DE CONVENIENCIA =====

  @Get('kanban')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener vista Kanban',
    description: 'Obtiene todas las conversaciones organizadas por etapas para vista Kanban',
  })
  @ApiResponse({
    status: 200,
    description: 'Vista Kanban obtenida exitosamente',
  })
  async getKanbanView(@Param('clinicaUrl') clinicaUrl: string) {
    this.logger.log(`Solicitud GET para vista Kanban de clínica: ${clinicaUrl}`);
    
    const stages = ['prospectos', 'activas', 'agendados', 'completados', 'cerradas'];
    const kanbanData = {};

    for (const stage of stages) {
      const result = await this.chatMessagingService.getConversations(clinicaUrl, { stage });
      kanbanData[stage] = result.conversations;
    }

    const stats = await this.chatMessagingService.getConversationStats(clinicaUrl);

    return {
      success: true,
      kanban: kanbanData,
      stats: stats.stats,
    };
  }

  @Post('conversations/:conversationId/send-whatsapp')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enviar mensaje por WhatsApp',
    description: 'Envía un mensaje por WhatsApp y lo registra en la conversación',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: 'Hola, ¿cómo estás?' },
        phone: { type: 'string', example: '5491112345678' },
      },
      required: ['content', 'phone'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Mensaje de WhatsApp enviado exitosamente',
  })
  async sendWhatsAppMessage(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('conversationId') conversationId: string,
    @Body() body: { content: string; phone: string },
    @Request() req,
  ) {
    this.logger.log(`Solicitud POST para enviar WhatsApp en conversación: ${conversationId}`);
    
    // Aquí podrías integrar con el servicio de WhatsApp existente
    // Por ahora, solo creamos el mensaje en la conversación
    const dto: CreateMessageDto = {
      content: body.content,
      conversationId,
      messageType: 'whatsapp',
      isFromUser: true,
    };
    
    return this.chatMessagingService.createMessage(clinicaUrl, dto, req.user?.id);
  }
}
