# Sistema de WhatsApp Business API

## Descripción
Este módulo implementa una integración completa con WhatsApp Business API para enviar mensajes, gestionar plantillas y procesar webhooks en tiempo real.

## Características

### ✅ Implementado
- ✅ Envío de mensajes de texto
- ✅ Envío de mensajes con plantillas aprobadas
- ✅ Envío de archivos multimedia (imágenes, documentos, audio, video)
- ✅ Gestión de plantillas de mensajes
- ✅ Webhooks para respuestas y estados
- ✅ Respuestas automáticas inteligentes
- ✅ Verificación de firmas de webhook
- ✅ Historial completo de mensajes
- ✅ API REST completa con documentación Swagger

### 🔄 En Desarrollo
- 🔄 Mensajes en lote optimizados
- 🔄 Plantillas dinámicas avanzadas
- 🔄 Analytics de mensajes
- 🔄 Integración con IA para respuestas

## Configuración

### 1. Variables de Entorno
Agrega las siguientes variables a tu archivo `.env`:

```env
# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_API_VERSION=v18.0
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

### 2. Configuración de WhatsApp Business API
1. Crea una cuenta en [Meta for Developers](https://developers.facebook.com/)
2. Configura una aplicación de WhatsApp Business
3. Obtén las credenciales necesarias
4. Configura el webhook URL en tu aplicación

## Endpoints de la API

### Enviar Mensaje
```http
POST /whatsapp/send-message
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "5491112345678",
  "messageType": "text",
  "messageText": "Hola, tu turno ha sido confirmado",
  "clinicaId": "clinica123"
}
```

### Enviar Mensaje de Texto
```http
POST /whatsapp/send-text
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "5491112345678",
  "text": "Hola, tu turno ha sido confirmado",
  "clinicaId": "clinica123"
}
```

### Enviar Mensaje con Plantilla
```http
POST /whatsapp/send-template
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "5491112345678",
  "templateName": "appointment_confirmation",
  "templateParams": {
    "1": "Dr. García",
    "2": "15/01/2024",
    "3": "10:00"
  },
  "clinicaId": "clinica123"
}
```

### Crear Plantilla
```http
POST /whatsapp/create-template
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "appointment_confirmation",
  "language": "es",
  "category": "utility",
  "components": "{\"header\": {\"type\": \"text\", \"text\": \"Confirmación de Turno\"}, \"body\": {\"type\": \"text\", \"text\": \"Hola {{1}}, tu turno con {{2}} ha sido confirmado para el {{3}} a las {{4}}.\"}}",
  "example": "Hola Juan Pérez, tu turno con Dr. García ha sido confirmado para el 15/01/2024 a las 10:00.",
  "clinicaId": "clinica123"
}
```

### Obtener Plantillas
```http
GET /whatsapp/templates?clinicaId=clinica123
Authorization: Bearer <token>
```

### Obtener Mensajes
```http
GET /whatsapp/messages?clinicaId=clinica123&status=sent&limit=50&offset=0
Authorization: Bearer <token>
```

### Obtener Estado del Mensaje
```http
GET /whatsapp/message-status/wamid.123456789
Authorization: Bearer <token>
```

### Webhook (para WhatsApp)
```http
POST /whatsapp/webhook
Content-Type: application/json
x-hub-signature-256: sha256=...

{
  "object": "whatsapp_business_account",
  "entry": [...]
}
```

### Verificar Webhook
```http
GET /whatsapp/webhook/verify?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=challenge
```

## Uso en el Código

### Enviar Mensaje desde Otros Servicios

```typescript
import { WhatsAppService } from './whatsapp/whatsapp.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private whatsappService: WhatsAppService,
  ) {}

  async confirmAppointment(appointmentId: string, patientPhone: string, doctorName: string, date: string, time: string) {
    // Lógica de confirmación del turno
    
    // Enviar mensaje de WhatsApp
    await this.whatsappService.sendTemplateMessage(
      patientPhone,
      'appointment_confirmation',
      {
        '1': patientName,
        '2': doctorName,
        '3': date,
        '4': time,
      },
      clinicaId
    );
  }
}
```

### Enviar Mensaje de Texto Simple

```typescript
await this.whatsappService.sendTextMessage(
  '5491112345678',
  'Tu turno ha sido confirmado para mañana a las 10:00',
  clinicaId
);
```

## Estructura de Base de Datos

### Tabla: WhatsAppMessage
```sql
CREATE TABLE "WhatsAppMessage" (
  "id" TEXT NOT NULL,
  "phoneNumberId" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "from" TEXT NOT NULL,
  "messageType" TEXT NOT NULL,
  "messageText" TEXT,
  "templateName" TEXT,
  "templateParams" TEXT,
  "mediaUrl" TEXT,
  "mediaId" TEXT,
  "wamid" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "clinicaId" TEXT,
  "userId" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WhatsAppMessage_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id"),
  CONSTRAINT "WhatsAppMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE INDEX "WhatsAppMessage_to_idx" ON "WhatsAppMessage"("to");
CREATE INDEX "WhatsAppMessage_status_idx" ON "WhatsAppMessage"("status");
CREATE INDEX "WhatsAppMessage_clinicaId_idx" ON "WhatsAppMessage"("clinicaId");
CREATE INDEX "WhatsAppMessage_userId_idx" ON "WhatsAppMessage"("userId");
CREATE INDEX "WhatsAppMessage_wamid_idx" ON "WhatsAppMessage"("wamid");
```

### Tabla: WhatsAppTemplate
```sql
CREATE TABLE "WhatsAppTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'es',
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "components" TEXT NOT NULL,
  "example" TEXT,
  "clinicaId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WhatsAppTemplate_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id")
);

