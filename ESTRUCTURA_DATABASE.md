# 🗄️ ESTRUCTURA COMPLETA DE LA BASE DE DATOS - CLINERA

## 📊 **TABLAS PRINCIPALES**

### **1. CLINICA**
```sql
CREATE TABLE "Clinica" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL UNIQUE,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "logo" TEXT,
  "colorPrimario" TEXT DEFAULT '#3B82F6',
  "colorSecundario" TEXT DEFAULT '#1E40AF',
  "estado" TEXT DEFAULT 'activa',
  "estadoPago" TEXT DEFAULT 'pagado',
  "fechaCreacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "ultimoPago" TIMESTAMP,
  "proximoPago" TIMESTAMP,
  "descripcion" TEXT,
  "contacto" TEXT, -- JSON
  "rating" REAL DEFAULT 4.5,
  "stats" TEXT, -- JSON
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos Importantes:**
- `url`: URL única de la clínica (ej: "clinica-demo")
- `estado`: "activa" | "inactiva"
- `estadoPago`: "pagado" | "pendiente"
- `contacto`: JSON con información de contacto
- `stats`: JSON con estadísticas

### **2. USER**
```sql
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "phone" TEXT,
  "location" TEXT,
  "bio" TEXT,
  "role" TEXT NOT NULL, -- OWNER, ADMIN, PROFESSIONAL, SECRETARY, PATIENT
  "clinicaId" TEXT,
  "estado" TEXT DEFAULT 'activo',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id")
);
```

**Campos Importantes:**
- `role`: Rol del usuario en el sistema
- `clinicaId`: NULL para OWNER, ID de clínica para otros roles
- `estado`: "activo" | "inactivo"

### **3. TURNO**
```sql
CREATE TABLE "Turno" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "paciente" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "telefono" TEXT,
  "especialidad" TEXT NOT NULL,
  "doctor" TEXT NOT NULL,
  "fecha" TIMESTAMP NOT NULL,
  "hora" TEXT NOT NULL,
  "estado" TEXT DEFAULT 'pendiente', -- pendiente, confirmado, cancelado
  "motivo" TEXT,
  "clinicaId" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id")
);
```

**Campos Importantes:**
- `estado`: "pendiente" | "confirmado" | "cancelado"
- `fecha`: Fecha del turno
- `hora`: Hora en formato "HH:MM"

### **4. NOTIFICACION**
```sql
CREATE TABLE "Notificacion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "titulo" TEXT NOT NULL,
  "mensaje" TEXT NOT NULL,
  "tipo" TEXT DEFAULT 'info', -- info, warning, error, success
  "prioridad" TEXT DEFAULT 'media', -- baja, media, alta
  "leida" BOOLEAN DEFAULT false,
  "clinicaId" TEXT NOT NULL,
  "destinatarioId" TEXT, -- NULL = para todos los usuarios de la clínica
  "fechaVencimiento" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id"),
  FOREIGN KEY ("destinatarioId") REFERENCES "User"("id")
);
```

### **5. MENSAJE**
```sql
CREATE TABLE "Mensaje" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "asunto" TEXT NOT NULL,
  "mensaje" TEXT NOT NULL,
  "tipo" TEXT NOT NULL, -- pago, soporte, general
  "leido" BOOLEAN DEFAULT false,
  "clinicaId" TEXT, -- NULL = mensaje general del sistema
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id")
);
```

---

## 🔗 **TABLAS RELACIONADAS**

### **6. PATIENT**
```sql
CREATE TABLE "Patient" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "birthDate" TIMESTAMP,
  "phone" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id")
);
```

### **7. PROFESSIONAL**
```sql
CREATE TABLE "Professional" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "specialties" TEXT[] NOT NULL, -- Array de especialidades
  "defaultDurationMin" INTEGER DEFAULT 30,
  "bufferMin" INTEGER DEFAULT 10,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id")
);
```

### **8. HORARIO**
```sql
CREATE TABLE "Horario" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "day" TEXT NOT NULL, -- LUNES, MARTES, MIERCOLES, etc.
  "openTime" TEXT NOT NULL, -- HH:MM
  "closeTime" TEXT NOT NULL, -- HH:MM
  "clinicaId" TEXT NOT NULL,
  FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id")
);
```

### **9. ESPECIALIDAD**
```sql
CREATE TABLE "Especialidad" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "clinicaId" TEXT NOT NULL,
  FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id")
);
```

### **10. AGENDA**
```sql
CREATE TABLE "Agenda" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "professionalId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "startTime" TEXT NOT NULL, -- HH:MM
  "endTime" TEXT NOT NULL, -- HH:MM
  "isAvailable" BOOLEAN DEFAULT true,
  "notes" TEXT,
  FOREIGN KEY ("professionalId") REFERENCES "Professional"("id")
);
```

---

## 🔍 **RELACIONES PRINCIPALES**

### **Clínica ↔ Usuarios**
- Una clínica tiene muchos usuarios
- Un usuario pertenece a una clínica (excepto OWNER)

### **Clínica ↔ Turnos**
- Una clínica tiene muchos turnos
- Un turno pertenece a una clínica

### **Clínica ↔ Notificaciones**
- Una clínica tiene muchas notificaciones
- Una notificación pertenece a una clínica

### **Usuario ↔ Notificaciones**
- Un usuario puede recibir muchas notificaciones
- Una notificación puede ser para un usuario específico o para todos

### **Usuario ↔ Patient/Professional**
- Un usuario puede ser un paciente (1:1)
- Un usuario puede ser un profesional (1:1)

---

## 📈 **ÍNDICES DE RENDIMIENTO**

```sql
-- Índices para búsquedas rápidas
CREATE INDEX "idx_user_email" ON "User"("email");
CREATE INDEX "idx_user_clinica" ON "User"("clinicaId");
CREATE INDEX "idx_turno_clinica" ON "Turno"("clinicaId");
CREATE INDEX "idx_turno_fecha" ON "Turno"("fecha");
CREATE INDEX "idx_turno_estado" ON "Turno"("estado");
CREATE INDEX "idx_notificacion_clinica" ON "Notificacion"("clinicaId");
CREATE INDEX "idx_notificacion_destinatario" ON "Notificacion"("destinatarioId");
CREATE INDEX "idx_mensaje_clinica" ON "Mensaje"("clinicaId");
CREATE INDEX "idx_clinica_url" ON "Clinica"("url");
```

---

## 🎯 **DATOS DE EJEMPLO (SEED)**

### **Clínica Demo**
```json
{
  "id": "clinica_demo_id",
  "name": "Clínica Demo",
  "url": "clinica-demo",
  "colorPrimario": "#3B82F6",
  "colorSecundario": "#1E40AF",
  "estado": "activa",
  "estadoPago": "pagado"
}
```

### **Usuarios de Prueba**
```json
[
  {
    "email": "owner1@clinera.io",
    "password": "hashed_123456",
    "name": "Owner 1",
    "role": "OWNER",
    "clinicaId": null
  },
  {
    "email": "admin1@clinera.io",
    "password": "hashed_123456",
    "name": "Admin 1",
    "role": "ADMIN",
    "clinicaId": "clinica_demo_id"
  },
  {
    "email": "professional1@clinera.io",
    "password": "hashed_123456",
    "name": "Professional 1",
    "role": "PROFESSIONAL",
    "clinicaId": "clinica_demo_id"
  },
  {
    "email": "patient1@clinera.io",
    "password": "hashed_123456",
    "name": "Patient 1",
    "role": "PATIENT",
    "clinicaId": "clinica_demo_id"
  }
]
```

### **Especialidades**
```json
[
  { "name": "Cardiología", "clinicaId": "clinica_demo_id" },
  { "name": "Dermatología", "clinicaId": "clinica_demo_id" },
  { "name": "Pediatría", "clinicaId": "clinica_demo_id" }
]
```

### **Horarios**
```json
[
  {
    "day": "LUNES",
    "openTime": "08:00",
    "closeTime": "16:00",
    "clinicaId": "clinica_demo_id"
  },
  {
    "day": "MARTES",
    "openTime": "09:00",
    "closeTime": "17:00",
    "clinicaId": "clinica_demo_id"
  },
  {
    "day": "MIERCOLES",
    "openTime": "10:00",
    "closeTime": "18:00",
    "clinicaId": "clinica_demo_id"
  }
]
```

---

## 🔐 **CONSIDERACIONES DE SEGURIDAD**

1. **Contraseñas**: Hasheadas con bcrypt (salt rounds: 10)
2. **Tokens JWT**: Firmados con JWT_SECRET
3. **Validación**: Todos los inputs validados con class-validator
4. **Autorización**: Basada en roles y pertenencia a clínica
5. **CORS**: Configurado para dominios específicos

---

## 📊 **CONSULTAS FRECUENTES**

### **Obtener Turnos de una Clínica**
```sql
SELECT * FROM "Turno" 
WHERE "clinicaId" = ? 
ORDER BY "fecha" DESC, "hora" ASC;
```

### **Obtener Usuarios de una Clínica**
```sql
SELECT * FROM "User" 
WHERE "clinicaId" = ? 
AND "estado" = 'activo';
```

### **Obtener Notificaciones No Leídas**
```sql
SELECT * FROM "Notificacion" 
WHERE "clinicaId" = ? 
AND ("destinatarioId" = ? OR "destinatarioId" IS NULL)
AND "leida" = false;
```

### **Estadísticas de Turnos por Estado**
```sql
SELECT "estado", COUNT(*) as count 
FROM "Turno" 
WHERE "clinicaId" = ? 
GROUP BY "estado";
```

---

## 🚀 **MIGRACIONES DISPONIBLES**

1. **20250805160231_clinera**: Estructura inicial
2. **20250806122751_switch_horarios_especialidades_to_relations**: Relaciones
3. **20250806185029_remove_existe_field**: Limpieza
4. **20250810231206_add_notifications_table**: Notificaciones
5. **20250810234718_make_mensaje_clinicaId_optional**: Mensajes opcionales
6. **20250806185030_add_performance_indexes**: Índices de rendimiento

---

## 📝 **NOTAS PARA EL FRONTEND**

1. **IDs**: Usar CUID para IDs de texto, UUID para algunos casos específicos
2. **Fechas**: Siempre en formato ISO 8601
3. **Estados**: Usar los valores exactos definidos
4. **Relaciones**: Respetar las foreign keys
5. **Validación**: Validar en frontend antes de enviar al backend
6. **Paginación**: Implementar para listas grandes
7. **Búsqueda**: Usar los endpoints de search disponibles

