# 🔗 Integración con Mensapi

## 📋 Variables de Entorno Requeridas

Para que la integración con mensapi funcione correctamente, necesitas configurar las siguientes variables de entorno:

### Railway / Producción
```bash
MENSAPI_URL=https://mensapi.clinera.io
MENSAPI_SERVICE_EMAIL=tu-email@servicio.com
MENSAPI_SERVICE_PASSWORD=tu-password-seguro
```

### Local / Desarrollo
```bash
MENSAPI_URL=https://mensapi.clinera.io
MENSAPI_SERVICE_EMAIL=tu-email@servicio.com
MENSAPI_SERVICE_PASSWORD=tu-password-seguro
```

### 🔑 Credenciales de Servicio

**MENSAPI_SERVICE_EMAIL** y **MENSAPI_SERVICE_PASSWORD** son las credenciales de un usuario "sistema" que tiene permisos para crear usuarios en mensapi. Este usuario debe:

- Tener permisos de administrador en mensapi
- Ser un usuario dedicado para integraciones (no tu usuario personal)
- Tener una contraseña segura

## 🚀 Cómo Configurar en Railway

1. Ve a tu proyecto en Railway
2. Ve a la sección "Variables"
3. Agrega las variables:
   - **Nombre:** `MENSAPI_URL`
   - **Valor:** `https://mensapi.clinera.io`
   - **Nombre:** `MENSAPI_SERVICE_EMAIL`
   - **Valor:** `tu-email@servicio.com`
   - **Nombre:** `MENSAPI_SERVICE_PASSWORD`
   - **Valor:** `tu-password-seguro`
4. Guarda los cambios
5. Railway reiniciará automáticamente la aplicación

## 🔧 Cómo Funciona la Integración

### Flujo de Creación de Usuario

1. **Frontend** envía POST a `/clinica/:clinicaUrl/users`
2. **Backend** crea el usuario en la base de datos local
3. **Backend** se autentica con mensapi usando credenciales de servicio
4. **Backend** registra el usuario en mensapi con token de autenticación
5. **Backend** retorna la respuesta con información de ambos sistemas

### 🔐 Autenticación Automática

- El sistema se autentica automáticamente con mensapi usando las credenciales de servicio
- Los tokens se renuevan automáticamente cuando expiran
- Si la autenticación falla, el usuario se crea igual en la base de datos local

### Respuesta del Endpoint

```json
{
  "id": "user-id",
  "name": "Luis Palacios",
  "email": "luisp@mail.com",
  "role": "SECRETARY",
  "estado": "pendiente",
  "permisos": { /* permisos del usuario */ },
  "sucursales": ["Sucursal Central"],
  "especialidades": [],
  "clinica": {
    "id": "clinica-id",
    "name": "Clínica Demo",
    "url": "clinica-demo"
  },
  "mensapi": {
    "registered": true,
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### Manejo de Errores

Si mensapi no está disponible o falla el registro:
```json
{
  "mensapi": {
    "registered": false,
    "error": "No se pudo registrar en mensapi"
  }
}
```

**Importante:** El usuario se crea en la base de datos local incluso si falla el registro en mensapi.

## 🧪 Pruebas

### Probar la Integración

```bash
curl -X POST https://clinera-backend-develop.up.railway.app/clinica/clinica-demo/users \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Usuario Test",
    "email": "test@example.com",
    "tipo": "SECRETARY"
  }'
```

### Verificar en Mensapi

Después de crear el usuario, puedes verificar que se registró correctamente en mensapi usando los tokens devueltos.

## 🔍 Logs y Debugging

Los logs de la integración aparecerán en:
- **Railway:** En la sección "Deployments" > "View Logs"
- **Local:** En la consola donde ejecutas `npm run start:dev`

Busca mensajes como:
- `Registrando usuario en mensapi: email@example.com`
- `Usuario registrado exitosamente en mensapi: email@example.com`
- `Error registrando usuario en mensapi: [error details]`