CREATE INDEX "WhatsAppTemplate_name_idx" ON "WhatsAppTemplate"("name");
CREATE INDEX "WhatsAppTemplate_status_idx" ON "WhatsAppTemplate"("status");
CREATE INDEX "WhatsAppTemplate_clinicaId_idx" ON "WhatsAppTemplate"("clinicaId");
```

### Tabla: WhatsAppWebhook
```sql
CREATE TABLE "WhatsAppWebhook" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "WhatsAppWebhook_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WhatsAppWebhook_eventType_idx" ON "WhatsAppWebhook"("eventType");
CREATE INDEX "WhatsAppWebhook_processed_idx" ON "WhatsAppWebhook"("processed");
```

## Plantillas Predefinidas

### Confirmación de Turno
```json
{
  "name": "appointment_confirmation",
  "language": "es",
  "category": "utility",
  "components": {
    "header": {
      "type": "text",
      "text": "Confirmación de Turno"
    },
    "body": {
      "type": "text",
      "text": "Hola {{1}}, tu turno con {{2}} ha sido confirmado para el {{3}} a las {{4}}."
    }
  }
}
```

### Recordatorio de Turno
```json
{
  "name": "appointment_reminder",
  "language": "es",
  "category": "utility",
  "components": {
    "header": {
      "type": "text",
      "text": "Recordatorio de Turno"
    },
    "body": {
      "type": "text",
      "text": "Hola {{1}}, te recordamos que tienes un turno mañana con {{2}} a las {{3}}."
    }
  }
}
```

### Cancelación de Turno
```json
{
  "name": "appointment_cancellation",
  "language": "es",
  "category": "utility",
  "components": {
    "header": {
      "type": "text",
      "text": "Turno Cancelado"
    },
    "body": {
      "type": "text",
      "text": "Hola {{1}}, tu turno con {{2}} programado para el {{3}} ha sido cancelado."
    }
  }
}
```

## Webhooks

### Configuración del Webhook
1. En tu aplicación de Meta for Developers, configura la URL del webhook:
   ```
   https://tu-dominio.com/whatsapp/webhook
   ```

2. Configura el token de verificación:
   ```
   https://tu-dominio.com/whatsapp/webhook/verify
   ```

### Eventos Soportados
- **message**: Mensajes entrantes de usuarios
- **message_status**: Cambios de estado de mensajes enviados
- **template_status**: Cambios de estado de plantillas

### Respuestas Automáticas
El sistema incluye respuestas automáticas para:
- Saludos ("hola", "buenos días", etc.)
- Consultas sobre turnos
- Consultas sobre horarios
- Mensajes de botones interactivos

## Mantenimiento

### Monitoreo
- Revisa los logs para errores de envío
- Monitorea la tasa de entrega exitosa
- Verifica webhooks no procesados
- Revisa el estado de las plantillas

### Limpieza
- Los webhooks procesados se pueden limpiar periódicamente
- Los mensajes fallidos se pueden reintentar
- Las plantillas rechazadas se pueden revisar y corregir

## Próximos Pasos

1. **Mensajes en Lote**: Implementar envío optimizado de múltiples mensajes
2. **Plantillas Dinámicas**: Crear sistema de plantillas más flexible
3. **Analytics**: Agregar métricas de entrega y engagement
4. **IA Integrada**: Implementar respuestas automáticas más inteligentes
5. **Integración con Turnos**: Conectar directamente con el sistema de turnos

## Troubleshooting

### Error: "Invalid phone number"
- Verifica que el número tenga el formato correcto (5491112345678)
- Asegúrate de que el número esté registrado en WhatsApp

### Error: "Template not found"
- Verifica que la plantilla esté aprobada por WhatsApp
- Confirma que el nombre de la plantilla sea exacto

### Error: "Invalid webhook signature"
- Verifica que el secreto del webhook esté configurado correctamente
- Confirma que la firma se esté calculando correctamente

### Mensajes no llegan
- Verifica que el número de teléfono esté activo en WhatsApp
- Confirma que las credenciales de la API sean correctas
- Revisa los logs para errores específicos
