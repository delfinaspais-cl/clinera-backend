# 🩺 Proyecto: Clinera Backend

## 📄 Descripción

Plataforma para gestión de turnos y agendas médicas, donde interactúan:

- **Owners**: Propietarios del sistema
- **Clínicas**: Administradores de clínicas
- **Profesionales**: Médicos y especialistas
- **Pacientes**: Usuarios que solicitan turnos
- **Recepcionistas**: Personal administrativo

Cada uno tiene su propio rol y acceso específico.

---

## 🔧 Tecnologías utilizadas

- **NestJS**: Framework backend principal
- **Prisma**: ORM para interactuar con PostgreSQL
- **PostgreSQL**: Base de datos relacional
- **JWT**: Autenticación con tokens
- **Bcrypt**: Encriptación de contraseñas
- **Class-validator**: Validación de DTOs
- **CORS**: Configurado para permitir frontend desde otro origen
- **ts-node**: Ejecutar seeds y scripts en TypeScript

---

## 🚀 Endpoints de la API

### 1. AUTENTICACIÓN
```
POST /auth/register - Registro de usuarios
POST /auth/login - Login general
POST /auth/owner/login - Login de propietario
POST /auth/owner/logout - Logout de propietario
POST /auth/clinica/login - Login de clínica
POST /auth/clinica/logout - Logout de clínica
```

### 2. GESTIÓN DE CLÍNICAS (OWNER)
```
GET /owner/clinicas - Obtener todas las clínicas
POST /owner/clinicas - Crear nueva clínica
PUT /owner/clinicas/:clinicaId - Actualizar clínica completa
PATCH /owner/clinicas/:clinicaId/estado - Actualizar estado de clínica
POST /owner/clinicas/:clinicaId/mensajes - Enviar mensaje a clínica
GET /owner/stats - Estadísticas del propietario
GET /owner/messages - Mensajes del propietario
POST /owner/messages - Crear mensaje del propietario
GET /owner/analytics - Analytics del propietario
GET /owner/notifications - Notificaciones del propietario
GET /owner/validate/clinica-url/:url - Validar URL única de clínica
GET /owner/validate/email/:email - Validar email único
```

### 3. GESTIÓN DE USUARIOS DE CLÍNICA
```
GET /clinica/:clinicaUrl/usuarios - Obtener usuarios de clínica
POST /clinica/:clinicaUrl/usuarios - Crear usuario de clínica
PATCH /clinica/:clinicaUrl/usuarios/:userId/estado - Actualizar estado de usuario
```

### 4. GESTIÓN DE TURNOS
```
GET /clinica/:clinicaUrl/turnos - Obtener turnos de clínica
POST /clinica/:clinicaUrl/turnos - Crear turno
PATCH /clinica/:clinicaUrl/turnos/:turnoId/estado - Actualizar estado de turno
PUT /clinica/:clinicaUrl/turnos/:turnoId - Actualizar turno completo
DELETE /clinica/:clinicaUrl/turnos/:turnoId - Eliminar turno
GET /clinica/:clinicaUrl/turnos/stats - Estadísticas de turnos
GET /clinica/:clinicaUrl/turnos/search - Búsqueda avanzada de turnos
```

### 5. CONFIGURACIÓN DE CLÍNICA
```
GET /clinica/:clinicaUrl/configuracion - Obtener configuración
PUT /clinica/:clinicaUrl/configuracion - Actualizar configuración
```

### 6. LANDING PAGE PÚBLICA
```
GET /public/clinica/:clinicaUrl/landing - Datos de landing
POST /public/clinica/:clinicaUrl/landing/turnos - Crear turno desde landing
```

### 7. ESTADÍSTICAS Y REPORTES
```
GET /clinica/:clinicaUrl/stats - Estadísticas de clínica
GET /clinica/:clinicaUrl/analytics - Analytics de clínica
GET /clinica/:clinicaUrl/reportes/turnos - Reporte de turnos
GET /clinica/:clinicaUrl/reportes/ingresos - Reporte de ingresos
GET /clinica/:clinicaUrl/reportes/pacientes - Reporte de pacientes
```

