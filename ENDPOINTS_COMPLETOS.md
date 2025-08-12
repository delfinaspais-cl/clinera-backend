# 📋 DOCUMENTACIÓN COMPLETA DE ENDPOINTS - CLINERA BACKEND

## 🔗 **URL BASE**
```
https://clinera-backend-develop.up.railway.app
```

## 🔐 **AUTENTICACIÓN**
Todos los endpoints (excepto los públicos) requieren token JWT en el header:
```
Authorization: Bearer [token]
```

---

## 🏥 **ENDPOINTS DE AUTENTICACIÓN**

### **1. Login de Owner (Sistema)**
```http
POST /auth/owner-login
```
**Payload:**
```json
{
  "username": "owner@clinera.io",
  "password": "123456"
}
```
**Respuesta:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "Owner Name",
    "role": "OWNER",
    "clinicaId": null
  }
}
```

### **2. Login de Clínica**
```http
POST /auth/clinica-login
```
**Payload:**
```json
{
  "clinicaUrl": "clinica-demo",
  "username": "admin1@clinera.io",
  "password": "123456"
}
```
**Respuesta:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "Admin Name",
    "role": "ADMIN",
    "clinicaId": "clinica_id",
    "clinicaUrl": "clinica-demo"
  }
}
```

### **3. Registro de Usuario**
```http
POST /auth/register
```
**Payload:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "123456",
  "name": "Nombre Usuario",
  "role": "ADMIN"
}
```
**Respuesta:**
```json
{
  "access_token": "jwt_token"
}
```

### **4. Crear Owner Temporal (Railway)**
```http
POST /auth/create-owner
```
**Payload:** Vacío
**Respuesta:**
```json
{
  "success": true,
  "message": "OWNER creado exitosamente para Railway",
  "credentials": {
    "email": "railway-owner@clinera.io",
    "password": "123456"
  }
}
```

---

## 🏢 **ENDPOINTS DE OWNER (SISTEMA)**

### **1. Obtener Todas las Clínicas**
```http
GET /owner/clinicas
```
**Respuesta:**
```json
{
  "success": true,
  "clinicas": [
    {
      "id": "clinica_id",
      "nombre": "Clínica Demo",
      "url": "clinica-demo",
      "logo": null,
      "colorPrimario": "#3B82F6",
      "colorSecundario": "#1E40AF",
      "estado": "activa",
      "estadoPago": "pagado",
      "fechaCreacion": "2025-08-12",
      "ultimoPago": "2025-08-12",
      "proximoPago": "2025-09-11",
      "usuarios": 8,
      "turnos": 0,
      "ingresos": 0
    }
  ]
}
```

### **2. Crear Clínica**
```http
POST /owner/clinicas
```
**Payload:**
```json
{
  "nombre": "Nueva Clínica",
  "url": "nueva-clinica",
  "colorPrimario": "#3B82F6",
  "colorSecundario": "#1E40AF",
  "direccion": "Av. Principal 123",
  "telefono": "+54 11 5555-5555",
  "email": "clinica@ejemplo.com",
  "horarios": [
    {
      "day": "LUNES",
      "openTime": "08:00",
      "closeTime": "16:00"
    }
  ],
  "especialidades": ["Cardiología", "Dermatología"]
}
```

### **3. Registro Completo (Frontend)**
```http
POST /owner/register-complete
```
**Payload:**
```json
{
  "planId": "professional",
  "simulatePayment": true,
  "admin": {
    "nombre": "Delfina Spias",
    "email": "delfi@mail.com",
    "password": "123456"
  },
  "clinica": {
    "nombre": "Clinica Delfi",
    "url": "clinica-delfi",
    "color_primario": "#3B82F6",
    "color_secundario": "#1E40AF"
  }
}
```
**Respuesta:**
```json
{
  "success": true,
  "message": "Registro completo exitoso",
  "clinica": {
    "id": "clinica_id",
    "name": "Clinica Delfi",
    "url": "clinica-delfi",
    "colorPrimario": "#3B82F6",
    "colorSecundario": "#1E40AF",
    "especialidades": [],
    "horarios": []
  },
  "plan": "professional",
  "paymentSimulated": true,
  "adminCreated": true,
  "adminToken": "jwt_token"
}
```

### **4. Actualizar Clínica**
```http
PUT /owner/clinicas/:clinicaId
```
**Payload:** Igual que crear clínica

### **5. Cambiar Estado de Clínica**
```http
PATCH /owner/clinicas/:clinicaId/estado
```
**Payload:**
```json
{
  "estado": "inactiva"
}
```

### **6. Estadísticas del Sistema**
```http
GET /owner/stats
```
**Respuesta:**
```json
{
  "totalClinicas": 5,
  "clinicasActivas": 4,
  "totalUsuarios": 25,
  "totalTurnos": 150,
  "ingresosMensuales": 50000
}
```

### **7. Analytics del Sistema**
```http
GET /owner/analytics
```
**Respuesta:**
```json
{
  "clinicasPorMes": [
    { "mes": "Enero", "clinicas": 2 },
    { "mes": "Febrero", "clinicas": 3 }
  ],
  "usuariosPorRol": {
    "ADMIN": 5,
    "PROFESSIONAL": 10,
    "PATIENT": 10
  },
  "turnosPorEstado": {
    "confirmado": 100,
    "pendiente": 30,
    "cancelado": 20
  }
}
```

### **8. Mensajes del Sistema**
```http
GET /owner/messages
POST /owner/messages
```
**Payload (POST):**
```json
{
  "asunto": "Mensaje de soporte",
  "mensaje": "Contenido del mensaje",
  "tipo": "soporte",
  "clinicaId": "clinica_id" // opcional
}
```

### **9. Notificaciones del Sistema**
```http
GET /owner/notifications
```

### **10. Validaciones**
```http
GET /owner/validate/clinica-url/:url
GET /owner/validate/email/:email
```

---

## 🏥 **ENDPOINTS DE CLÍNICA**

### **1. Obtener Usuarios de la Clínica**
```http
GET /clinica/:clinicaUrl/usuarios
POST /clinica/:clinicaUrl/usuarios
```
**Payload (POST):**
```json
{
  "email": "usuario@clinica.com",
  "password": "123456",
  "name": "Nombre Usuario",
  "role": "PROFESSIONAL",
  "phone": "+54 11 5555-5555"
}
```

### **2. Cambiar Estado de Usuario**
```http
PATCH /clinica/:clinicaUrl/usuarios/:userId/estado
```
**Payload:**
```json
{
  "estado": "inactivo"
}
```

### **3. Gestión de Turnos**
```http
GET /clinica/:clinicaUrl/turnos
POST /clinica/:clinicaUrl/turnos
PUT /clinica/:clinicaUrl/turnos/:turnoId
DELETE /clinica/:clinicaUrl/turnos/:turnoId
PATCH /clinica/:clinicaUrl/turnos/:turnoId/estado
```
**Payload (POST):**
```json
{
  "paciente": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "telefono": "+54 11 5555-5555",
  "especialidad": "Cardiología",
  "doctor": "Dr. García",
  "fecha": "2025-08-15T10:00:00Z",
  "hora": "10:00",
  "motivo": "Consulta de rutina"
}
```

### **4. Estadísticas de Turnos**
```http
GET /clinica/:clinicaUrl/turnos/stats
GET /clinica/:clinicaUrl/turnos/search
```

### **5. Configuración de Clínica**
```http
GET /clinica/:clinicaUrl/configuracion
PUT /clinica/:clinicaUrl/configuracion
```

### **6. Analytics de Clínica**
```http
GET /clinica/:clinicaUrl/analytics
GET /clinica/:clinicaUrl/stats
```

### **7. Gestión de Profesionales**
```http
GET /clinica/:clinicaUrl/profesionales
POST /clinica/:clinicaUrl/profesionales
GET /clinica/:clinicaUrl/profesionales/:id
PATCH /clinica/:clinicaUrl/profesionales/:id
DELETE /clinica/:clinicaUrl/profesionales/:id
```

### **8. Gestión de Pacientes**
```http
GET /clinica/:clinicaUrl/pacientes
POST /clinica/:clinicaUrl/pacientes
GET /clinica/:clinicaUrl/pacientes/:id
PATCH /clinica/:clinicaUrl/pacientes/:id
DELETE /clinica/:clinicaUrl/pacientes/:id
GET /clinica/:clinicaUrl/pacientes/mis-turnos
GET /clinica/:clinicaUrl/pacientes/search
```

### **9. Horarios**
```http
GET /clinica/:clinicaUrl/horarios
PUT /clinica/:clinicaUrl/horarios
```

### **10. Especialidades**
```http
GET /clinica/:clinicaUrl/especialidades
PUT /clinica/:clinicaUrl/especialidades
```

### **11. Agendas**
```http
GET /clinica/:clinicaUrl/schedules
POST /clinica/:clinicaUrl/schedules
GET /clinica/:clinicaUrl/schedules/:professionalId
DELETE /clinica/:clinicaUrl/schedules/:id
```

### **12. Reportes**
```http
GET /clinica/:clinicaUrl/reportes/turnos
GET /clinica/:clinicaUrl/reportes/ingresos
GET /clinica/:clinicaUrl/reportes/pacientes
GET /clinica/:clinicaUrl/reportes/export/turnos/pdf
GET /clinica/:clinicaUrl/reportes/export/turnos/excel
GET /clinica/:clinicaUrl/reportes/export/pacientes/pdf
GET /clinica/:clinicaUrl/reportes/export/pacientes/excel
```

### **13. Mensajes de Clínica**
```http
GET /clinica/:clinicaUrl/mensajes
POST /clinica/:clinicaUrl/mensajes
PATCH /clinica/:clinicaUrl/mensajes/:mensajeId
DELETE /clinica/:clinicaUrl/mensajes/:mensajeId
```

### **14. Notificaciones de Clínica**
```http
GET /clinica/:clinicaUrl/notificaciones
POST /clinica/:clinicaUrl/notificaciones
GET /clinica/:clinicaUrl/notificaciones/:id
PATCH /clinica/:clinicaUrl/notificaciones/:id
PATCH /clinica/:clinicaUrl/notificaciones/:id/read
DELETE /clinica/:clinicaUrl/notificaciones/:id
GET /clinica/:clinicaUrl/notificaciones/stats
```

---

## 🌐 **ENDPOINTS PÚBLICOS**

### **1. Landing de Clínica**
```http
GET /public/clinica/:clinicaUrl/landing
```

### **2. Crear Turno desde Landing**
```http
POST /public/clinica/:clinicaUrl/landing/turnos
```
**Payload:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "telefono": "+54 11 5555-5555",
  "fecha": "2025-08-15",
  "hora": "10:00",
  "especialidad": "Cardiología",
  "doctor": "Dr. García",
  "motivo": "Consulta de rutina"
}
```

