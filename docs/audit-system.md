# Sistema de Auditoría - Clinera Backend

## Descripción General

El sistema de auditoría implementado en Clinera Backend proporciona un registro completo y detallado de todas las acciones realizadas en el sistema, permitiendo el seguimiento, análisis y cumplimiento de requisitos de seguridad y compliance.

## Arquitectura del Sistema

### Componentes Principales

1. **AuditService** - Servicio core para logging y consultas
2. **AuditController** - API endpoints para consultas y exportación
3. **AuditInterceptor** - Interceptor básico para logging automático
4. **AdvancedAuditInterceptor** - Interceptor avanzado con decoradores
5. **@Audit Decorator** - Decorador personalizado para control granular
6. **AuditLog Model** - Modelo de base de datos para almacenamiento

### Flujo de Datos

```
Request → Interceptor → AuditService → Database
                ↓
        @Audit Decorator (opcional)
                ↓
        Custom Audit Logic
```

## Modelo de Datos

### Tabla AuditLog

```sql
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,                    -- Usuario que realizó la acción
  "clinicaId" TEXT,                 -- Clínica donde se realizó
  "action" TEXT NOT NULL,           -- Tipo de acción
  "resource" TEXT NOT NULL,         -- Recurso afectado
  "resourceId" TEXT,                -- ID del recurso específico
  "oldValues" TEXT,                 -- Valores anteriores (JSON)
  "newValues" TEXT,                 -- Valores nuevos (JSON)
  "metadata" TEXT,                  -- Metadatos adicionales (JSON)
  "ipAddress" TEXT,                 -- IP del usuario
  "userAgent" TEXT,                 -- User Agent del navegador
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

### Índices Optimizados

- `userId_idx` - Consultas por usuario
- `clinicaId_idx` - Consultas por clínica
- `action_idx` - Filtros por tipo de acción
- `resource_idx` - Filtros por recurso
- `resourceId_idx` - Búsquedas por ID específico
- `createdAt_idx` - Consultas temporales

## Funcionalidades Implementadas

### 1. Logging Automático

#### Interceptor Básico (AuditInterceptor)
- Captura automática de todas las peticiones HTTP
- Identificación de acciones (CREATE, UPDATE, DELETE, READ)
- Extracción de información del usuario y contexto
- Logging de IP y User Agent

#### Interceptor Avanzado (AdvancedAuditInterceptor)
- Soporte para decorador `@Audit`
- Control granular sobre qué endpoints auditar
- Inclusión opcional de request body y response
- Sanitización automática de datos sensibles

### 2. Logging Manual

#### Métodos del AuditService
```typescript
// Logging de creación
await auditService.logCreate(userId, clinicaId, resource, resourceId, newValues, metadata);

// Logging de actualización
await auditService.logUpdate(userId, clinicaId, resource, resourceId, oldValues, newValues, metadata);

// Logging de eliminación
await auditService.logDelete(userId, clinicaId, resource, resourceId, oldValues, metadata);

// Logging de autenticación
await auditService.logLogin(userId, clinicaId, success, metadata);
await auditService.logLogout(userId, clinicaId, metadata);
```

### 3. Consultas y Filtros

#### Filtros Disponibles
- **Usuario**: `userId`
- **Clínica**: `clinicaId`
- **Acción**: `action` (CREATE, UPDATE, DELETE, LOGIN_SUCCESS, etc.)
- **Recurso**: `resource` (USER, TURNO, CLINICA, etc.)
- **Rango de fechas**: `startDate`, `endDate`
- **Paginación**: `page`, `limit`

#### Ejemplos de Consultas
```typescript
// Logs de un usuario específico
const userLogs = await auditService.getAuditLogs({
  userId: 'user123',
  limit: 50
});

// Logs de una clínica en un período
const clinicLogs = await auditService.getAuditLogs({
  clinicaId: 'clinic456',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});

