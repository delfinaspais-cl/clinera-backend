# 🔗 Integración Frontend - Endpoint de Contactos

## 📋 Información para el desarrollador frontend

### **URL del Backend Remoto**
```
https://clinera-backend-develop.up.railway.app
```

### **Endpoint de Contactos**
```
POST /api/contact
```

### **URL Completa**
```
https://clinera-backend-develop.up.railway.app/api/contact
```

---

## 📤 **Estructura de Datos a Enviar**

### **Campos Requeridos:**
- `nombre` (string, mínimo 2 caracteres)
- `email` (string, formato válido)
- `tipoConsulta` (string, uno de los valores permitidos)
- `mensaje` (string, mínimo 10 caracteres)

### **Campos Opcionales:**
- `telefono` (string)
- `empresa` (string)
- `plan` (string, uno de los valores permitidos)

### **Valores Permitidos:**

**tipoConsulta:**
- `"contratacion"`
- `"demo"`
- `"precios"`
- `"soporte"`
- `"personalizacion"`
- `"otro"`

**plan:**
- `"basico"`
- `"profesional"`
- `"empresarial"`
- `"personalizado"`

---

## 🔧 **Implementación del Botón "Enviar Consulta"**

### **1. Función JavaScript para enviar datos:**

```javascript
// Configuración
const API_BASE_URL = 'https://clinera-backend-develop.up.railway.app';
const CONTACT_ENDPOINT = '/api/contact';

// Función para enviar el formulario
async function enviarConsulta(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}${CONTACT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error enviando consulta:', error);
    throw error;
  }
}
```

### **2. Ejemplo de uso en el botón:**

```javascript
// En el evento click del botón "Enviar Consulta"
document.getElementById('btn-enviar-consulta').addEventListener('click', async function(e) {
  e.preventDefault();
  
  // Obtener datos del formulario
  const formData = {
    nombre: document.getElementById('nombre').value.trim(),
    email: document.getElementById('email').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    empresa: document.getElementById('empresa').value.trim(),
    tipoConsulta: document.getElementById('tipoConsulta').value,
    plan: document.getElementById('plan').value,
    mensaje: document.getElementById('mensaje').value.trim()
  };

  // Validaciones básicas
  if (!formData.nombre || formData.nombre.length < 2) {
    alert('El nombre debe tener al menos 2 caracteres');
    return;
  }

  if (!formData.email || !isValidEmail(formData.email)) {
    alert('Ingresa un email válido');
    return;
  }

  if (!formData.tipoConsulta) {
    alert('Selecciona un tipo de consulta');
    return;
  }

  if (!formData.mensaje || formData.mensaje.length < 10) {
    alert('El mensaje debe tener al menos 10 caracteres');
    return;
  }

  // Mostrar loading
  const button = this;
  const originalText = button.textContent;
  button.textContent = 'Enviando...';
  button.disabled = true;

  try {
    const result = await enviarConsulta(formData);
    
    if (result.success) {
      alert('✅ ' + result.message);
      // Limpiar formulario
      document.getElementById('contact-form').reset();
    } else {
      alert('❌ ' + result.message);
    }
  } catch (error) {
    alert('❌ Error de conexión. Intenta nuevamente.');
  } finally {
    // Restaurar botón
    button.textContent = originalText;
    button.disabled = false;
  }
});

// Función para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

---

## 📨 **Respuestas del Backend**

### **Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Consulta enviada exitosamente. Nos pondremos en contacto contigo en las próximas 24 horas.",
  "data": {
    "id": "clx1234567890",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "telefono": "+54 11 1234-5678",
    "empresa": "Clínica San Martín",
    "tipoConsulta": "demo",
    "plan": "profesional",
    "mensaje": "Me interesa conocer más sobre el sistema..."
  }
}
```

### **Respuesta de Error (400):**
```json
{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "email",
      "message": "El email debe tener un formato válido"
    },
    {
      "field": "mensaje",
      "message": "El mensaje debe tener al menos 10 caracteres"
    }
  ]
}
```

---

## 🎯 **Pasos para Implementar**

### **1. Reemplazar la función del botón actual:**
- Buscar el evento click del botón "Enviar Consulta"
- Reemplazar con la nueva función que hace fetch al backend

### **2. Asegurar que los campos del formulario tengan los nombres correctos:**
- `nombre`
- `email`
- `telefono`
- `empresa`
- `tipoConsulta`
- `plan`
- `mensaje`

### **3. Validaciones recomendadas:**
- Nombre: mínimo 2 caracteres
- Email: formato válido
- Tipo de consulta: requerido
- Mensaje: mínimo 10 caracteres

### **4. Manejo de respuestas:**
- Mostrar mensaje de éxito si `result.success === true`
- Mostrar mensaje de error si `result.success === false`
- Manejar errores de conexión

---

## ⚠️ **Consideraciones Importantes**

### **Rate Limiting:**
- El backend permite máximo 3 requests por email por 24 horas
- Si se excede, devolverá error 429

### **Emails Automáticos:**
- El usuario recibirá email de confirmación
- El equipo de ventas recibirá notificación
- Emails configurados: `delfina.spais@gmail.com` y `delfina.spais@oacg.cl`

### **CORS:**
- El backend está configurado para aceptar requests desde cualquier origen
- No se requieren headers adicionales de CORS

---

## 🧪 **Para Probar**

### **Datos de prueba válidos:**
```javascript
const testData = {
  nombre: 'Juan Pérez',
  email: 'juan@ejemplo.com',
  telefono: '+54 11 1234-5678',
  empresa: 'Clínica San Martín',
  tipoConsulta: 'demo',
  plan: 'profesional',
  mensaje: 'Me interesa conocer más sobre el sistema para mi clínica.'
};
```

### **Verificar conectividad:**
```javascript
// Test simple de conectividad
fetch('https://clinera-backend-develop.up.railway.app/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: 'Test',
    email: 'test@test.com',
    tipoConsulta: 'demo',
    mensaje: 'Test de conectividad'
  })
})
.then(response => response.json())
.then(data => console.log('Respuesta:', data))
.catch(error => console.error('Error:', error));
```

---

## 📞 **Soporte**

Si hay problemas con la integración:
1. Verificar que la URL del backend sea correcta
2. Revisar la consola del navegador para errores
3. Verificar que los nombres de los campos coincidan
4. Probar con datos de prueba válidos

**Backend URL:** `https://clinera-backend-develop.up.railway.app`
**Endpoint:** `POST /api/contact`
