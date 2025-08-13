# 🔍 Sistema de Auditoría - Clinera Backend

## 📋 Descripción

El sistema de auditoría proporciona trazabilidad completa de todas las acciones realizadas en la aplicación, registrando quién, cuándo, dónde y qué cambios se realizaron en el sistema.

## 🏗️ Arquitectura

### Componentes Principales

1. **AuditService** - Servicio principal para registrar y consultar logs
2. **AuditController** - Endpoints para consultar y exportar logs
3. **AuditInterceptor** - Interceptor automático para registrar acciones
4. **AdvancedAuditInterceptor** - Interceptor avanzado con decoradores
5. **Audit Decorator** - Decorador personalizado para auditoría específica

### Modelo de Datos

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String?  // Usuario que realizó la acción
  clinicaId   String?  // Clínica donde se realizó la acción
  action      String   // Tipo de acción
  resource    String   // Recurso afectado
  resourceId  String?  // ID del recurso específico
  oldValues   String?  // Valores anteriores en JSON
  newValues   String?  // Valores nuevos en JSON
  metadata    String?  // Metadatos adicionales en JSON
  ipAddress   String?  // Dirección IP del usuario
  userAgent   String?  // User Agent del navegador
  createdAt   DateTime @default(now())

  user    User?    @relation("UserAuditLogs", fields: [userId], references: [id])
  clinica Clinica? @relation("ClinicaAuditLogs", fields: [clinicaId], references: [id])

  @@index([userId])
  @@index([clinicaId])
  @@index([action])
  @@index([resource])
  @@index([resourceId])
  @@index([createdAt])
}
```

## 🚀 Funcionalidades

### 1. Registro Automático de Acciones

El sistema registra automáticamente:
- ✅ Creaciones (POST)
- ✅ Actualizaciones (PUT/PATCH)
- ✅ Eliminaciones (DELETE)
- ✅ Lecturas (GET)
- ✅ Logins exitosos y fallidos
- ✅ Logouts

### 2. Información Capturada

Para cada acción se registra:
- **Usuario**: Quién realizó la acción
- **Clínica**: En qué clínica se realizó
- **Acción**: Tipo de operación
- **Recurso**: Qué entidad fue afectada
- **Valores**: Antes y después del cambio
- **Metadatos**: Información adicional
- **IP y User Agent**: Información del cliente
- **Timestamp**: Cuándo ocurrió

### 3. Consultas y Filtros

```typescript
// Filtros disponibles
interface AuditQueryFilters {
  userId?: string;
  clinicaId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}
```

### 4. Exportación

- **JSON**: Formato estructurado
- **CSV**: Para análisis en Excel/Google Sheets

## 📡 Endpoints API

### Obtener Logs de Auditoría
```
GET /audit/logs
GET /audit/logs?userId=123&action=CREATE&startDate=2024-01-01
```

### Estadísticas de Auditoría
```
GET /audit/stats
GET /audit/stats?clinicaId=456&startDate=2024-01-01
```

### Exportar Logs
```
GET /audit/export?format=csv
GET /audit/export?format=json&action=UPDATE
```

### Logs por Clínica
```
GET /audit/logs/clinica-url
GET /audit/stats/clinica-url
```

## 🔧 Uso en el Código

### 1. Uso Automático (Recomendado)

El sistema registra automáticamente todas las acciones HTTP:

```typescript
// Se registra automáticamente
@Post()
async createUser(@Body() dto: CreateUserDto) {
  return this.userService.create(dto);
}
```

### 2. Uso Manual con Decorador

```typescript
import { Audit } from '../audit/decorators/audit.decorator';

@Post()
@Audit({ 
  action: 'CREATE_USER', 
  resource: 'USER',
  includeBody: true 
})
async createUser(@Body() dto: CreateUserDto) {
  return this.userService.create(dto);
}

