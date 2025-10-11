# API de Webhooks - Confirmación y Cancelación de Citas

## 📋 Resumen

Cuando se crea una cita en Clinera, se envía automáticamente un webhook con toda la información necesaria para confirmar o cancelar la cita desde un sistema externo.

---

## 🔔 Webhook de Cita Creada

### URL del Webhook
```
POST {WEBHOOK_BASE_URL}/{businessId}
```

Ejemplo:
```
POST https://40c5528924a8.ngrok-free.app/webhooks/appointments/cmg4jpe4q0001ny0fbduop6xl
```

### Payload del Webhook

```json
{
  "patient": {
    "full_name": "Daniela Saenz",
    "phone": "+54 9 11 788 999",
    "email": "swingsisters.info@gmail.com",
    "patient_id": "cmgl9xsx00001js0fmin1zjtp"
  },
  "booking": {
    "id": "cmgl9xsx00001js0fmin1zjtp",
    "date": "2025-10-10",
    "time": "16:00",
    "branch": "Sucursal Norte",
    "professional": "Marcela Flores",
    "treatment": "Lifting"
  },
  "confirm_url": "https://api.clinera.com/api/turnos/confirmar/1760126610845_91brekvfz3",
  "cancel_url": "https://api.clinera.com/api/turnos/cancelar/1760126610845_91brekvfz3",
  "reschedule_url": "https://app.clinera.com/reschedule?booking=cmgl9xsx00001js0fmin1zjtp",
  "metadata": {
    "source": "clinera",
    "clinicaId": "cmg4jpe4q0001ny0fbduop6xl",
    "confirmationToken": "1760126610845_91brekvfz3",
    "estado": "pendiente",
    "origen": "web",
    "createdAt": "2025-10-10T20:03:30.845Z"
  }
}
```

---

## ✅ Confirmar una Cita

Tienes **3 opciones** para confirmar una cita:

### Opción 1: GET con Token (Más simple - funciona en navegador)

```bash
GET https://api.clinera.com/api/turnos/confirmar/{token}
```

**Ejemplo:**
```bash
curl https://api.clinera.com/api/turnos/confirmar/1760126610845_91brekvfz3
```

**Respuesta:** Página HTML amigable con confirmación visual

**Uso recomendado:** Para enlaces en emails, WhatsApp, o cualquier lugar donde el usuario haga clic directo

---

### Opción 2: POST con Token

```bash
POST https://api.clinera.com/api/turnos/confirmar/{token}
```

**Ejemplo:**
```bash
curl -X POST https://api.clinera.com/api/turnos/confirmar/1760126610845_91brekvfz3 \
  -H "Content-Type: application/json"
```

**Respuesta JSON:**
```json
{
  "success": true,
  "data": {
    "id": "cmgl9xsx00001js0fmin1zjtp",
    "paciente": "Daniela Saenz",
    "estado": "confirmado",
    "fecha": "2025-10-10T00:00:00.000Z",
    "hora": "16:00",
    "doctor": "Marcela Flores"
  },
  "message": "Turno confirmado exitosamente"
}
```

---

### Opción 3: POST con ID del Turno (REST-ful)

```bash
POST https://api.clinera.com/api/turnos/{turnoId}/confirm
```

**Ejemplo:**
```bash
curl -X POST https://api.clinera.com/api/turnos/cmgl9xsx00001js0fmin1zjtp/confirm \
  -H "Content-Type: application/json"
```

**Respuesta JSON:**
```json
{
  "success": true,
  "data": {
    "id": "cmgl9xsx00001js0fmin1zjtp",
    "paciente": "Daniela Saenz",
    "estado": "confirmado",
    "fecha": "2025-10-10T00:00:00.000Z",
    "hora": "16:00",
    "doctor": "Marcela Flores",
    "clinica": {
      "id": "cmg4jpe4q0001ny0fbduop6xl",
      "name": "Clinica Costa M",
      "url": "clinica-costa-m"
    }
  },
  "message": "Turno confirmado exitosamente"
}
```

**Uso recomendado:** Para integraciones de API desde sistemas externos

---

## ❌ Cancelar una Cita

Tienes **3 opciones** para cancelar una cita:

### Opción 1: GET con Token (Más simple - funciona en navegador)

```bash
GET https://api.clinera.com/api/turnos/cancelar/{token}
```

**Ejemplo:**
```bash
curl https://api.clinera.com/api/turnos/cancelar/1760126610845_91brekvfz3
```

**Respuesta:** Página HTML amigable con confirmación visual

**Uso recomendado:** Para enlaces en emails, WhatsApp, o cualquier lugar donde el usuario haga clic directo

---

### Opción 2: POST con Token

```bash
POST https://api.clinera.com/api/turnos/cancelar/{token}
```

**Ejemplo:**
```bash
curl -X POST https://api.clinera.com/api/turnos/cancelar/1760126610845_91brekvfz3 \
  -H "Content-Type: application/json"
```

**Respuesta JSON:**
```json
{
  "success": true,
  "data": {
    "id": "cmgl9xsx00001js0fmin1zjtp",
    "paciente": "Daniela Saenz",
    "estado": "cancelado",
    "fecha": "2025-10-10T00:00:00.000Z",
    "hora": "16:00",
    "doctor": "Marcela Flores"
  },
  "message": "Turno cancelado exitosamente"
}
```

---

### Opción 3: POST con ID del Turno (REST-ful)

```bash
POST https://api.clinera.com/api/turnos/{turnoId}/cancel
```

**Ejemplo:**
```bash
curl -X POST https://api.clinera.com/api/turnos/cmgl9xsx00001js0fmin1zjtp/cancel \
  -H "Content-Type: application/json"
```

