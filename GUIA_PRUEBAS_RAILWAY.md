# 🏥 Guía de Pruebas - Clinera API (Railway)

## 📍 **URL del Sistema**
**Desarrollo**: `https://tu-app-develop.railway.app/docs`

## 🔐 **Credenciales de Prueba**

### **Propietario (Owner)**
```json
{
  "username": "owner1@clinera.io",
  "password": "123456"
}
```

### **Administrador de Clínica**
```json
{
  "username": "admin1@clinica.io",
  "password": "123456",
  "clinicaUrl": "clinica-demo"
}
```

### **Profesional**
```json
{
  "username": "professional1@clinera.io",
  "password": "123456"
}
```

### **Secretaria**
```json
{
  "username": "secretary1@clinera.io",
  "password": "123456"
}
```

### **Paciente**
```json
{
  "username": "patient1@clinera.io",
  "password": "123456"
}
```

## 🧪 **Pasos para Probar**

### **1. Acceder al Sistema**
1. Abre tu navegador
2. Ve a: `https://tu-app-develop.railway.app/docs`
3. Verás la documentación interactiva de la API

### **2. Autenticarte**
1. Busca la sección **"Auth"**
2. Encuentra: `POST /auth/owner/login`
3. Haz clic en **"Try it out"**
4. Copia y pega las credenciales del propietario
5. Haz clic en **"Execute"**
6. Copia el token del response

### **3. Configurar Autorización**
1. En la parte superior, haz clic en **"Authorize"** 🔐
2. Escribe: `Bearer TU_TOKEN_AQUI`
3. Haz clic en **"Authorize"**
4. Cierra la ventana

### **4. Probar Funcionalidades**

#### **📊 Analytics del Propietario**
- Busca: `GET /owner/analytics`
- Haz clic en **"Try it out"** → **"Execute"**

#### **💬 Mensajes del Propietario**
- Busca: `GET /owner/messages`
- Haz clic en **"Try it out"** → **"Execute"**

#### **🔔 Crear Notificación**
- Busca: `POST /clinica/{clinicaUrl}/notifications`
- En `clinicaUrl` pon: `clinica-demo`
- En el body:
```json
{
  "titulo": "Prueba de notificación",
  "mensaje": "Esta es una notificación de prueba",
  "tipo": "info",
  "prioridad": "media"
}
```

#### **📈 Analytics de Clínica**
- Busca: `GET /clinica/{clinicaUrl}/analytics`
- En `clinicaUrl` pon: `clinica-demo`

## 🎯 **Funcionalidades Principales a Probar**

### **✅ Sistema de Notificaciones**
- [ ] Crear notificación
- [ ] Obtener notificaciones
- [ ] Marcar como leída
- [ ] Ver estadísticas

### **✅ Analytics**
- [ ] Analytics del propietario
- [ ] Analytics de clínica
- [ ] Estadísticas de turnos

### **✅ Mensajería**
- [ ] Crear mensaje del propietario
- [ ] Obtener mensajes
- [ ] Mensajes de clínica

### **✅ Gestión de Turnos**
- [ ] Obtener turnos
- [ ] Actualizar turno
- [ ] Eliminar turno

## 🔍 **Solución de Problemas**

### **Error 401 (Unauthorized)**
- Verifica que el token esté bien copiado
- Asegúrate de incluir "Bearer " antes del token

### **Error 404 (Not Found)**
- Verifica que la URL esté correcta
- Asegúrate de usar `clinica-demo` como clinicaUrl

### **Error 400 (Bad Request)**
- Verifica el formato del JSON
- Asegúrate de que todos los campos requeridos estén presentes

## 📞 **Contacto**
Si tienes problemas, contacta al equipo de desarrollo.

---

**Nota**: Este es el ambiente de **DESARROLLO**. Los datos pueden ser reseteados periódicamente.
