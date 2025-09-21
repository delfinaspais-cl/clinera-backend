# Sistema de Suscripciones - Clinera Backend

## 📋 Resumen

Este sistema implementa un modelo de suscripciones con 3 planes (CORE, FLOW, NEXUS) y período de prueba de 7 días para clínicas. Cuando una persona se registra y crea una clínica, automáticamente se le asigna un período de prueba que expira en 7 días, momento en el cual debe elegir uno de los 3 planes disponibles.

## 🎯 Planes Disponibles

### CORE - $70 USD/mes
- **Tagline**: Agenda + Ventas
- **Características**:
  - Agenda 24/7
  - Vista calendario y agenda
  - Panel de ventas básico
  - Gestión de clientes
  - Gestión de citas
- **Límites**:
  - 3 profesionales incluidos (+$10 USD por extra)
  - 1,000 UAM incluidos (+$0.25 USD por UAM extra)
  - 1GB de almacenamiento

### FLOW - $120 USD/mes (POPULAR)
- **Tagline**: Agenda + Ventas + Mensajería
- **Características**:
  - Todo lo de CORE
  - Mensajería omnicanal
  - Plantillas WhatsApp HSM
  - Embudo de contactos y etapas
  - Webhook de WhatsApp
  - Gestión de citas desde el chat
- **Límites**:
  - 3 profesionales incluidos (+$15 USD por extra)
  - 2,000 UAM incluidos (+$0.25 USD por UAM extra)
  - 2GB de almacenamiento

### NEXUS - $180 USD/mes
- **Tagline**: FLOW + IA + API + Builder
- **Características**:
  - Todo lo de FLOW
  - Asistente IA en chat
  - API y webhooks para integraciones
  - Creador de embudos avanzado
  - Reportes y paneles avanzados
- **Límites**:
  - 3 profesionales incluidos (+$20 USD por extra)
  - 3,000 UAM incluidos (+$0.25 USD por UAM extra)
  - 5GB de almacenamiento

## 🗄️ Estructura de Base de Datos

### Modelo Plan
```sql
model Plan {
  id                String        @id @default(cuid())
  nombre            String        @unique
  tagline           String?       // "Agenda + Ventas", etc.
  descripcion       String
  precio            Float
  moneda            String        @default("USD")
  intervalo         String        @default("monthly")
  activo            Boolean       @default(true)
  popular           Boolean       @default(false)
  caracteristicas   String[]      @default([])
  limitaciones      Json?         // Límites del plan
  orden             Int           @default(0)
  icono             String?       // Para iconos como robot
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  suscripciones     Suscripcion[]
  historialPagos    HistorialPago[]
}
```

### Modelo Suscripcion
```sql
model Suscripcion {
  id                String        @id @default(cuid())
  clinicaId         String        @unique
  planId            String
  estado            String        @default("trial") // trial, active, suspended, cancelled, expired
  fechaInicio       DateTime      @default(now())
  fechaFin          DateTime?
  fechaTrialFin     DateTime?     // Fecha de fin del período de prueba
  ultimoPago        DateTime?
  proximoPago       DateTime?
  metodoPago        String?       // stripe, paypal, etc.
  idPagoExterno     String?       // ID del pago en el sistema externo
  trialDias         Int           @default(7)
  autoRenovar       Boolean       @default(true)
  canceladoEn       DateTime?
  motivoCancelacion String?
  notas             String?
  metadata          Json?         // Datos adicionales como límites usados
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  clinica           Clinica       @relation(fields: [clinicaId], references: [id], onDelete: Cascade)
  plan              Plan          @relation(fields: [planId], references: [id])
  historialPagos    HistorialPago[]
}
```

## 🚀 Flujo de Implementación

### 1. Registro de Nueva Clínica
1. Usuario se registra y crea clínica
2. Sistema automáticamente crea suscripción de prueba con plan CORE
3. Estado inicial: `trial` con 7 días de duración
4. Clínica puede usar todas las funcionalidades del plan CORE

### 2. Período de Prueba
- Duración: 7 días
- Plan por defecto: CORE
- Estado de clínica: `estadoPago: 'trial'`
- Notificaciones automáticas antes del vencimiento

### 3. Selección de Plan
- Al finalizar el trial, clínica debe elegir plan
- Opciones: CORE, FLOW, NEXUS
- Upgrade automático al plan seleccionado
- Estado cambia a `active`

