import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface EmailData {
  to: string;
  subject: string;
  template?: string;
  data?: any;
  html?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configurar el transporter de email
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER || 'test@ethereal.email',
        pass: process.env.SMTP_PASS || 'test123',
      },
    });
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      let html: string;

      if (emailData.html) {
        html = emailData.html;
      } else if (emailData.template) {
        html = this.getTemplate(emailData.template, emailData.data);
      } else {
        throw new Error('Se requiere template o html');
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Clinera" <noreply@clinera.com>',
        to: emailData.to,
        subject: emailData.subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error al enviar email:', error);
      return false;
    }
  }

  private getTemplate(template: string, data: any): string {
    switch (template) {
      case 'contact-confirmation':
        return this.getContactConfirmationTemplate(data);
      case 'contact-notification':
        return this.getContactNotificationTemplate(data);
      case 'password-reset':
        return this.getPasswordResetTemplate(data);
      case 'password-changed':
        return this.getPasswordChangedTemplate(data);
      default:
        throw new Error(`Template '${template}' no encontrado`);
    }
  }

  private getContactConfirmationTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">Clinera</h1>
            <p style="color: #6B7280; margin: 10px 0 0 0;">Gestión Médica Inteligente</p>
          </div>
          
          <h2 style="color: #1F2937; margin-bottom: 20px;">¡Consulta recibida!</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Hola <strong>${data.nombre}</strong>,
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Hemos recibido tu consulta sobre <strong>${data.tipoConsulta}</strong> y queremos confirmarte que la estamos procesando.
          </p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1F2937; margin: 0 0 15px 0;">Detalles de tu consulta:</h3>
            <p style="color: #374151; margin: 5px 0;"><strong>Tipo:</strong> ${data.tipoConsulta}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Fecha:</strong> ${new Date(data.fecha).toLocaleDateString('es-ES')}</p>
          </div>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Nuestro equipo se pondrá en contacto contigo en las próximas <strong>24 horas</strong> para responder a tu consulta.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://clinera.com'}" 
               style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Visitar Clinera
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
          
          <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 0;">
            Este es un email automático, por favor no respondas a este mensaje.<br>
            Si tienes alguna pregunta, contacta con nuestro equipo de soporte.
          </p>
        </div>
      </div>
    `;
  }

  private getContactNotificationTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">Nueva Consulta - Clinera</h1>
            <p style="color: #6B7280; margin: 10px 0 0 0;">Sistema de Gestión Médica</p>
          </div>
          
          <div style="background-color: ${this.getPriorityColor(data.priority)}; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: white; margin: 0; font-size: 18px;">
              Prioridad: ${data.priority.toUpperCase()}
            </h2>
          </div>
          
          <h3 style="color: #1F2937; margin-bottom: 20px;">Información del Cliente:</h3>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #374151; margin: 5px 0;"><strong>Nombre:</strong> ${data.nombre}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Teléfono:</strong> ${data.telefono || 'No especificado'}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Empresa:</strong> ${data.empresa || 'No especificado'}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Tipo de Consulta:</strong> ${data.tipoConsultaLabel}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Plan de Interés:</strong> ${data.planLabel}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Fecha:</strong> ${new Date(data.fecha).toLocaleDateString('es-ES')}</p>
          </div>
          
          <h3 style="color: #1F2937; margin-bottom: 15px;">Mensaje:</h3>
          <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B;">
            <p style="color: #374151; line-height: 1.6; margin: 0;">${data.mensaje}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.ADMIN_URL || 'https://admin.clinera.com'}/contactos/${data.id}" 
               style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Ver en Panel de Administración
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
          
          <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 0;">
            ID de Consulta: ${data.id}<br>
            Este email fue generado automáticamente por el sistema de Clinera.
          </p>
        </div>
      </div>
    `;
  }

  private getPasswordResetTemplate(data: any): string {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${data.resetToken}`;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">Clinera</h1>
            <p style="color: #6B7280; margin: 10px 0 0 0;">Gestión Médica Inteligente</p>
          </div>
          
          <h2 style="color: #1F2937; margin-bottom: 20px;">Recuperación de contraseña</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Hola <strong>${data.userName}</strong>,
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Has solicitado restablecer tu contraseña en Clinera.
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Haz clic en el siguiente enlace para crear una nueva contraseña:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Restablecer contraseña
            </a>
          </div>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Si no solicitaste este cambio, puedes ignorar este email.
          </p>
          
          <p style="color: #EF4444; font-weight: bold;">
            Este enlace expirará en 1 hora por seguridad.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
          
          <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 0;">
            Este es un email automático, por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    `;
  }

  private getPasswordChangedTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">Clinera</h1>
            <p style="color: #6B7280; margin: 10px 0 0 0;">Gestión Médica Inteligente</p>
          </div>
          
          <h2 style="color: #10B981; margin-bottom: 20px;">Contraseña actualizada</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Hola <strong>${data.userName}</strong>,
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Tu contraseña ha sido actualizada exitosamente.
          </p>
          
          <div style="background-color: #D1FAE5; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981; margin: 20px 0;">
            <p style="color: #065F46; margin: 0; font-weight: bold;">
              ✅ Cambio realizado con éxito
            </p>
          </div>
          
          <p style="color: #EF4444; font-weight: bold;">
            Si no realizaste este cambio, contacta inmediatamente con soporte.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
          
          <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 0;">
            Este es un email automático, por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    `;
  }

  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'alta':
        return '#EF4444';
      case 'media':
        return '#F59E0B';
      case 'baja':
        return '#10B981';
      default:
        return '#6B7280';
    }
  }

  // Métodos legacy para compatibilidad
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Recuperación de contraseña - Clinera',
      template: 'password-reset',
      data: { resetToken, userName },
    });
  }

  async sendPasswordChangedEmail(
    email: string,
    userName: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Contraseña actualizada - Clinera',
      template: 'password-changed',
      data: { userName },
    });
  }
}
