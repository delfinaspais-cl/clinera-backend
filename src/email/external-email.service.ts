import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface WelcomeEmailData {
  to: string;
  name: string;
  email: string;
  password: string;
  role: string;
  clinicaName?: string;
  clinicaUrl?: string;
}

@Injectable()
export class ExternalEmailService {
  private readonly logger = new Logger(ExternalEmailService.name);
  private readonly baseUrl = 'https://fluentia-emails-staging.up.railway.app';
  private readonly registerUrl = `${this.baseUrl}/auth/register`;
  private readonly sendEmailUrl = `${this.baseUrl}/emails/send`;

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log(`📧 Iniciando proceso de envío de email a ${data.to} via microservicio`);
      
      // Paso 1: Registrar en el microservicio
      this.logger.log(`1️⃣ Registrando usuario en el microservicio de emails...`);
      
      const registerPayload = {
        name: data.name,
        email: data.email,
        password: data.password
      };
      
      this.logger.debug('Payload de registro:', JSON.stringify(registerPayload, null, 2));
      
      const registerResponse = await axios.post(this.registerUrl, registerPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
      if (registerResponse.status >= 200 && registerResponse.status < 300) {
        this.logger.log(`✅ Usuario registrado exitosamente en el microservicio: ${JSON.stringify(registerResponse.data)}`);
      } else {
        throw new Error(`Error en registro: ${registerResponse.status} - ${registerResponse.statusText}`);
      }
      
      // Paso 2: Enviar email
      this.logger.log(`2️⃣ Enviando email de bienvenida...`);
      
      const emailPayload = {
        to: data.to,
        subject: `Bienvenido/a a ${data.clinicaName || 'Clinera'} - Tus credenciales de acceso`,
        text: `Hola ${data.name},

Bienvenido/a a ${data.clinicaName || 'Clinera'}!

Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales de acceso:

📧 Email: ${data.email}
🔑 Contraseña: ${data.password}
👤 Rol: ${data.role}

Para acceder al sistema, visita: ${this.getLoginUrl(data.clinicaUrl)}

Por seguridad, te recomendamos cambiar tu contraseña en tu primer inicio de sesión.

¡Que tengas un excelente día!

Equipo de ${data.clinicaName || 'Clinera'}`
      };
      
      this.logger.debug('Payload del email:', JSON.stringify(emailPayload, null, 2));
      
      // Extraer el token de acceso de la respuesta de registro
      const accessToken = registerResponse.data.data.accessToken;
      
      const emailResponse = await axios.post(this.sendEmailUrl, emailPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        timeout: 10000,
      });
      
      if (emailResponse.status >= 200 && emailResponse.status < 300) {
        this.logger.log(`✅ Email de bienvenida enviado exitosamente a ${data.to} via microservicio`);
        return { success: true };
      } else {
        throw new Error(`Error enviando email: ${emailResponse.status} - ${emailResponse.statusText}`);
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

  private getLoginUrl(clinicaUrl?: string): string {
    // URL del frontend con la URL de la clínica
    const baseUrl = 'https://app.clinera.io';
    if (clinicaUrl) {
      return `${baseUrl}/${clinicaUrl}`;
    }
    return `${baseUrl}/login`;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log('🔍 Probando conexión con el microservicio de emails...');
      
      const response = await axios.get(`${this.baseUrl}/health`, {
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

