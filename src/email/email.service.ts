import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface EmailData {
  to: string;
  subject: string;
  template?: string;
  data?: any;
  html?: string;
  text?: string;
  variables?: Record<string, any>;
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

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log(`📧 EmailService: Iniciando envío de email a ${emailData.to}`);
      console.log(`📧 EmailService: Asunto: ${emailData.subject}`);
      console.log(`📧 EmailService: Template: ${emailData.template || 'HTML directo'}`);
      
      let html: string;
      let text: string;

      // Priorizar template sobre HTML para emails de confirmación de turnos
      if (emailData.template && emailData.template === 'turno-confirmation') {
        console.log(`📧 EmailService: Forzando uso de template turno-confirmation (ignorando HTML directo)`);
        console.log(`📧 EmailService: Variables/Data del template:`, emailData.variables || emailData.data);
        html = this.getTemplate(emailData.template, emailData.variables || emailData.data);
        console.log(`📧 EmailService: Template generado exitosamente`);
      } else if (emailData.html) {
        html = emailData.html;
        console.log(`📧 EmailService: Usando HTML directo`);
      } else if (emailData.template) {
        console.log(`📧 EmailService: Generando template ${emailData.template}`);
        console.log(`📧 EmailService: Variables/Data del template:`, emailData.variables || emailData.data);
        html = this.getTemplate(emailData.template, emailData.variables || emailData.data);
        console.log(`📧 EmailService: Template generado exitosamente`);
      } else {
        throw new Error('Se requiere template o html');
      }

      // Si se proporciona texto plano, usarlo; si no, generar uno básico desde el HTML
      if (emailData.text) {
        text = emailData.text;
      } else {
        text = this.htmlToText(html);
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Clinera" <noreply@clinera.com>',
        to: emailData.to,
        subject: emailData.subject,
        html,
        text,
      };

      console.log(`📧 EmailService: Configuración SMTP:`, {
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: process.env.SMTP_PORT || '587',
        user: process.env.SMTP_USER || 'test@ethereal.email',
        from: mailOptions.from
      });

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ EmailService: Email enviado exitosamente - MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ EmailService: Error al enviar email:', error);
      console.error('❌ EmailService: Error details:', {
        message: error.message,
        code: error.code,
        response: error.response
      });
      return { success: false, error: error.message };
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
      case 'turno-confirmation':
        return this.getTurnoConfirmationTemplate(data);
      case 'welcome-credentials':
        return this.getWelcomeCredentialsTemplate(data);
      case 'user-welcome':
        return this.getUserWelcomeTemplate(data);
      case 'admin-credentials':
        return this.getAdminCredentialsTemplate(data);
      case 'email-verification':
        return this.getEmailVerificationTemplate(data);
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
            <p style="color: #374151; margin: 5px 0;"><strong>Fecha:</strong> ${this.formatDateForEmail(data.fecha)}</p>
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
            <p style="color: #374151; margin: 5px 0;"><strong>Fecha:</strong> ${this.formatDateForEmail(data.fecha)}</p>
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

  // Función helper para formatear fechas de manera consistente
  public formatDateForEmail(fecha: any): string {
    console.log('🔍 [EMAIL-DEBUG] formatDateForEmail - Fecha recibida:', {
      fecha: fecha,
      tipo: typeof fecha,
      timestamp: new Date().toISOString()
    });

    if (!fecha) {
      console.log('🔍 [EMAIL-DEBUG] Fecha vacía, retornando "No especificado"');
      return 'No especificado';
    }
    
    try {
      // Si la fecha viene como string, crear un objeto Date
      const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
      
      console.log('🔍 [EMAIL-DEBUG] Fecha procesada:', {
        fechaOriginal: fecha,
        fechaObj: fechaObj,
        fechaObjISO: fechaObj.toISOString(),
        fechaObjUTC: fechaObj.toUTCString(),
        fechaObjLocal: fechaObj.toString(),
        esValida: !isNaN(fechaObj.getTime())
      });
      
      // Verificar que la fecha es válida
      if (isNaN(fechaObj.getTime())) {
        console.warn('⚠️ [EMAIL-DEBUG] Fecha inválida recibida:', fecha);
        return fecha.toString();
      }
      
      // Formatear la fecha en español sin conversión de zona horaria
      const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC' // Usar UTC para evitar conversiones de zona horaria
      });

      console.log('🔍 [EMAIL-DEBUG] Fecha formateada:', {
        fechaFormateada: fechaFormateada,
        fechaOriginal: fecha,
        fechaObjISO: fechaObj.toISOString()
      });

      return fechaFormateada;
    } catch (error) {
      console.error('❌ [EMAIL-DEBUG] Error formateando fecha en email:', error);
      console.error('❌ [EMAIL-DEBUG] Fecha que causó el error:', fecha);
      return fecha.toString(); // Fallback a la fecha original
    }
  }

  private getTurnoConfirmationTemplate(data: any): string {
    console.log('🔍 [EMAIL-DEBUG] getTurnoConfirmationTemplate - Datos recibidos:', {
      data: data,
      fecha: data.fecha,
      tipoFecha: typeof data.fecha,
      timestamp: new Date().toISOString()
    });

    // Formatear la fecha correctamente para evitar problemas de zona horaria
    const fechaFormateada = this.formatDateForEmail(data.fecha);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">Clinera</h1>
            <p style="color: #6B7280; margin: 10px 0 0 0;">Gestión Médica Inteligente</p>
          </div>
          
          <h2 style="color: #10B981; margin-bottom: 20px;">✅ Cita Confirmada</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Estimado/a <strong>${data.paciente || 'Paciente'}</strong>,
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Le confirmamos que su cita ha sido agendada exitosamente.
          </p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1F2937; margin: 0 0 15px 0;">DETALLES DE LA CITA:</h3>
            <p style="color: #374151; margin: 5px 0;"><strong>Fecha:</strong> ${fechaFormateada}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Hora:</strong> ${data.hora || 'No especificado'}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Profesional:</strong> ${data.profesional || 'No especificado'}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Tratamiento:</strong> ${data.tratamiento || 'No especificado'}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Sucursal:</strong> ${data.sucursal || 'No especificado'}</p>
          </div>
          
          ${data.ventaId ? `
          <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1F2937; margin: 0 0 15px 0;">INFORMACIÓN DE LA VENTA:</h3>
            <p style="color: #374151; margin: 5px 0;"><strong>ID de Venta:</strong> ${data.ventaId}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Monto Total:</strong> $${data.montoTotal || '0'}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Estado de Pago:</strong> ${data.estadoPago || 'pendiente'}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Medio de Pago:</strong> ${data.medioPago || 'No especificado'}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Sesiones:</strong> ${data.sesiones || '1'}</p>
          </div>
          ` : ''}
          
          ${data.turnoId ? `
          <div style="background-color: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1F2937; margin: 0 0 15px 0;">INFORMACIÓN ADICIONAL:</h3>
            <p style="color: #374151; margin: 5px 0;"><strong>ID del Turno:</strong> ${data.turnoId}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Fecha de Creación:</strong> ${this.formatDateForEmail(data.fechaCreacion || new Date())}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #D1FAE5; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981; margin: 20px 0;">
            <p style="color: #065F46; margin: 0; font-weight: bold;">
              📅 Por favor, llegue 10 minutos antes de su cita.
            </p>
          </div>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Si necesita reprogramar o cancelar su cita, por favor contáctenos.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            ${data.direccion ? `
            <a href="https://maps.google.com/maps?q=${encodeURIComponent(data.direccion)}" 
               target="_blank"
               style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">
              📍 Ver en Google Maps
            </a>
            ` : ''}
            
            <a href="${this.generateGoogleCalendarLink(data)}" 
               target="_blank"
               style="background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px;">
              📅 Agregar a Google Calendar
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

  private getWelcomeCredentialsTemplate(data: any): string {
    const loginUrl = `${process.env.FRONTEND_URL || 'https://clinera.com'}/login`;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">${data.clinicaName || 'Clinera'}</h1>
            <p style="color: #6B7280; margin: 10px 0 0 0;">Sistema de Gestión Médica</p>
          </div>
          
          <h2 style="color: #10B981; margin-bottom: 20px;">¡Bienvenido/a a la clínica!</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Hola <strong>${data.userName}</strong>,
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Te damos la bienvenida a <strong>${data.clinicaName || 'nuestra clínica'}</strong>. 
            Tu cuenta ha sido creada exitosamente y ya puedes acceder al sistema.
          </p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1F2937; margin: 0 0 15px 0;">TUS CREDENCIALES DE ACCESO:</h3>
            <div style="background-color: #EFF6FF; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6;">
              <p style="color: #374151; margin: 5px 0;"><strong>👤 Usuario:</strong> ${data.username || data.email}</p>
              <p style="color: #374151; margin: 5px 0;"><strong>🔑 Contraseña:</strong> ${data.password}</p>
              <p style="color: #374151; margin: 5px 0;"><strong>👥 Rol:</strong> ${this.getRoleDisplayName(data.role)}</p>
            </div>
            <div style="background-color: #FEF3C7; padding: 10px; border-radius: 6px; margin-top: 10px;">
              <p style="color: #92400E; margin: 0; font-size: 14px;">
                <strong>💡 Importante:</strong> Usa tu <strong>USUARIO</strong> (no el email) para iniciar sesión en el sistema.
              </p>
            </div>
          </div>
          
          <div style="background-color: #D1FAE5; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981; margin: 20px 0;">
            <p style="color: #065F46; margin: 0; font-weight: bold;">
              🔐 Por seguridad, te recomendamos cambiar tu contraseña en tu primer acceso.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Acceder al Sistema
            </a>
          </div>
          
          <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
            <h4 style="color: #1F2937; margin: 0 0 10px 0;">📋 Próximos pasos:</h4>
            <ul style="color: #374151; margin: 0; padding-left: 20px;">
              <li>Inicia sesión con las credenciales proporcionadas</li>
              <li>Cambia tu contraseña por una más segura</li>
              <li>Completa tu perfil si es necesario</li>
              <li>Explora las funcionalidades disponibles según tu rol</li>
            </ul>
          </div>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar con el administrador de la clínica.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
          
          <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 0;">
            Este es un email automático, por favor no respondas a este mensaje.<br>
            Si tienes alguna pregunta, contacta con el administrador de la clínica.
          </p>
        </div>
      </div>
    `;
  }

  private getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'ADMIN': 'Administrador',
      'PROFESSIONAL': 'Profesional',
      'SECRETARY': 'Secretario',
      'PATIENT': 'Paciente',
      'OWNER': 'Propietario'
    };
    
    return roleMap[role] || role || 'No especificado';
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  // Métodos legacy para compatibilidad
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string,
  ): Promise<boolean> {
    const result = await this.sendEmail({
      to: email,
      subject: 'Recuperación de contraseña - Clinera',
      template: 'password-reset',
      data: { resetToken, userName },
    });
    return result.success;
  }

  async sendPasswordChangedEmail(
    email: string,
    userName: string,
  ): Promise<boolean> {
    const result = await this.sendEmail({
      to: email,
      subject: 'Contraseña actualizada - Clinera',
      template: 'password-changed',
      data: { userName },
    });
    return result.success;
  }

  async sendWelcomeCredentialsEmail(
    email: string,
    password: string,
    userName: string,
    role: string,
    clinicaName?: string,
    username?: string,
  ): Promise<boolean> {
    console.log(`📧 EmailService: Enviando email de bienvenida a ${email}`);
    console.log(`📧 EmailService: Datos - userName: ${userName}, role: ${role}, clinicaName: ${clinicaName}, username: ${username}`);
    
    const result = await this.sendEmail({
      to: email,
      subject: `Bienvenido/a a ${clinicaName || 'Clinera'} - Tus credenciales de acceso`,
      template: 'welcome-credentials',
      data: { 
        email, 
        password, 
        userName, 
        role, 
        clinicaName,
        username 
      },
    });
    
    console.log(`📧 EmailService: Resultado del envío:`, result);
    return result.success;
  }

  // Nuevos métodos para el sistema de usuarios
  async sendWelcomeEmail(
    email: string,
    userName: string,
    username: string,
    password: string,
  ): Promise<boolean> {
    const result = await this.sendEmail({
      to: email,
      subject: '¡Bienvenido a Clinera! - Tu cuenta ha sido creada',
      template: 'user-welcome',
      data: { 
        email, 
        userName, 
        username,
        password 
      },
    });
    return result.success;
  }

  async sendAdminCredentialsEmail(
    email: string,
    password: string,
    userName: string,
    clinicaName: string,
    clinicaUrl: string,
  ): Promise<boolean> {
    const result = await this.sendEmail({
      to: email,
      subject: `Credenciales de administrador - ${clinicaName}`,
      template: 'admin-credentials',
      data: { 
        email, 
        password, 
        userName, 
        clinicaName,
        clinicaUrl 
      },
    });
    return result.success;
  }

  private getUserWelcomeTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">Clinera</h1>
            <p style="color: #6B7280; margin: 10px 0 0 0;">Gestión Médica Inteligente</p>
          </div>
          
          <h2 style="color: #10B981; margin-bottom: 20px;">¡Bienvenido a Clinera!</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Hola <strong>${data.userName}</strong>,
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            ¡Tu cuenta en Clinera ha sido creada exitosamente! Ahora puedes crear y administrar tus clínicas médicas.
          </p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1F2937; margin: 0 0 15px 0;">TUS CREDENCIALES DE ACCESO:</h3>
            <div style="background-color: #EFF6FF; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6;">
              <p style="color: #374151; margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
              <p style="color: #374151; margin: 5px 0;"><strong>Usuario:</strong> ${data.username}</p>
              <p style="color: #374151; margin: 5px 0;"><strong>Contraseña:</strong> ${data.password}</p>
              <p style="color: #374151; margin: 5px 0;"><strong>Rol:</strong> Propietario</p>
            </div>
          </div>
          
          <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
            <p style="color: #92400E; margin: 0; font-weight: bold;">
              🔐 ¡IMPORTANTE! Guarda estas credenciales en un lugar seguro. Las necesitarás para acceder a tu cuenta.
            </p>
          </div>
          
          <div style="background-color: #D1FAE5; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981; margin: 20px 0;">
            <h4 style="color: #1F2937; margin: 0 0 10px 0;">🎉 ¿Qué puedes hacer ahora?</h4>
            <ul style="color: #374151; margin: 0; padding-left: 20px;">
              <li>Crear tu primera clínica médica</li>
              <li>Configurar especialidades y tratamientos</li>
              <li>Gestionar turnos y citas</li>
              <li>Administrar profesionales</li>
              <li>Generar reportes y estadísticas</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://clinera.com'}/dashboard" 
               style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Ir a mi Dashboard
            </a>
          </div>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar con nuestro equipo de soporte.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
          
          <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 0;">
            Este es un email automático, por favor no respondas a este mensaje.<br>
            Si tienes alguna pregunta, contacta con nuestro equipo de soporte.
          </p>
        </div>
      </div>
    `;
  }

  private getAdminCredentialsTemplate(data: any): string {
    const loginUrl = `${process.env.FRONTEND_URL || 'https://clinera.com'}/clinica/${data.clinicaUrl}/login`;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">${data.clinicaName}</h1>
            <p style="color: #6B7280; margin: 10px 0 0 0;">Sistema de Gestión Médica</p>
          </div>
          
          <h2 style="color: #10B981; margin-bottom: 20px;">Credenciales de Administrador</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Hola <strong>${data.userName}</strong>,
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Has sido asignado como administrador de <strong>${data.clinicaName}</strong>. 
            Aquí tienes tus credenciales para acceder al sistema.
          </p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1F2937; margin: 0 0 15px 0;">TUS CREDENCIALES DE ACCESO:</h3>
            <div style="background-color: #EFF6FF; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6;">
              <p style="color: #374151; margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
              <p style="color: #374151; margin: 5px 0;"><strong>Contraseña:</strong> ${data.password}</p>
              <p style="color: #374151; margin: 5px 0;"><strong>Clínica:</strong> ${data.clinicaName}</p>
              <p style="color: #374151; margin: 5px 0;"><strong>URL:</strong> ${data.clinicaUrl}</p>
            </div>
          </div>
          
          <div style="background-color: #D1FAE5; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981; margin: 20px 0;">
            <p style="color: #065F46; margin: 0; font-weight: bold;">
              🔐 Por seguridad, te recomendamos cambiar tu contraseña en tu primer acceso.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Acceder a ${data.clinicaName}
            </a>
          </div>
          
          <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
            <h4 style="color: #1F2937; margin: 0 0 10px 0;">📋 Como administrador puedes:</h4>
            <ul style="color: #374151; margin: 0; padding-left: 20px;">
              <li>Gestionar turnos y citas</li>
              <li>Administrar profesionales</li>
              <li>Configurar especialidades y tratamientos</li>
              <li>Ver reportes y estadísticas</li>
              <li>Gestionar usuarios de la clínica</li>
            </ul>
          </div>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Si tienes alguna pregunta o necesitas ayuda, contacta con el propietario de la clínica.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
          
          <p style="color: #6B7280; font-size: 14px; text-align: center; margin: 0;">
            Este es un email automático, por favor no respondas a este mensaje.<br>
            Si tienes alguna pregunta, contacta con el propietario de la clínica.
          </p>
        </div>
      </div>
    `;
  }

  private getEmailVerificationTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7c3aed; font-size: 24px; font-weight: bold; margin: 0;">Clinera</h1>
          </div>
          
          <h2>Verificación de Email</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Hola,
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Para completar tu registro en Clinera, por favor ingresa el siguiente código de verificación:
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #7c3aed; font-size: 32px; margin: 0; letter-spacing: 4px; font-weight: bold;">${data.code}</h1>
          </div>
          
          <p style="color: #dc2626; font-weight: bold;">
            Este código expira en 10 minutos.
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Si no solicitaste este código, puedes ignorar este email.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
            Este email fue enviado automáticamente. Por favor no respondas.<br>
            © 2024 Clinera. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `;
  }

  async sendVerificationEmail(
    email: string,
    code: string,
  ): Promise<boolean> {
    const result = await this.sendEmail({
      to: email,
      subject: 'Verificación de Email - Clinera',
      template: 'email-verification',
      data: { code },
    });
    return result.success;
  }

  private generateGoogleCalendarLink(data: any): string {
    try {
      // Crear fecha y hora para Google Calendar
      const fecha = new Date(data.fecha);
      const [hora, minutos] = (data.hora || '10:00').split(':');
      
      // Establecer la fecha y hora de inicio
      const startDate = new Date(fecha);
      startDate.setHours(parseInt(hora), parseInt(minutos || '0'), 0, 0);
      
      // Establecer la fecha y hora de fin (1 hora después)
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1);
      
      // Formatear fechas para Google Calendar (ISO 8601)
      const startDateISO = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDateISO = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      // Crear el título del evento
      const title = `Cita médica - ${data.paciente || 'Paciente'}`;
      
      // Crear la descripción del evento
      const description = `Cita médica con ${data.profesional || 'Profesional'}\\n\\n` +
        `Tratamiento: ${data.tratamiento || 'Consulta'}\\n` +
        `Sucursal: ${data.sucursal || 'Sede Principal'}\\n` +
        `Paciente: ${data.paciente || 'Paciente'}\\n` +
        `Email: ${data.email || ''}\\n\\n` +
        `Por favor, llegue 10 minutos antes de su cita.`;
      
      // Crear la ubicación
      const location = data.direccion || data.sucursal || 'Sede Principal';
      
      // Generar el enlace de Google Calendar
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&` +
        `text=${encodeURIComponent(title)}&` +
        `dates=${startDateISO}/${endDateISO}&` +
        `details=${encodeURIComponent(description)}&` +
        `location=${encodeURIComponent(location)}`;
      
      return googleCalendarUrl;
    } catch (error) {
      console.error('Error generando enlace de Google Calendar:', error);
      // Fallback: enlace básico sin parámetros
      return 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    }
  }
}
