# Sistema de Notificaciones Push

## Descripción
Este módulo implementa un sistema completo de notificaciones push utilizando Firebase Cloud Messaging (FCM) para enviar notificaciones en tiempo real a dispositivos móviles y web.

## Características

### ✅ Implementado
- ✅ Registro y gestión de tokens de dispositivos
- ✅ Envío de notificaciones push a usuarios específicos
- ✅ Envío de notificaciones push a toda una clínica
- ✅ Soporte para múltiples plataformas (Android, iOS, Web)
- ✅ Limpieza automática de tokens inactivos
- ✅ Gestión de tokens por dispositivo y usuario
- ✅ API REST completa con documentación Swagger

### 🔄 En Desarrollo
- 🔄 Notificaciones programadas
- 🔄 Plantillas de notificaciones
- 🔄 Estadísticas de entrega
- 🔄 Notificaciones en lote optimizadas

## Configuración

### 1. Variables de Entorno
Agrega las siguientes variables a tu archivo `.env`:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/firebase-service-account.json
```

### 2. Configuración de Firebase
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Descarga el archivo de credenciales de servicio
3. Coloca el archivo en tu proyecto y actualiza la variable `GOOGLE_APPLICATION_CREDENTIALS`

## Endpoints de la API

### Registrar Token de Dispositivo
```http
POST /push-notifications/register-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "fMEP0vJqS0:APA91bHqX...",
  "platform": "android",
  "deviceId": "device_123456"
}
```

### Desactivar Token
```http
DELETE /push-notifications/unregister-token/{token}
Authorization: Bearer <token>
```

### Obtener Tokens del Usuario
```http
GET /push-notifications/my-tokens
Authorization: Bearer <token>
```

### Enviar Notificación
```http
POST /push-notifications/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Nuevo turno confirmado",
  "body": "Tu turno ha sido confirmado para mañana a las 10:00",
  "data": {
    "type": "appointment",
    "appointmentId": "123"
  },
  "userIds": ["user1", "user2"],
  "platforms": ["android", "ios"]
}
```

### Enviar Notificación a Usuario Específico
```http
POST /push-notifications/send-to-user/{userId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Recordatorio de turno",
  "body": "No olvides tu turno mañana",
  "data": {
    "type": "reminder",
    "appointmentId": "123"
  }
}
```

## Uso en el Código

### Enviar Notificación desde Otros Servicios

```typescript
import { PushNotificationsService } from './push-notifications/push-notifications.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private pushNotificationsService: PushNotificationsService,
  ) {}

  async confirmAppointment(appointmentId: string, userId: string) {
    // Lógica de confirmación del turno
    
    // Enviar notificación push
    await this.pushNotificationsService.sendNotificationToUser(
      userId,
      'Turno Confirmado',
      'Tu turno ha sido confirmado exitosamente',
      {
        type: 'appointment_confirmed',
        appointmentId,
      }
    );
  }
}
```

## Estructura de Base de Datos

### Tabla: PushNotificationToken
```sql
CREATE TABLE "PushNotificationToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "platform" TEXT NOT NULL,
  "deviceId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "PushNotificationToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PushNotificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "PushNotificationToken_userId_idx" ON "PushNotificationToken"("userId");
CREATE INDEX "PushNotificationToken_token_idx" ON "PushNotificationToken"("token");
CREATE INDEX "PushNotificationToken_platform_idx" ON "PushNotificationToken"("platform");
```

## Mantenimiento

### Limpieza Automática
El sistema ejecuta automáticamente una limpieza diaria de tokens inactivos a las 00:00.

### Monitoreo
- Revisa los logs para errores de envío
- Monitorea la tasa de entrega exitosa
- Verifica tokens inválidos o expirados

## Próximos Pasos

1. **Notificaciones Programadas**: Implementar envío de notificaciones en horarios específicos
2. **Plantillas**: Crear sistema de plantillas para notificaciones comunes
3. **Analytics**: Agregar métricas de entrega y engagement
4. **Optimización**: Implementar envío en lote para mejor performance
5. **Webhooks**: Agregar webhooks para eventos de notificación

## Troubleshooting

### Error: "Firebase not initialized"
- Verifica que las credenciales de Firebase estén configuradas correctamente
- Asegúrate de que el archivo de credenciales sea accesible

### Error: "Invalid registration token"
- El token del dispositivo puede haber expirado
- El usuario debe volver a registrar su dispositivo

### Notificaciones no llegan
- Verifica que el dispositivo tenga conexión a internet
- Confirma que la aplicación tenga permisos de notificación
- Revisa la configuración de Firebase en el proyecto
