import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SendWhatsAppMessageDto } from './dto/send-message.dto';
import { CreateWhatsAppTemplateDto } from './dto/create-template.dto';
import axios from 'axios';
import * as crypto from 'crypto-js';

export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppTemplateResult {
  success: boolean;
  templateId?: string;
  error?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly webhookSecret: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID') || '';
    this.accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN') || '';
    this.apiVersion = this.configService.get('WHATSAPP_API_VERSION', 'v18.0');
    this.webhookSecret = this.configService.get('WHATSAPP_WEBHOOK_SECRET') || '';
  }

  async sendMessage(dto: SendWhatsAppMessageDto, userId?: string): Promise<WhatsAppMessageResult> {
    try {
      // Validar que el número de teléfono tenga el formato correcto
      const formattedPhone = this.formatPhoneNumber(dto.to);
      
      // Crear registro en la base de datos
      const messageRecord = await this.prisma.whatsAppMessage.create({
        data: {
          phoneNumberId: this.phoneNumberId,
          to: formattedPhone,
          from: this.phoneNumberId,
          messageType: dto.messageType,
          messageText: dto.messageText,
          templateName: dto.templateName,
          templateParams: dto.templateParams ? JSON.stringify(dto.templateParams) : null,
          mediaUrl: dto.mediaUrl,
          mediaId: dto.mediaId,
          status: 'pending',
          clinicaId: dto.clinicaId,
          userId: userId,
          metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
        },
      });

      // Preparar payload según el tipo de mensaje
      let payload: any;

      switch (dto.messageType) {
        case 'text':
          if (!dto.messageText) {
            throw new Error('messageText es requerido para mensajes de tipo text');
          }
          payload = this.buildTextMessagePayload(formattedPhone, dto.messageText);
          break;
        case 'template':
          if (!dto.templateName) {
            throw new Error('templateName es requerido para mensajes de tipo template');
          }
          payload = this.buildTemplateMessagePayload(formattedPhone, dto.templateName, dto.templateParams);
          break;
        case 'image':
        case 'document':
        case 'audio':
        case 'video':
          payload = this.buildMediaMessagePayload(formattedPhone, dto.messageType, dto.mediaUrl, dto.mediaId, dto.messageText);
          break;
        default:
          throw new Error(`Tipo de mensaje no soportado: ${dto.messageType}`);
      }

      // Enviar mensaje a WhatsApp
      const response = await this.sendToWhatsAppAPI(payload);

      if (response.success) {
        // Actualizar registro con el ID del mensaje
        await this.prisma.whatsAppMessage.update({
          where: { id: messageRecord.id },
          data: {
            wamid: response.messageId,
            status: 'sent',
          },
        });

        this.logger.log(`Mensaje enviado exitosamente: ${response.messageId}`);
        return {
          success: true,
          messageId: response.messageId,
        };
      } else {
        // Actualizar registro con el error
        await this.prisma.whatsAppMessage.update({
          where: { id: messageRecord.id },
          data: {
            status: 'failed',
            errorCode: 'API_ERROR',
            errorMessage: response.error,
          },
        });

        this.logger.error(`Error enviando mensaje: ${response.error}`);
        return {
          success: false,
          error: response.error,
        };
      }
    } catch (error) {
      this.logger.error('Error en sendMessage:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateParams: Record<string, any>,
    clinicaId?: string,
    userId?: string,
  ): Promise<WhatsAppMessageResult> {
    return this.sendMessage({
      to,
      messageType: 'template',
      templateName,
      templateParams,
      clinicaId,
    }, userId);
  }

  async sendTextMessage(
    to: string,
    text: string,
    clinicaId?: string,
    userId?: string,
  ): Promise<WhatsAppMessageResult> {
    return this.sendMessage({
      to,
      messageType: 'text',
      messageText: text,
      clinicaId,
    }, userId);
  }

  async createTemplate(dto: CreateWhatsAppTemplateDto): Promise<WhatsAppTemplateResult> {
    try {
      // Crear registro en la base de datos
      const templateRecord = await this.prisma.whatsAppTemplate.create({
        data: {
          name: dto.name,
          language: dto.language || 'es',
          category: dto.category,
          components: dto.components,
          example: dto.example,
          clinicaId: dto.clinicaId,
          status: 'pending',
        },
      });

      // Enviar plantilla a WhatsApp para aprobación
      const payload = {
        name: dto.name,
        language: dto.language || 'es',
        category: dto.category,
        components: JSON.parse(dto.components),
      };

      const response = await this.sendTemplateToWhatsAppAPI(payload);

      if (response.success) {
        // Actualizar registro con el ID de la plantilla
        await this.prisma.whatsAppTemplate.update({
          where: { id: templateRecord.id },
          data: {
            status: 'pending', // Cambiará a 'approved' cuando llegue el webhook
          },
        });

        this.logger.log(`Plantilla creada exitosamente: ${response.templateId}`);
        return {
          success: true,
          templateId: response.templateId,
        };
      } else {
        // Actualizar registro con el error
        await this.prisma.whatsAppTemplate.update({
          where: { id: templateRecord.id },
          data: {
            status: 'rejected',
          },
        });

        this.logger.error(`Error creando plantilla: ${response.error}`);
        return {
          success: false,
          error: response.error,
        };
      }
    } catch (error) {
      this.logger.error('Error en createTemplate:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getMessageStatus(messageId: string): Promise<any> {
    try {
      const message = await this.prisma.whatsAppMessage.findFirst({
        where: { wamid: messageId },
      });

      if (!message) {
        return {
          success: false,
          error: 'Mensaje no encontrado',
        };
      }

      return {
        success: true,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      };
    } catch (error) {
      this.logger.error('Error obteniendo estado del mensaje:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getTemplates(clinicaId?: string): Promise<any> {
    try {
      const templates = await this.prisma.whatsAppTemplate.findMany({
        where: {
          ...(clinicaId && { clinicaId }),
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        templates: templates.map(template => ({
          ...template,
          components: JSON.parse(template.components),
        })),
      };
    } catch (error) {
      this.logger.error('Error obteniendo plantillas:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getMessages(filters: {
    clinicaId?: string;
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const messages = await this.prisma.whatsAppMessage.findMany({
        where: {
          ...(filters.clinicaId && { clinicaId: filters.clinicaId }),
          ...(filters.userId && { userId: filters.userId }),
          ...(filters.status && { status: filters.status }),
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      });

      return {
        success: true,
        messages: messages.map(message => ({
          ...message,
          templateParams: message.templateParams ? JSON.parse(message.templateParams) : null,
          metadata: message.metadata ? JSON.parse(message.metadata) : null,
        })),
      };
    } catch (error) {
      this.logger.error('Error obteniendo mensajes:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remover todos los caracteres no numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Asegurar que tenga el código de país
    if (!cleaned.startsWith('54')) {
      cleaned = '54' + cleaned;
    }
    
    return cleaned;
  }

  private buildTextMessagePayload(to: string, text: string): any {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    };
  }

  private buildTemplateMessagePayload(to: string, templateName: string, templateParams?: Record<string, any>): any {
    const payload: any = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'es',
        },
      },
    };

    if (templateParams) {
      payload.template.components = [
        {
          type: 'body',
          parameters: Object.entries(templateParams).map(([key, value]) => ({
            type: 'text',
            text: value,
          })),
        },
      ];
    }

    return payload;
  }

  private buildMediaMessagePayload(to: string, type: string, mediaUrl?: string, mediaId?: string, caption?: string): any {
    const payload: any = {
      messaging_product: 'whatsapp',
      to,
      type,
    };

    if (mediaId) {
      payload[type] = { id: mediaId };
    } else if (mediaUrl) {
      payload[type] = { link: mediaUrl };
    } else {
      throw new Error(`Se requiere mediaUrl o mediaId para mensajes de tipo ${type}`);
    }

    if (caption) {
      payload[type].caption = caption;
    }

    return payload;
  }

  private async sendToWhatsAppAPI(payload: any): Promise<WhatsAppMessageResult> {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    } catch (error) {
      this.logger.error('Error en WhatsApp API:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  private async sendTemplateToWhatsAppAPI(payload: any): Promise<WhatsAppTemplateResult> {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/message_templates`;
      
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        templateId: response.data.id,
      };
    } catch (error) {
      this.logger.error('Error creando plantilla en WhatsApp API:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  verifyWebhookSignature(signature: string, body: string): boolean {
    try {
      const expectedSignature = crypto.HmacSHA256(body, this.webhookSecret).toString(crypto.enc.Hex);
      return signature === `sha256=${expectedSignature}`;
    } catch (error) {
      this.logger.error('Error verificando firma del webhook:', error);
      return false;
    }
  }
}