---

## 👤 **ENDPOINTS DE USUARIOS**

### **1. Perfil de Usuario**
```http
GET /users/me
PATCH /users/me
```

### **2. Pacientes del Usuario**
```http
GET /users/patients
```

---

## 📊 **ESTRUCTURA DE DATOS**

### **Clínica**
```json
{
  "id": "string",
  "name": "string",
  "url": "string (unique)",
  "address": "string",
  "phone": "string",
  "email": "string",
  "logo": "string",
  "colorPrimario": "string",
  "colorSecundario": "string",
  "estado": "activa|inactiva",
  "estadoPago": "pagado|pendiente",
  "fechaCreacion": "DateTime",
  "ultimoPago": "DateTime",
  "proximoPago": "DateTime",
  "descripcion": "string",
  "contacto": "JSON",
  "rating": "number",
  "stats": "JSON"
}
```

### **Usuario**
```json
{
  "id": "string",
  "email": "string (unique)",
  "password": "string (hashed)",
  "name": "string",
  "phone": "string",
  "location": "string",
  "bio": "string",
  "role": "OWNER|ADMIN|PROFESSIONAL|SECRETARY|PATIENT",
  "clinicaId": "string",
  "estado": "activo|inactivo"
}
```

### **Turno**
```json
{
  "id": "string",
  "paciente": "string",
  "email": "string",
  "telefono": "string",
  "especialidad": "string",
  "doctor": "string",
  "fecha": "DateTime",
  "hora": "string",
  "estado": "pendiente|confirmado|cancelado",
  "motivo": "string",
  "clinicaId": "string"
}
```

