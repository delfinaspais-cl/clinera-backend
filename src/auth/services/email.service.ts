import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configurar el transporter de email
    // Para desarrollo, usamos Ethereal Email (email de prueba)
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

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string,
  ): Promise<boolean> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'https://app.clinera.io'}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Clinera" <noreply@clinera.com>',
        to: email,
        subject: 'Recuperación de contraseña - Clinera',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3B82F6;">Recuperación de contraseña</h2>
            <p>Hola ${userName},</p>
            <p>Has solicitado restablecer tu contraseña en Clinera.</p>
            <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Restablecer contraseña
              </a>
            </div>
            <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
            <p>Este enlace expirará en 1 hora por seguridad.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Este es un email automático, por favor no respondas a este mensaje.
            </p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error al enviar email:', error);
      return false;
    }
  }

  async sendPasswordChangedEmail(
    email: string,
    userName: string,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"Clinera" <noreply@clinera.com>',
        to: email,
        subject: 'Contraseña actualizada - Clinera',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Contraseña actualizada</h2>
            <p>Hola ${userName},</p>
            <p>Tu contraseña ha sido actualizada exitosamente.</p>
            <p>Si no realizaste este cambio, contacta inmediatamente con soporte.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Este es un email automático, por favor no respondas a este mensaje.
            </p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email de confirmación enviado:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error al enviar email de confirmación:', error);
      return false;
    }
  }
}
