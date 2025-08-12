import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationTemplateDto } from '../dto/notification-template.dto';

@Injectable()
export class WhatsAppTemplateService {
  constructor(private prisma: PrismaService) {}

  // Default templates that clinics can customize
  private readonly defaultTemplates = {
    appointment_confirmation: {
      name: 'Confirmación de Cita',
      type: 'whatsapp',
      message: 'Hola {{nombre}}, tu cita ha sido confirmada para el {{fecha}} a las {{hora}} con {{doctor}} en {{clinica}}. Por favor confirma tu asistencia.',
      variables: ['nombre', 'fecha', 'hora', 'doctor', 'clinica']
    },
    appointment_reminder: {
      name: 'Recordatorio de Cita',
      type: 'whatsapp',
      message: 'Hola {{nombre}}, te recordamos tu cita mañana {{fecha}} a las {{hora}} con {{doctor}} en {{clinica}}.',
      variables: ['nombre', 'fecha', 'hora', 'doctor', 'clinica']
    },
    appointment_cancellation: {
      name: 'Cancelación de Cita',
      type: 'whatsapp',
      message: 'Hola {{nombre}}, tu cita del {{fecha}} a las {{hora}} con {{doctor}} ha sido cancelada. Contacta a {{clinica}} para reagendar.',
      variables: ['nombre', 'fecha', 'hora', 'doctor', 'clinica']
    }
  };

  async getTemplates(clinicaId: string) {
    // Get clinic-specific templates or return defaults
    const clinicTemplates = await this.prisma.clinica.findUnique({
      where: { id: clinicaId },
      select: { contacto: true }
    });

    if (clinicTemplates?.contacto) {
      const contactData = JSON.parse(clinicTemplates.contacto);
      return contactData.whatsappTemplates || this.defaultTemplates;
    }

    return this.defaultTemplates;
  }

  async updateTemplate(clinicaId: string, templateName: string, template: NotificationTemplateDto) {
    const clinica = await this.prisma.clinica.findUnique({
      where: { id: clinicaId }
    });

    if (!clinica) {
      throw new Error('Clínica no encontrada');
    }

    // Get current contact data
    const currentContact = clinica.contacto ? JSON.parse(clinica.contacto) : {};
    const currentTemplates = currentContact.whatsappTemplates || this.defaultTemplates;

    // Update specific template
    currentTemplates[templateName] = {
      name: template.name,
      type: template.type,
      message: template.message,
      variables: template.variables,
      metadata: template.metadata
    };

    // Save updated templates
    await this.prisma.clinica.update({
      where: { id: clinicaId },
      data: {
        contacto: JSON.stringify({
          ...currentContact,
          whatsappTemplates: currentTemplates
        })
      }
    });

    return { success: true, template: currentTemplates[templateName] };
  }

  async processTemplate(templateName: string, variables: Record<string, any>, clinicaId: string): Promise<string> {
    const templates = await this.getTemplates(clinicaId);
    const template = templates[templateName];

    if (!template) {
      throw new Error(`Template '${templateName}' no encontrado`);
    }

    let message = template.message;

    // Replace variables in template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), value);
    }

    // Validate that all required variables are provided
    const missingVariables = template.variables.filter(variable => 
      !variables.hasOwnProperty(variable)
    );

    if (missingVariables.length > 0) {
      throw new Error(`Variables faltantes: ${missingVariables.join(', ')}`);
    }

    return message;
  }

  async validateTemplate(template: NotificationTemplateDto): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for required variables in message
    const variableMatches = template.message.match(/\{\{(\w+)\}\}/g) || [];
    const foundVariables = variableMatches.map(match => match.replace(/\{\{|\}\}/g, ''));

    // Check if all found variables are declared
    const undeclaredVariables = foundVariables.filter(variable => 
      !template.variables.includes(variable)
    );

    if (undeclaredVariables.length > 0) {
      errors.push(`Variables no declaradas: ${undeclaredVariables.join(', ')}`);
    }

    // Check if all declared variables are used
    const unusedVariables = template.variables.filter(variable => 
      !foundVariables.includes(variable)
    );

    if (unusedVariables.length > 0) {
      errors.push(`Variables no utilizadas: ${unusedVariables.join(', ')}`);
    }

    // Check message length (WhatsApp limit is 4096 characters)
    if (template.message.length > 4096) {
      errors.push('El mensaje excede el límite de 4096 caracteres de WhatsApp');
    }

    // Check for forbidden characters or patterns
    const forbiddenPatterns = [
      /\*\*/, // Bold markdown
      /\*/,   // Italic markdown
      /`/,    // Code markdown
      /\[.*\]\(.*\)/ // Links
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(template.message)) {
        errors.push('El mensaje contiene caracteres no permitidos por WhatsApp');
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getAvailableTemplates() {
    return Object.keys(this.defaultTemplates);
  }
}