### **Notificación**
```json
{
  "id": "string",
  "titulo": "string",
  "mensaje": "string",
  "tipo": "info|warning|error|success",
  "prioridad": "baja|media|alta",
  "leida": "boolean",
  "clinicaId": "string",
  "destinatarioId": "string",
  "fechaVencimiento": "DateTime"
}
```

### **Mensaje**
```json
{
  "id": "string",
  "asunto": "string",
  "mensaje": "string",
  "tipo": "pago|soporte|general",
  "leido": "boolean",
  "clinicaId": "string (opcional)"
}
```

---

## 🔧 **CÓDIGOS DE ERROR COMUNES**

- **400 Bad Request**: Datos inválidos o faltantes
- **401 Unauthorized**: Token inválido o faltante
- **403 Forbidden**: Sin permisos para el recurso
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto (ej: URL de clínica ya existe)
- **500 Internal Server Error**: Error del servidor

---

## 📝 **NOTAS IMPORTANTES**

1. **Autenticación**: Todos los endpoints requieren token JWT excepto los públicos
2. **Roles**: OWNER (sistema), ADMIN (clínica), PROFESSIONAL, SECRETARY, PATIENT
3. **URLs de Clínica**: Deben ser únicas en el sistema
4. **Fechas**: Formato ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
5. **Paginación**: Algunos endpoints soportan `?page=1&limit=10`
6. **Búsqueda**: Algunos endpoints soportan `?search=termino`

---

## 🚀 **ENDPOINTS RECOMENDADOS PARA FRONTEND**

### **Flujo de Registro:**
1. `POST /owner/register-complete` - Registro completo
2. `POST /auth/clinica-login` - Login después del registro

### **Flujo de Login:**
1. `POST /auth/owner-login` - Para owners del sistema
2. `POST /auth/clinica-login` - Para usuarios de clínica

### **Gestión de Clínica:**
1. `GET /clinica/:clinicaUrl/analytics` - Dashboard principal
2. `GET /clinica/:clinicaUrl/turnos` - Lista de turnos
3. `POST /clinica/:clinicaUrl/turnos` - Crear turno
4. `GET /clinica/:clinicaUrl/usuarios` - Gestión de usuarios

### **Landing Público:**
1. `GET /public/clinica/:clinicaUrl/landing` - Mostrar landing
2. `POST /public/clinica/:clinicaUrl/landing/turnos` - Reservar turno

