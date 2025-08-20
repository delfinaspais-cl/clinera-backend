import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsAppService,
  ) {}

  async processWebhook(payload: any): Promise<void> {
    try {
      // Guardar el webhook en la base de datos
      await this.prisma.whatsAppWebhook.create({
        data: {
          eventType: this.getEventType(payload),
          payload: JSON.stringify(payload),
          processed: false,
        },
      });

      // Procesar según el tipo de evento
      const eventType = this.getEventType(payload);

      switch (eventType) {
        case 'message':
          await this.processMessageEvent(payload);
          break;
        case 'message_status':
          await this.processMessageStatusEvent(payload);
          break;
        case 'template_status':
          await this.processTemplateStatusEvent(payload);
          break;
        default:
          this.logger.warn(`Tipo de evento no manejado: ${eventType}`);
      }

      // Marcar como procesado
      await this.prisma.whatsAppWebhook.updateMany({
        where: {
          payload: JSON.stringify(payload),
          processed: false,
        },
        data: {
          processed: true,
        },
      });
    } catch (error) {
      this.logger.error('Error procesando webhook:', error);
    }
  }

  private getEventType(payload: any): string {
    if (payload.entry && payload.entry[0]?.changes) {
      const change = payload.entry[0].changes[0];

      if (change.value?.messages) {
        return 'message';
      } else if (change.value?.statuses) {
        return 'message_status';
      } else if (change.value?.message_templates) {
        return 'template_status';
      }
    }

    return 'unknown';
  }

  private async processMessageEvent(payload: any): Promise<void> {
    try {
      const messages = payload.entry[0].changes[0].value.messages;

      for (const message of messages) {
        this.logger.log(`Mensaje recibido de ${message.from}: ${message.type}`);

        // Aquí puedes implementar la lógica para responder automáticamente
        // Por ejemplo, enviar un mensaje de confirmación
        if (message.type === 'text') {
          await this.handleTextMessage(message);
        } else if (message.type === 'button') {
          await this.handleButtonMessage(message);
        }
      }
    } catch (error) {
      this.logger.error('Error procesando mensaje:', error);
    }
  }

  private async processMessageStatusEvent(payload: any): Promise<void> {
    try {
      const statuses = payload.entry[0].changes[0].value.statuses;

      for (const status of statuses) {
        this.logger.log(`Estado del mensaje ${status.id}: ${status.status}`);

        // Actualizar el estado del mensaje en la base de datos
        await this.prisma.whatsAppMessage.updateMany({
          where: {
            wamid: status.id,
          },
          data: {
            status: status.status,
            errorCode: status.errors?.[0]?.code || null,
            errorMessage: status.errors?.[0]?.title || null,
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      this.logger.error('Error procesando estado del mensaje:', error);
    }
  }

  private async processTemplateStatusEvent(payload: any): Promise<void> {
    try {
      const templates = payload.entry[0].changes[0].value.message_templates;

      for (const template of templates) {
        this.logger.log(
          `Estado de plantilla ${template.id}: ${template.status}`,
        );

        // Actualizar el estado de la plantilla en la base de datos
        await this.prisma.whatsAppTemplate.updateMany({
          where: {
            name: template.name,
            status: 'pending',
          },
          data: {
            status: template.status,
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      this.logger.error('Error procesando estado de plantilla:', error);
    }
  }

  private async handleTextMessage(message: any): Promise<void> {
    try {
      const text = message.text.body.toLowerCase();
      const from = message.from;

      // Ejemplo de respuestas automáticas
      if (
        text.includes('hola') ||
        text.includes('buenos días') ||
        text.includes('buenas')
      ) {
        await this.whatsappService.sendTextMessage(
          from,
          '¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?',
        );
      } else if (text.includes('turno') || text.includes('cita')) {
        await this.whatsappService.sendTextMessage(
          from,
          'Para agendar un turno, por favor visita nuestra página web o contáctanos por teléfono.',
        );
      } else if (text.includes('horario') || text.includes('atención')) {
        await this.whatsappService.sendTextMessage(
          from,
          'Nuestros horarios de atención son de lunes a viernes de 8:00 a 18:00 hs.',
        );
      } else {
        await this.whatsappService.sendTextMessage(
          from,
          'Gracias por tu mensaje. Un representante se pondrá en contacto contigo pronto.',
        );
      }
    } catch (error) {
      this.logger.error('Error manejando mensaje de texto:', error);
    }
  }

  private async handleButtonMessage(message: any): Promise<void> {
    try {
      const buttonText = message.button.text;
      const from = message.from;

      // Manejar respuestas de botones
      switch (buttonText) {
        case 'Agendar Turno':
          await this.whatsappService.sendTextMessage(
            from,
            'Para agendar un turno, por favor visita nuestra página web o contáctanos por teléfono.',
          );
          break;
        case 'Ver Horarios':
          await this.whatsappService.sendTextMessage(
            from,
            'Nuestros horarios de atención son de lunes a viernes de 8:00 a 18:00 hs.',
          );
          break;
        case 'Contacto':
          await this.whatsappService.sendTextMessage(
            from,
            'Puedes contactarnos por teléfono al 123-456-7890 o por email a info@clinica.com',
          );
          break;
        default:
          await this.whatsappService.sendTextMessage(
            from,
            'Gracias por tu interés. Un representante se pondrá en contacto contigo pronto.',
          );
      }
    } catch (error) {
      this.logger.error('Error manejando mensaje de botón:', error);
    }
  }

  async getUnprocessedWebhooks(): Promise<any> {
    try {
      const webhooks = await this.prisma.whatsAppWebhook.findMany({
        where: {
          processed: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      return {
        success: true,
        webhooks: webhooks.map((webhook) => ({
          ...webhook,
          payload: JSON.parse(webhook.payload),
        })),
      };
    } catch (error) {
      this.logger.error('Error obteniendo webhooks no procesados:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async markWebhookAsProcessed(webhookId: string): Promise<void> {
    try {
      await this.prisma.whatsAppWebhook.update({
        where: { id: webhookId },
        data: { processed: true },
      });
    } catch (error) {
      this.logger.error('Error marcando webhook como procesado:', error);
    }
  }
}