@Put(':id')
@Audit({ 
  action: 'UPDATE_USER', 
  resource: 'USER',
  includeBody: true,
  includeResponse: true 
})
async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  return this.userService.update(id, dto);
}
```

### 3. Uso Manual Directo

```typescript
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UserService {
  constructor(private auditService: AuditService) {}

  async createUser(dto: CreateUserDto, userId: string, clinicaId: string) {
    const user = await this.prisma.user.create({ data: dto });
    
    // Registrar auditoría manual
    await this.auditService.logCreate(
      userId,
      clinicaId,
      'USER',
      user.id,
      user,
      { source: 'manual' }
    );

    return user;
  }
}
```

### 4. Auditoría de Autenticación

```typescript
// Login exitoso
await this.auditService.logLogin(
  user.id,
  user.clinicaId,
  true,
  { email: user.email },
  ipAddress,
  userAgent
);

// Login fallido
await this.auditService.logLogin(
  'unknown',
  'unknown',
  false,
  { email: email, reason: 'Invalid password' },
  ipAddress,
  userAgent
);
```

## 🛡️ Seguridad

### Campos Sensibles

El sistema automáticamente redacta campos sensibles:
- `password`
- `token`
- `secret`
- `key`

### Límites de Tamaño

- Arrays limitados a 10 elementos en respuestas
- Metadatos sanitizados para evitar logs excesivos

## 📊 Tipos de Acciones

### Acciones del Sistema
- `CREATE` - Creación de recursos
- `UPDATE` - Actualización de recursos
- `DELETE` - Eliminación de recursos
- `READ` - Lectura de recursos

### Acciones de Autenticación
- `LOGIN_SUCCESS` - Login exitoso
- `LOGIN_FAILED` - Login fallido
- `LOGOUT` - Logout

### Recursos Comunes
- `USER` - Usuarios
- `CLINICA` - Clínicas
- `TURNO` - Turnos
- `PATIENT` - Pacientes
- `PROFESSIONAL` - Profesionales
- `AUTH` - Autenticación

## 🔍 Consultas de Ejemplo

### Logs de un Usuario Específico
```sql
SELECT * FROM "AuditLog" 
WHERE "userId" = 'user123' 
ORDER BY "createdAt" DESC;
```

### Acciones de Creación en una Clínica
```sql
SELECT * FROM "AuditLog" 
WHERE "clinicaId" = 'clinica456' 
AND "action" = 'CREATE'
AND "createdAt" >= '2024-01-01';
```

### Logins Fallidos
```sql
SELECT * FROM "AuditLog" 
WHERE "action" = 'LOGIN_FAILED'
AND "createdAt" >= NOW() - INTERVAL '24 hours';
```

## 📈 Estadísticas Disponibles

### Métricas Generales
- Total de logs
- Logs por tipo de acción
- Logs por recurso
- Usuarios más activos

### Métricas por Clínica
- Actividad por clínica
- Usuarios más activos por clínica
- Distribución de acciones

### Métricas Temporales
- Actividad por hora/día/mes
- Picos de actividad
- Tendencias de uso

## 🚀 Próximos Pasos

### Mejoras Planificadas
1. **Alertas Automáticas**: Notificaciones para acciones críticas
2. **Retención de Datos**: Políticas de limpieza automática
3. **Análisis Avanzado**: Machine Learning para detectar anomalías
4. **Dashboard**: Interfaz visual para análisis de auditoría
5. **Integración con SIEM**: Conexión con sistemas de seguridad

### Configuraciones Futuras
- Retención configurable por tipo de log
- Compresión de logs antiguos
- Backup automático de logs críticos
- Integración con sistemas de monitoreo externos

## 📝 Notas de Implementación

### Performance
- Los logs se escriben de forma asíncrona
- No bloquean las operaciones principales
- Índices optimizados para consultas frecuentes

### Escalabilidad
- Modelo preparado para grandes volúmenes
- Paginación en todas las consultas
- Filtros eficientes por índices

### Mantenimiento
- Logs de error separados del flujo principal
- Sanitización automática de datos sensibles
- Validación de datos de entrada

---

**¡El sistema de auditoría está completamente implementado y listo para uso en producción!** 🎉
