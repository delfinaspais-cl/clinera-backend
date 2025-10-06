# Migración de Datos de Agenda Pro a Clinera

Este proyecto contiene scripts para migrar datos de pacientes desde un archivo Excel de Agenda Pro a la base de datos de Clinera para la clínica "metodo-hebe".

## 📁 Archivos del Proyecto

- `clientes_47066_1759595310.xlsx` - Archivo Excel con datos de pacientes de Agenda Pro
- `migration-config.js` - Configuración de la migración
- `migrate-agenda-pro-final.js` - Script principal de migración
- `test-migration-setup.js` - Script de prueba de configuración
- `read-excel-agenda-pro.js` - Script para leer y analizar el Excel

## 🚀 Instrucciones de Uso

### Paso 1: Configurar la Base de Datos

1. Obtén tu `DATABASE_URL` de Railway
2. Abre `migration-config.js`
3. Reemplaza la línea `DATABASE_URL` con tu URL real:
   ```javascript
   DATABASE_URL: 'postgresql://username:password@host:port/database'
   ```

### Paso 2: Configurar la Migración

En `migration-config.js`, ajusta la configuración según tus necesidades:

```javascript
MIGRATION: {
  CLINICA_IDENTIFIER: 'metodo-hebe',  // URL o nombre de la clínica
  EXCEL_FILE: 'clientes_47066_1759595310.xlsx',
  LIMIT_RECORDS: 0,                   // 0 = todos, o un número para limitar
  PREVIEW_ONLY: true,                 // true = solo preview, false = migrar
  BATCH_SIZE: 50                      // Registros por lote
}
```

### Paso 3: Ejecutar Pruebas

```bash
node test-migration-setup.js
```

Este script verificará:
- ✅ Configuración de la base de datos
- ✅ Archivo Excel
- ✅ Conexión a la base de datos
- ✅ Existencia de la clínica
- ✅ Pacientes existentes

### Paso 4: Ejecutar Preview (Recomendado)

```bash
node migrate-agenda-pro-final.js
```

Con `PREVIEW_ONLY: true`, esto mostrará:
- 📊 Total de registros a procesar
- 📄 Muestra de los datos
- 🔍 Validación de la configuración

### Paso 5: Ejecutar Migración Real

1. Cambia `PREVIEW_ONLY: false` en `migration-config.js`
2. Ejecuta nuevamente:
   ```bash
   node migrate-agenda-pro-final.js
   ```

## 📊 Estructura de Datos

### Excel de Agenda Pro
- **Email** → email del paciente
- **Nombres** → nombre del paciente
- **Apellidos** → apellidos del paciente
- **Teléfono** → teléfono del paciente
- **Número de cliente** → se guarda en notas
- **Fecha de creación** → fecha de creación del registro

### Base de Datos Clinera
Los datos se mapean a la tabla `Patient`:
- `name` - Nombre completo (Nombres + Apellidos)
- `email` - Email del paciente
- `phone` - Teléfono
- `birthDate` - No disponible en Excel (null)
- `notes` - Información adicional (número de cliente, fecha original)
- `clinicaId` - ID de la clínica metodo-hebe
- `createdAt` - Fecha de creación del registro

## ⚠️ Consideraciones Importantes

1. **Datos Duplicados**: El script verifica si ya existe un paciente con el mismo email en la clínica
2. **Validación**: Solo se procesan registros que tengan email y nombres
3. **Lotes**: Los datos se procesan en lotes para mejor rendimiento
4. **Errores**: Los errores se guardan en `migration-errors.json`

## 📈 Estadísticas del Excel

- **Total de registros**: 14,574 pacientes
- **Columnas disponibles**: 7 campos
- **Datos requeridos**: Email y Nombres

## 🔧 Solución de Problemas

### Error de Conexión a Base de Datos
```
Error: Environment variable not found: DATABASE_URL
```
**Solución**: Configura la `DATABASE_URL` en `migration-config.js`

### Clínica No Encontrada
```
❌ Clínica no encontrada
```
**Solución**: 
1. Verifica que la clínica existe en la base de datos
2. Usa el nombre exacto o URL de la clínica
3. Revisa las clínicas disponibles en el output del script

### Archivo Excel No Encontrado
```
❌ Error leyendo Excel: ENOENT: no such file or directory
```
**Solución**: Verifica que el archivo Excel esté en la misma carpeta que los scripts

## 📝 Logs y Reportes

- **Progreso**: Se muestra cada 10 registros procesados
- **Errores**: Se guardan en `migration-errors.json`
- **Resumen**: Se muestra al final de la migración

## ✅ Verificación Post-Migración

Después de la migración, puedes verificar los datos:

1. **Contar pacientes en la clínica**:
   ```sql
   SELECT COUNT(*) FROM "Patient" WHERE "clinicaId" = 'ID_DE_LA_CLINICA';
   ```

2. **Verificar pacientes recién creados**:
   ```sql
   SELECT * FROM "Patient" 
   WHERE "clinicaId" = 'ID_DE_LA_CLINICA' 
   AND "notes" LIKE '%Migrado desde Agenda Pro%'
   ORDER BY "createdAt" DESC
   LIMIT 10;
   ```

## 🎯 Resultado Esperado

La migración debería:
- ✅ Crear aproximadamente 14,574 pacientes
- ✅ Asignarlos a la clínica metodo-hebe
- ✅ Preservar toda la información disponible del Excel
- ✅ Evitar duplicados
- ✅ Generar reporte de errores si los hay

---

**Nota**: Siempre ejecuta primero en modo PREVIEW para verificar que todo esté configurado correctamente antes de hacer la migración real.
