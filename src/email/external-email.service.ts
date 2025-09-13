import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface WelcomeEmailData {
  to: string;
  name: string;
  email: string;
  password: string;
  role: string;
  clinicaName?: string;
}

@Injectable()
export class ExternalEmailService {
  private readonly logger = new Logger(ExternalEmailService.name);
  private readonly emailServiceUrl = 'https://fluentia-emails-staging.up.railway.app/emails/send';

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log(`📧 Enviando email de bienvenida a ${data.to} via microservicio externo`);
      
      const emailPayload = {
        to: data.to,
        subject: `Bienvenido/a a ${data.clinicaName || 'Clinera'} - Tus credenciales de acceso`,
        text: `Hola ${data.name},

Bienvenido/a a ${data.clinicaName || 'Clinera'}!

Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales de acceso:

📧 Email: ${data.email}
🔑 Contraseña: ${data.password}
👤 Rol: ${data.role}

Para acceder al sistema, visita: ${this.getLoginUrl(data.clinicaName)}

Por seguridad, te recomendamos cambiar tu contraseña en tu primer inicio de sesión.

¡Que tengas un excelente día!

Equipo de ${data.clinicaName || 'Clinera'}`
      };

      this.logger.debug('Payload del email:', JSON.stringify(emailPayload, null, 2));

      const response = await axios.post(this.emailServiceUrl, emailPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 segundos timeout
      });

      if (response.status >= 200 && response.status < 300) {
        this.logger.log(`✅ Email de bienvenida enviado exitosamente a ${data.to}`);
        return { success: true };
      } else {
        this.logger.error(`❌ Error en respuesta del microservicio: ${response.status} - ${response.statusText}`);
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

    } catch (error) {
      this.logger.error(`❌ Error al enviar email de bienvenida a ${data.to}:`, error.message);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // El servidor respondió con un código de error
          this.logger.error(`Respuesta del servidor: ${error.response.status} - ${error.response.statusText}`);
          this.logger.error(`Datos de respuesta:`, error.response.data);
          return { 
            success: false, 
            error: `Error del servidor: ${error.response.status} - ${JSON.stringify(error.response.data)}` 
          };
        } else if (error.request) {
          // La petición fue hecha pero no se recibió respuesta
          this.logger.error('No se recibió respuesta del servidor');
          return { success: false, error: 'No se pudo conectar con el servidor de emails' };
        } else {
          // Error al configurar la petición
          this.logger.error('Error de configuración:', error.message);
          return { success: false, error: `Error de configuración: ${error.message}` };
        }
      }
      
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  private getLoginUrl(clinicaName?: string): string {
    // Aquí puedes personalizar la URL de login según tu frontend
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/login`;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log('🔍 Probando conexión con el microservicio de emails...');
      
      const response = await axios.get(this.emailServiceUrl.replace('/emails/health', '/health'), {
        timeout: 5000,
      });

      if (response.status >= 200 && response.status < 300) {
        this.logger.log('✅ Conexión con microservicio de emails exitosa');
        return { success: true };
      } else {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

    } catch (error) {
      this.logger.error('❌ Error al probar conexión con microservicio de emails:', error.message);
      return { success: false, error: error.message };
    }
  }
}

