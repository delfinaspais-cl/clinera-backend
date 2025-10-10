# Cambio de Estado de Clínicas: "activo" → "activa"

## 📋 Problema Identificado

El estado de las clínicas se estaba guardando como `"activo"` (masculino) cuando debería ser `"activa"` (femenino, ya que es "la clínica").

Esto causaba inconsistencias en:
- Filtros del frontend
- Validaciones
- Comparaciones de estado

## ✅ Cambios Realizados

### 1. **Schema de Prisma**
```diff
- estado String? @default("activo")
+ estado String? @default("activa")
```

### 2. **DTOs de Validación**

**`src/owners/dto/update-clinica-estado.dto.ts`:**
```typescript
@IsIn(['activa', 'inactiva'], { 
  message: 'El estado debe ser "activa" o "inactiva"' 
})
estado: 'activa' | 'inactiva';
```

**`src/owners/dto/create-clinica-pendiente.dto.ts`:**
```typescript
estado?: string = 'activa';
```

### 3. **Servicios Actualizados**

- ✅ `src/clinicas/global-clinicas.controller.ts` → `estado: 'activa'`
- ✅ `src/owners/owners.service.ts` → `estado: 'activa'`
- ✅ `src/subscriptions/clinic-subscription-integration.service.ts` → `estado: 'activa'`
- ✅ `src/messages/seed-chat-data.ts` → `estado: 'activa'`

### 4. **Estados Válidos**

```typescript
type EstadoClinica = 'activa' | 'inactiva';
```

## 🗄️ Actualizar Base de Datos Existente

### Opción A: Ejecutar SQL en Railway

1. Ve al panel de Railway
2. Abre la base de datos PostgreSQL
3. Ejecuta el archivo: `fix-estado-clinicas.sql`

O ejecuta directamente:
```sql
UPDATE "Clinica" 
SET estado = 'activa',
    "updatedAt" = NOW()
WHERE estado = 'activo';
```

### Opción B: Usar Prisma Studio

```bash
npx prisma studio
```

Y actualizar manualmente las clínicas.

### Opción C: Script Node.js

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEstadoClinicas() {
  const result = await prisma.clinica.updateMany({
    where: { estado: 'activo' },
    data: { estado: 'activa' }
  });
  
  console.log(`✅ ${result.count} clínicas actualizadas`);
}

fixEstadoClinicas();
```

## 🔍 Verificar Cambios

Después de actualizar la base de datos:

```sql
-- Ver distribución de estados
SELECT estado, COUNT(*) 
FROM "Clinica" 
GROUP BY estado;

-- Debería mostrar:
-- activa   | X
-- inactiva | Y
```

## 🚀 Desplegar Cambios

```bash
git add .
git commit -m "fix: Cambiar estado de clínicas de 'activo' a 'activa' (femenino)"
git push origin main
```

## 📝 Notas Importantes

1. **Nuevas clínicas**: Se crearán automáticamente con `estado: 'activa'`
2. **Clínicas existentes**: Necesitan ser actualizadas con el SQL
3. **Frontend**: Debe usar `'activa'` e `'inactiva'` en filtros y comparaciones
4. **Consistencia**: Mantener el género femenino en todos los estados

## ✅ Checklist

- [x] Schema de Prisma actualizado
- [x] DTOs de validación actualizados
- [x] Servicios de creación actualizados
- [x] Script SQL para migración creado
- [ ] Ejecutar migración en Railway (pendiente de usuario)
- [ ] Verificar clínicas existentes
- [ ] Actualizar frontend si es necesario

## 🎯 Impacto en el Frontend

El frontend debe actualizar:

```javascript
// Antes:
if (clinica.estado === 'activo') { ... }

// Ahora:
if (clinica.estado === 'activa') { ... }
```

```javascript
// Filtros:
const filtrarClinicas = (estado) => {
  return clinicas.filter(c => c.estado === estado);
};

// Uso:
filtrarClinicas('activa');  // ✅
filtrarClinicas('inactiva'); // ✅
```

## 📊 Estados Disponibles

| Estado | Uso | Descripción |
|--------|-----|-------------|
| `activa` | Clínica funcionando | Puede recibir turnos y operar normalmente |
| `inactiva` | Clínica deshabilitada | No puede operar, solo visualización |

---

**Fecha de implementación:** 2025-10-10  
**Requiere:** Actualizar base de datos + redeploy

