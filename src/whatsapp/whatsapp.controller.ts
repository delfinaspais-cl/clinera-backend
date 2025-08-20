import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { WhatsAppService } from './whatsapp.service';
import { WebhookService } from './services/webhook.service';
import { SendWhatsAppMessageDto } from './dto/send-message.dto';
import { CreateWhatsAppTemplateDto } from './dto/create-template.dto';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly webhookService: WebhookService,
  ) {}

  @Post('send-message')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enviar mensaje de WhatsApp',
    description: 'Envía un mensaje de WhatsApp (texto, plantilla, multimedia)',
  })
  @ApiBody({ type: SendWhatsAppMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Mensaje enviado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        messageId: { type: 'string', example: 'wamid.123456789' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async sendMessage(@Request() req, @Body() dto: SendWhatsAppMessageDto) {
    const result = await this.whatsappService.sendMessage(dto, req.user.id);

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  @Post('send-text')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enviar mensaje de texto',
    description: 'Envía un mensaje de texto simple de WhatsApp',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: { type: 'string', example: '5491112345678' },
        text: { type: 'string', example: 'Hola, tu turno ha sido confirmado' },
        clinicaId: { type: 'string', example: 'clinica123' },
      },
      required: ['to', 'text'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Mensaje enviado exitosamente',
  })
  async sendTextMessage(
    @Request() req,
    @Body() body: { to: string; text: string; clinicaId?: string },
  ) {
    const result = await this.whatsappService.sendTextMessage(
      body.to,
      body.text,
      body.clinicaId,
      req.user.id,
    );

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  @Post('send-template')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enviar mensaje con plantilla',
    description: 'Envía un mensaje usando una plantilla de WhatsApp',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        to: { type: 'string', example: '5491112345678' },
        templateName: { type: 'string', example: 'appointment_confirmation' },
        templateParams: {
          type: 'object',
          example: { '1': 'Dr. García', '2': '15/01/2024', '3': '10:00' },
        },
        clinicaId: { type: 'string', example: 'clinica123' },
      },
      required: ['to', 'templateName'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Mensaje enviado exitosamente',
  })
  async sendTemplateMessage(
    @Request() req,
    @Body()
    body: {
      to: string;
      templateName: string;
      templateParams?: Record<string, any>;
      clinicaId?: string;
    },
  ) {
    const result = await this.whatsappService.sendTemplateMessage(
      body.to,
      body.templateName,
      body.templateParams || {},
      body.clinicaId,
      req.user.id,
    );

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  @Post('create-template')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear plantilla de WhatsApp',
    description: 'Crea una nueva plantilla de mensaje para WhatsApp',
  })
  @ApiBody({ type: CreateWhatsAppTemplateDto })
  @ApiResponse({
    status: 201,
    description: 'Plantilla creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        templateId: { type: 'string', example: '123456789' },
      },
    },
  })
  async createTemplate(@Body() dto: CreateWhatsAppTemplateDto) {
    const result = await this.whatsappService.createTemplate(dto);

    return {
      success: result.success,
      templateId: result.templateId,
      error: result.error,
    };
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener plantillas',
    description: 'Obtiene todas las plantillas de WhatsApp',
  })
  @ApiResponse({
    status: 200,
    description: 'Plantillas obtenidas exitosamente',
  })
  async getTemplates(@Query('clinicaId') clinicaId?: string) {
    const result = await this.whatsappService.getTemplates(clinicaId);

    return {
      success: result.success,
      templates: result.templates,
      error: result.error,
    };
  }

  @Get('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener mensajes',
    description: 'Obtiene el historial de mensajes de WhatsApp',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensajes obtenidos exitosamente',
  })
  async getMessages(
    @Query('clinicaId') clinicaId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const result = await this.whatsappService.getMessages({
      clinicaId,
      userId,
      status,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
    });

    return {
      success: result.success,
      messages: result.messages,
      error: result.error,
    };
  }

  @Get('message-status/:messageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener estado del mensaje',
    description: 'Obtiene el estado actual de un mensaje de WhatsApp',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del mensaje obtenido exitosamente',
  })
  async getMessageStatus(@Param('messageId') messageId: string) {
    const result = await this.whatsappService.getMessageStatus(messageId);

    return {
      success: result.success,
      status: result.status,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      error: result.error,
    };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de WhatsApp',
    description: 'Endpoint para recibir webhooks de WhatsApp Business API',
  })
  @ApiHeader({
    name: 'x-hub-signature-256',
    description: 'Firma de verificación del webhook',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook procesado exitosamente',
  })
  async webhook(
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
  ) {
    try {
      // Verificar la firma del webhook
      const body = JSON.stringify(payload);
      const isValidSignature = this.whatsappService.verifyWebhookSignature(
        signature,
        body,
      );

      if (!isValidSignature) {
        console.error('Firma de webhook inválida');
        return { success: false, error: 'Invalid signature' };
      }

      // Procesar el webhook
      await this.webhookService.processWebhook(payload);

      return { success: true };
    } catch (error) {
      console.error('Error procesando webhook:', error);
      return { success: false, error: error.message };
    }
  }

  @Get('webhook/verify')
  @ApiOperation({
    summary: 'Verificar webhook',
    description:
      'Endpoint para verificar la configuración del webhook de WhatsApp',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación exitosa',
  })
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
  ) {
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === expectedToken) {
      const challenge = 'challenge';
      return challenge;
    } else {
      return { success: false, error: 'Invalid verification token' };
    }
  }

  @Get('webhooks/unprocessed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener webhooks no procesados',
    description: 'Obtiene los webhooks que aún no han sido procesados',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhooks obtenidos exitosamente',
  })
  async getUnprocessedWebhooks() {
    const result = await this.webhookService.getUnprocessedWebhooks();

    return {
      success: result.success,
      webhooks: result.webhooks,
      error: result.error,
    };
  }

  @Post('webhook/:webhookId/process')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marcar webhook como procesado',
    description: 'Marca un webhook específico como procesado',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook marcado como procesado',
  })
  async markWebhookAsProcessed(@Param('webhookId') webhookId: string) {
    await this.webhookService.markWebhookAsProcessed(webhookId);

    return {
      success: true,
      message: 'Webhook marcado como procesado',
    };
  }
}