### 8. NOTIFICACIONES
```
GET /clinica/:clinicaUrl/notificaciones - Obtener notificaciones
POST /clinica/:clinicaUrl/notificaciones - Crear notificación
PATCH /clinica/:clinicaUrl/notificaciones/:id - Actualizar notificación
PATCH /clinica/:clinicaUrl/notificaciones/:id/read - Marcar como leída
DELETE /clinica/:clinicaUrl/notificaciones/:id - Eliminar notificación
GET /clinica/:clinicaUrl/notificaciones/stats - Estadísticas de notificaciones
```

### 9. MENSAJES
```
GET /clinica/:clinicaUrl/mensajes - Obtener mensajes
POST /clinica/:clinicaUrl/mensajes - Crear mensaje
PATCH /clinica/:clinicaUrl/mensajes/:mensajeId - Actualizar mensaje
DELETE /clinica/:clinicaUrl/mensajes/:mensajeId - Eliminar mensaje
```

### 10. PROFESIONALES
```
GET /clinica/:clinicaUrl/profesionales - Obtener profesionales
POST /clinica/:clinicaUrl/profesionales - Crear profesional
GET /clinica/:clinicaUrl/profesionales/:id - Obtener profesional específico
PATCH /clinica/:clinicaUrl/profesionales/:id - Actualizar profesional
DELETE /clinica/:clinicaUrl/profesionales/:id - Eliminar profesional
```

### 11. PACIENTES
```
GET /clinica/:clinicaUrl/pacientes - Obtener pacientes
POST /clinica/:clinicaUrl/pacientes - Crear paciente
GET /clinica/:clinicaUrl/pacientes/:id - Obtener paciente específico
PATCH /clinica/:clinicaUrl/pacientes/:id - Actualizar paciente
DELETE /clinica/:clinicaUrl/pacientes/:id - Eliminar paciente
GET /clinica/:clinicaUrl/pacientes/mis-turnos - Mis turnos (paciente)
```

### 12. AGENDAS/HORARIOS
```
GET /clinica/:clinicaUrl/schedules - Obtener agendas
GET /clinica/:clinicaUrl/schedules/:professionalId - Agenda por profesional
POST /clinica/:clinicaUrl/schedules - Crear agenda
DELETE /clinica/:clinicaUrl/schedules/:id - Eliminar agenda
```

### 13. HORARIOS DE CLÍNICA
```
GET /clinica/:clinicaUrl/horarios - Obtener horarios
PUT /clinica/:clinicaUrl/horarios - Actualizar horarios
```

### 14. ESPECIALIDADES
```
GET /clinica/:clinicaUrl/especialidades - Obtener especialidades
PUT /clinica/:clinicaUrl/especialidades - Actualizar especialidades
```

### 15. USUARIOS GENERALES
```
GET /users - Obtener todos los usuarios
GET /users/me - Obtener perfil propio
PATCH /users/me - Actualizar perfil propio
GET /users/patients - Obtener todos los pacientes
```

---

## 📁 Estructura de carpetas (`/src`)

```bash
src/
├── auth/                    # Autenticación y autorización
├── owners/                  # Gestión de propietarios
├── clinicas/               # Gestión de clínicas
├── patients/               # Gestión de pacientes
├── professionals/          # Gestión de profesionales
├── users/                  # Usuarios generales
├── schedule/               # Agendas y horarios
├── horarios/               # Horarios de clínica
├── especialidades/         # Especialidades médicas
├── notifications/          # Sistema de notificaciones
├── messages/               # Sistema de mensajes
├── reports/                # Reportes y estadísticas
├── public/                 # Endpoints públicos
├── prisma/                 # Configuración de base de datos
└── common/                 # Utilidades comunes
```

---

## 🔑 Autenticación

- **Rutas protegidas**: Usar `@UseGuards(JwtAuthGuard)`
- **Token**: Pasar en header como `Authorization: Bearer <token>`
- **Roles**: OWNER, ADMIN, RECEPCIONIST, PROFESSIONAL, PATIENT

---

## 🧪 Seed de datos

```bash
npx prisma db seed
```

Crea usuarios de prueba:
- Admin
- Patient
- Professional
- Owner

---

## 🌐 URLs de desarrollo

- **Frontend**: Next.js (http://localhost:3000)
- **Backend**: Nest.js (http://localhost:3001)
# Railway Deploy Trigger