// Logs de acciones de creación
const createLogs = await auditService.getAuditLogs({
  action: 'CREATE',
  resource: 'TURNO'
});
```

### 4. Estadísticas y Reportes

#### Métricas Disponibles
- Total de acciones por tipo
- Acciones por usuario
- Acciones por recurso
- Distribución temporal
- Logins exitosos vs fallidos

#### Exportación
- Formato JSON
- Formato CSV
- Filtros aplicables
- Headers personalizados

## API Endpoints

### Consulta de Logs
```
GET /audit/logs
GET /audit/logs/:clinicaUrl
```

**Parámetros:**
- `userId` - ID del usuario
- `clinicaId` - ID de la clínica
- `action` - Tipo de acción
- `resource` - Recurso afectado
- `startDate` - Fecha de inicio
- `endDate` - Fecha de fin
- `page` - Página (default: 1)
- `limit` - Límite por página (default: 50)

### Estadísticas
```
GET /audit/stats
GET /audit/stats/:clinicaUrl
```

**Parámetros:**
- `clinicaId` - ID de la clínica
- `startDate` - Fecha de inicio
- `endDate` - Fecha de fin

### Exportación
```
GET /audit/export
```

**Parámetros:**
- Todos los filtros de consulta
- `format` - Formato (json/csv)

## Uso del Decorador @Audit

### Configuración Básica
```typescript
@Audit()
@Post('users')
async createUser(@Body() dto: CreateUserDto) {
  // Logging automático con valores por defecto
}
```

### Configuración Avanzada
```typescript
@Audit({
  action: 'USER_CREATE',
  resource: 'USER',
  includeBody: true,
  includeResponse: false
})
@Post('users')
async createUser(@Body() dto: CreateUserDto) {
  // Logging personalizado
}
```

### Excluir Endpoint
```typescript
@Audit({ skip: true })
@Get('health')
async healthCheck() {
  // No se registra en auditoría
}
```

## Integración con Autenticación

### Logging Automático de Login
El sistema está integrado con `AuthService` para registrar automáticamente:

- **Logins exitosos**: Usuario, rol, IP, User Agent
- **Logins fallidos**: Email, IP, User Agent, motivo del fallo
- **Logouts**: Usuario, timestamp

### Ejemplo de Log Generado
```json
{
  "id": "audit_123",
  "userId": "user_456",
  "clinicaId": "clinic_789",
  "action": "LOGIN_SUCCESS",
  "resource": "AUTH",
  "resourceId": null,
  "oldValues": null,
  "newValues": null,
  "metadata": "{\"email\":\"user@example.com\",\"role\":\"ADMIN\"}",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Seguridad y Privacidad

### Sanitización Automática
El sistema sanitiza automáticamente campos sensibles:
- Contraseñas
- Tokens de acceso
- Datos personales sensibles

### Control de Acceso
- Solo usuarios con roles `ADMIN` y `OWNER` pueden acceder a logs
- Filtrado automático por clínica para usuarios no-admin
- Validación de permisos en cada endpoint

### Retención de Datos
- Los logs se mantienen indefinidamente (configurable)
- Posibilidad de implementar políticas de retención
- Exportación para backup y análisis externo

## Tipos de Acciones Registradas

### Acciones CRUD
- `CREATE` - Creación de recursos
- `UPDATE` - Actualización de recursos
- `DELETE` - Eliminación de recursos
- `READ` - Lectura de recursos (opcional)

### Acciones de Autenticación
- `LOGIN_SUCCESS` - Login exitoso
- `LOGIN_FAILED` - Login fallido
- `LOGOUT` - Cierre de sesión
- `PASSWORD_RESET` - Reseteo de contraseña

### Acciones de Sistema
- `CONFIGURATION_CHANGE` - Cambios de configuración
- `PERMISSION_CHANGE` - Cambios de permisos
- `SYSTEM_MAINTENANCE` - Mantenimiento del sistema

## Recursos Auditados

### Recursos Principales
- `USER` - Usuarios del sistema
- `CLINICA` - Clínicas
- `TURNO` - Turnos/citas
- `PROFESSIONAL` - Profesionales
- `PATIENT` - Pacientes
- `MESSAGE` - Mensajes
- `NOTIFICATION` - Notificaciones

### Recursos de Sistema
- `AUTH` - Autenticación
- `CONFIG` - Configuración
- `PERMISSION` - Permisos
- `SYSTEM` - Sistema general

## Monitoreo y Alertas

### Métricas de Rendimiento
- Tiempo de respuesta de consultas
- Volumen de logs generados
- Uso de almacenamiento

### Alertas Recomendadas
- Múltiples logins fallidos
- Acciones críticas fuera de horario
- Volumen anormal de logs
- Errores en el sistema de auditoría

## Mejoras Futuras

### Funcionalidades Planificadas
1. **Alertas en tiempo real** para acciones críticas
2. **Análisis de patrones** para detectar comportamientos anómalos
3. **Integración con SIEM** para correlación de eventos
4. **Compresión de logs** para optimizar almacenamiento
5. **Dashboard de auditoría** con gráficos y métricas
6. **Notificaciones automáticas** para eventos importantes

### Optimizaciones Técnicas
1. **Índices compuestos** para consultas complejas
2. **Particionamiento de tablas** por fecha
3. **Archivado automático** de logs antiguos
4. **Cache de consultas frecuentes**
5. **Compresión de datos** en almacenamiento

## Configuración del Entorno

### Variables de Entorno
```env
# Configuración de auditoría
AUDIT_ENABLED=true
AUDIT_LOG_LEVEL=info
AUDIT_RETENTION_DAYS=365
AUDIT_MAX_LOG_SIZE=100MB
```

### Configuración de Base de Datos
```sql
-- Configuración recomendada para PostgreSQL
ALTER TABLE "AuditLog" SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);
```

## Troubleshooting

### Problemas Comunes

1. **Logs no se generan**
   - Verificar que AuditModule esté importado en AppModule
   - Confirmar que los interceptores estén registrados
   - Revisar logs del servidor para errores

2. **Consultas lentas**
   - Verificar índices en la base de datos
   - Optimizar filtros de consulta
   - Considerar paginación para grandes volúmenes

3. **Errores de permisos**
   - Verificar roles del usuario
   - Confirmar configuración de guards
   - Revisar decoradores de roles

### Comandos de Diagnóstico
```bash
# Verificar estado de la base de datos
npx prisma db push

# Generar cliente Prisma
npx prisma generate

# Verificar migraciones
npx prisma migrate status

# Consultar logs directamente
npx prisma studio
```

## Conclusión

El sistema de auditoría implementado proporciona una base sólida para el cumplimiento de requisitos de seguridad, trazabilidad y análisis de uso del sistema Clinera. La arquitectura modular permite fácil extensión y personalización según necesidades específicas.

La integración automática con el sistema de autenticación y los interceptores garantiza que todas las acciones importantes sean registradas sin intervención manual, mientras que los decoradores personalizados permiten control granular sobre el logging específico.