### 4. Gestión de Límites
- Control de profesionales: máximo según plan + extras
- Control de UAM (Unidades de Actividad Mensual)
- Cálculo automático de uso vs límites
- Cobros por excedentes

## 📡 Endpoints API

### Planes
```http
GET /plans
GET /plans/popular
GET /plans/:id
GET /plans/name/:name
POST /plans (admin)
PUT /plans/:id (admin)
DELETE /plans/:id (admin)
```

### Suscripciones
```http
POST /subscriptions/trial
PUT /subscriptions/upgrade
GET /subscriptions/clinica/:clinicaId
PUT /subscriptions/cancel/:clinicaId
GET /subscriptions/usage/:clinicaId
POST /subscriptions/check-trial-expiration
```

### Clínicas (integrado)
```http
GET /clinicas/plans
GET /clinicas/:clinicaId/subscription
GET /clinicas/:clinicaId/subscription/usage
POST /clinicas/:clinicaId/subscription/trial
POST /clinicas/:clinicaId/subscription/upgrade
POST /clinicas/:clinicaId/subscription/cancel
GET /clinicas/:clinicaId/complete-info
```

## 🔧 Configuración

### 1. Ejecutar Migración
```bash
# Windows
setup-subscription-system.bat

# Linux/Mac
./setup-subscription-system.sh
```

### 2. Configuración Manual
```bash
# Migración de Prisma
npx prisma migrate dev --name subscription-system

# Poblar planes
npx ts-node prisma/seed-plans.ts

# Generar cliente
npx prisma generate
```

## 📊 Control de Uso (UAM)

### Cálculo de UAM
- Turnos creados: 1 UAM por turno
- Mensajes enviados: 0.1 UAM por mensaje
- Conversaciones activas: 0.5 UAM por conversación

### Límites por Plan
- CORE: 1,000 UAM/mes
- FLOW: 2,000 UAM/mes
- NEXUS: 3,000 UAM/mes

### Excedentes
- Costo extra: $0.25 USD por UAM adicional
- Facturación automática al final del mes

## 🔄 Automatización

### Verificación de Trials Expirados
```typescript
// Ejecutar diariamente
await subscriptionsService.checkTrialExpiration();
```

### Notificaciones
- 3 días antes del vencimiento del trial
- Al expirar el trial
- Al acercarse a límites de uso
- Confirmación de pagos

## 🎨 Integración Frontend

### Componentes Necesarios
1. **Selector de Planes**: Mostrar los 3 planes con características
2. **Dashboard de Suscripción**: Estado actual, uso, límites
3. **Upgrade Flow**: Proceso de cambio de plan
4. **Notificaciones**: Alertas de vencimiento y límites

### Estados de UI
- `trial`: Mostrar días restantes y opción de upgrade
- `active`: Mostrar uso actual y límites
- `expired`: Mostrar mensaje de renovación urgente
- `cancelled`: Mostrar opción de reactivar

## 🔐 Seguridad

### Validaciones
- Verificación de límites antes de operaciones
- Validación de estado de suscripción
- Control de acceso basado en plan
- Protección de endpoints sensibles

### Permisos
- Solo admins pueden cambiar planes
- Verificación de ownership de clínica
- Logs de cambios de suscripción

## 📈 Métricas y Reportes

### KPIs Importantes
- Conversión de trial a plan pagado
- Plan más popular
- Uso promedio de UAM por plan
- Churn rate por plan
- Revenue por plan

### Reportes Disponibles
- Suscripciones activas por plan
- Trials próximos a expirar
- Uso de límites por clínica
- Ingresos mensuales por plan

## 🚨 Monitoreo

### Alertas Críticas
- Trials expirados sin upgrade
- Límites de uso excedidos
- Fallos en procesamiento de pagos
- Errores en cálculo de UAM

### Logs Importantes
- Cambios de estado de suscripción
- Upgrades y downgrades
- Cancelaciones
- Pagos procesados

## 🔮 Futuras Mejoras

### Funcionalidades Planeadas
- Integración con Stripe/PayPal
- Planes anuales con descuento
- Planes personalizados
- API para terceros
- Dashboard de analytics avanzado
- Sistema de referidos
- Promociones y descuentos

### Optimizaciones
- Cache de límites de uso
- Cálculo asíncrono de UAM
- Notificaciones en tiempo real
- Migración automática de datos
