import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AppointmentWebhookData {
  patient: {
    full_name: string;
    phone: string;
    email: string;
    patient_id?: string;
  };
  booking: {
    id: string;
    date: string;
    time: string;
    branch?: string;
    professional: string;
    treatment?: string;
  };
  confirm_url?: string;
  cancel_url?: string;
  reschedule_url?: string;
  metadata: {
    source: string;
    confirmationToken?: string;
    [key: string]: any;
  };
}

@Injectable()
export class AppointmentWebhookService {
  private readonly logger = new Logger(AppointmentWebhookService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Envía un webhook cuando se crea una cita/turno
   * @param turno - El turno creado
   * @param clinicaId - El ID de la clínica
   */
  async sendAppointmentCreatedWebhook(turno: any, clinicaId: string): Promise<void> {
    try {
      const webhookUrl = this.getWebhookUrl(clinicaId);
      
      if (!webhookUrl) {
        this.logger.warn(`No webhook URL configured for clinic ${clinicaId}`);
        return;
      }

      const webhookData = this.formatWebhookData(turno, clinicaId);
      
      this.logger.log(`📤 Sending webhook to: ${webhookUrl}`);
      this.logger.debug(`Webhook data: ${JSON.stringify(webhookData, null, 2)}`);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      if (response.ok) {
        this.logger.log(`✅ Webhook sent successfully for appointment ${turno.id}`);
      } else {
        const errorText = await response.text();
        this.logger.error(
          `❌ Webhook failed with status ${response.status}: ${errorText}`,
        );
      }
    } catch (error) {
      // No lanzar error para no afectar el flujo principal de creación de citas
      this.logger.error(`❌ Error sending webhook: ${error.message}`, error.stack);
    }
  }

  /**
   * Construye la URL del webhook con el businessId
   */
  private getWebhookUrl(clinicaId: string): string | null {
    // Obtener la URL base del webhook desde variables de entorno
    const baseUrl = this.configService.get<string>('WEBHOOK_BASE_URL') || 
                    'https://fluentia-api-develop-latest.up.railway.app/webhooks/appointments';
    
    if (!baseUrl) {
      return null;
    }
 
    return `${baseUrl}/${clinicaId}`;
  }

  /**
   * Formatea los datos del turno al formato esperado por el webhook
   */
  private formatWebhookData(turno: any, clinicaId: string): AppointmentWebhookData {
    // Formatear fecha (YYYY-MM-DD)
    const fecha = new Date(turno.fecha);
    const fechaFormateada = fecha.toISOString().split('T')[0];

    // Obtener el nombre de la clínica y sucursal si está disponible
    const clinicaName = turno.clinica?.name || 'Clínica';
    const sucursal = turno.sucursal || clinicaName;

    // Construir URLs de confirmación, cancelación y reagendamiento
    const backendUrl = this.configService.get<string>('BACKEND_URL') || 'https://api.clinera.com';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 
                        this.configService.get<string>('APP_URL') || 
                        'https://app.clinera.com';
    
    // URLs usando token (GET endpoints - funcionan directo en navegador)
    const confirmUrl = turno.confirmationToken 
      ? `${backendUrl}/api/turnos/confirmar/${turno.confirmationToken}`
      : `${frontendUrl}/confirm?booking=${turno.id}`;
    
    const cancelUrl = turno.confirmationToken
      ? `${backendUrl}/api/turnos/cancelar/${turno.confirmationToken}`
      : `${frontendUrl}/cancel?booking=${turno.id}`;
    
    const rescheduleUrl = `${frontendUrl}/reschedule?booking=${turno.id}`;

    return {
      patient: {
        full_name: turno.paciente,
        phone: turno.telefono || '',
        email: turno.email,
        patient_id: turno.id,
      },
      booking: {
        id: turno.id,
        date: fechaFormateada,
        time: turno.hora,
        branch: sucursal,
        professional: turno.doctor || turno.profesional || 'Por asignar',
        treatment: turno.servicio || turno.motivo || 'Consulta',
      },
      confirm_url: confirmUrl,
      cancel_url: cancelUrl,
      reschedule_url: rescheduleUrl,
      metadata: {
        source: 'clinera',
        clinicaId: clinicaId,
        confirmationToken: turno.confirmationToken, // Incluir el token en metadatos
        estado: turno.estado,
        origen: turno.origen || 'web',
        ...(turno.ate && { ate: turno.ate }),
        ...(turno.duracionMin && { duracionMin: turno.duracionMin }),
        createdAt: turno.createdAt || new Date().toISOString(),
      },
    };
  }
}