**Respuesta JSON:**
```json
{
  "success": true,
  "data": {
    "id": "cmgl9xsx00001js0fmin1zjtp",
    "paciente": "Daniela Saenz",
    "estado": "cancelado",
    "fecha": "2025-10-10T00:00:00.000Z",
    "hora": "16:00",
    "doctor": "Marcela Flores",
    "clinica": {
      "id": "cmg4jpe4q0001ny0fbduop6xl",
      "name": "Clinica Costa M",
      "url": "clinica-costa-m"
    }
  },
  "message": "Turno cancelado exitosamente"
}
```

**Uso recomendado:** Para integraciones de API desde sistemas externos

---

## 🔄 Flujo Completo de Integración

### 1. Recibir el Webhook

Cuando se crea una cita en Clinera, tu servidor recibe:

```javascript
// Ejemplo en Node.js/Express
app.post('/webhooks/appointments/:businessId', async (req, res) => {
  const { businessId } = req.params;
  const {
    patient,
    booking,
    confirm_url,
    cancel_url,
    metadata
  } = req.body;

  console.log('Nueva cita creada:', booking.id);
  console.log('Paciente:', patient.full_name);
  console.log('Fecha:', booking.date, 'Hora:', booking.time);
  
  // Guardar en tu base de datos
  await database.appointments.create({
    appointmentId: booking.id,
    clinicId: businessId,
    patientName: patient.full_name,
    patientPhone: patient.phone,
    patientEmail: patient.email,
    date: booking.date,
    time: booking.time,
    professional: booking.professional,
    treatment: booking.treatment,
    confirmToken: metadata.confirmationToken,
    status: metadata.estado
  });
  
  // Responder rápido (importante)
  res.status(200).json({ received: true });
  
  // Procesar asíncronamente
  processAppointment(booking.id);
});
```

### 2. Confirmar/Cancelar desde tu Sistema

**Opción A: Usando el token (más seguro)**

```javascript
// Confirmar
async function confirmAppointment(confirmationToken) {
  const response = await fetch(
    `https://api.clinera.com/api/turnos/${confirmationToken}/confirm`,
    { method: 'POST' }
  );
  return response.json();
}

// Cancelar
async function cancelAppointment(confirmationToken) {
  const response = await fetch(
    `https://api.clinera.com/api/turnos/${confirmationToken}/cancel`,
    { method: 'POST' }
  );
  return response.json();
}
```

**Opción B: Usando el ID del turno**

```javascript
// Confirmar
async function confirmAppointmentById(appointmentId) {
  const response = await fetch(
    `https://api.clinera.com/api/turnos/${appointmentId}/confirm`,
    { method: 'POST' }
  );
  return response.json();
}

// Cancelar
async function cancelAppointmentById(appointmentId) {
  const response = await fetch(
    `https://api.clinera.com/api/turnos/${appointmentId}/cancel`,
    { method: 'POST' }
  );
  return response.json();
}
```

---

## 📊 Estados de la Cita

- `pendiente` - Cita creada, esperando confirmación
- `confirmado` - Paciente confirmó su asistencia
- `cancelado` - Cita cancelada
- `completado` - Cita completada (después de la consulta)

---

## 🔒 Seguridad

### Mejores Prácticas

1. **Validar el origen del webhook**
   - Verificar IP del remitente (opcional)
   - Implementar firma HMAC (recomendado para producción)

2. **Usar HTTPS siempre**
   - Nunca usar HTTP en producción

3. **Responder rápido al webhook**
   - Responder con 200 OK inmediatamente
   - Procesar la lógica de negocio de forma asíncrona

4. **Manejar reintentos**
   - Implementar idempotencia (usar `booking.id` como clave única)
   - No procesar la misma cita dos veces

5. **Guardar el token de forma segura**
   - El `confirmationToken` es sensible
   - Guardarlo encriptado en tu base de datos

---

## 🧪 Testing

### Con Postman

**1. Simular recepción de webhook:**

```
POST http://localhost:3000/webhooks/appointments/test-clinic-id
Content-Type: application/json

{
  "patient": {
    "full_name": "Test Patient",
    "phone": "+5491112345678",
    "email": "test@example.com",
    "patient_id": "test-123"
  },
  "booking": {
    "id": "test-booking-123",
    "date": "2025-10-15",
    "time": "14:00",
    "professional": "Dr. Test",
    "treatment": "Consulta"
  },
  "confirm_url": "https://api.clinera.com/api/turnos/confirmar/test-token",
  "cancel_url": "https://api.clinera.com/api/turnos/cancelar/test-token",
  "metadata": {
    "source": "clinera",
    "confirmationToken": "test-token"
  }
}
```

**2. Confirmar la cita:**

```
POST https://api.clinera.com/api/turnos/test-booking-123/confirm
```

**3. Cancelar la cita:**

```
POST https://api.clinera.com/api/turnos/test-booking-123/cancel
```

---

## 📞 Soporte

Para preguntas o problemas:
- Email: support@clinera.com
- Documentación: https://docs.clinera.com

---

## 📝 Changelog

### v1.1 (Actual)
- ✨ Agregado `cancel_url` en el webhook
- ✨ Agregado `confirmationToken` en metadata
- ✨ Nuevos endpoints REST: `POST /turnos/{id}/confirm` y `POST /turnos/{id}/cancel`
- ✨ Soporte para confirmar/cancelar por ID sin token

### v1.0
- 🎉 Lanzamiento inicial con webhook de citas
- ✅ Endpoints GET con token para confirmar/cancelar

