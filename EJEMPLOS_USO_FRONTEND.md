# 🚀 EJEMPLOS PRÁCTICOS DE USO - FRONTEND

## 📋 **FLUJOS COMUNES**

### **1. Flujo de Registro de Nueva Clínica**

```javascript
// 1. Registrar clínica completa
const registerClinic = async (clinicData) => {
  const response = await fetch('https://clinera-backend-develop.up.railway.app/owner/register-complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId: "professional",
      simulatePayment: true,
      admin: {
        nombre: clinicData.adminName,
        email: clinicData.adminEmail,
        password: clinicData.adminPassword
      },
      clinica: {
        nombre: clinicData.clinicName,
        url: clinicData.clinicUrl,
        color_primario: clinicData.primaryColor,
        color_secundario: clinicData.secondaryColor
      }
    })
  });

  const result = await response.json();
  
  if (result.success) {
    // Guardar token del admin
    localStorage.setItem('authToken', result.adminToken);
    localStorage.setItem('userRole', 'ADMIN');
    localStorage.setItem('clinicaUrl', result.clinica.url);
    
    return result;
  }
};

// 2. Login después del registro
const loginAfterRegister = async (email, password, clinicaUrl) => {
  const response = await fetch('https://clinera-backend-develop.up.railway.app/auth/clinica-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clinicaUrl: clinicaUrl,
      username: email,
      password: password
    })
  });

  const result = await response.json();
  
  if (result.success) {
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('userRole', result.user.role);
    localStorage.setItem('clinicaUrl', result.user.clinicaUrl);
    
    return result;
  }
};
```

### **2. Flujo de Login**

```javascript
// Login de Owner (Sistema)
const loginOwner = async (email, password) => {
  const response = await fetch('https://clinera-backend-develop.up.railway.app/auth/owner-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: email,
      password: password
    })
  });

  const result = await response.json();
  
  if (result.success) {
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('userRole', 'OWNER');
    
    return result;
  }
};

// Login de Clínica
const loginClinic = async (clinicaUrl, email, password) => {
  const response = await fetch('https://clinera-backend-develop.up.railway.app/auth/clinica-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clinicaUrl: clinicaUrl,
      username: email,
      password: password
    })
  });

  const result = await response.json();
  
  if (result.success) {
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('userRole', result.user.role);
    localStorage.setItem('clinicaUrl', result.user.clinicaUrl);
    
    return result;
  }
};
```

### **3. Gestión de Turnos**

```javascript
// Obtener turnos de la clínica
const getTurnos = async (clinicaUrl) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`https://clinera-backend-develop.up.railway.app/clinica/${clinicaUrl}/turnos`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  return await response.json();
};

// Crear nuevo turno
const createTurno = async (clinicaUrl, turnoData) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`https://clinera-backend-develop.up.railway.app/clinica/${clinicaUrl}/turnos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      paciente: turnoData.paciente,
      email: turnoData.email,
      telefono: turnoData.telefono,
      especialidad: turnoData.especialidad,
      doctor: turnoData.doctor,
      fecha: turnoData.fecha,
      hora: turnoData.hora,
      motivo: turnoData.motivo
    })
  });

  return await response.json();
};

// Cambiar estado de turno
const updateTurnoEstado = async (clinicaUrl, turnoId, estado) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`https://clinera-backend-develop.up.railway.app/clinica/${clinicaUrl}/turnos/${turnoId}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      estado: estado // 'pendiente', 'confirmado', 'cancelado'
    })
  });

  return await response.json();
};
```

### **4. Dashboard y Analytics**

```javascript
// Obtener analytics de la clínica
const getClinicaAnalytics = async (clinicaUrl) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`https://clinera-backend-develop.up.railway.app/clinica/${clinicaUrl}/analytics`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  return await response.json();
};

// Obtener estadísticas de turnos
const getTurnosStats = async (clinicaUrl) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`https://clinera-backend-develop.up.railway.app/clinica/${clinicaUrl}/turnos/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  return await response.json();
};
```

### **5. Gestión de Usuarios**

```javascript
// Obtener usuarios de la clínica
const getUsuarios = async (clinicaUrl) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`https://clinera-backend-develop.up.railway.app/clinica/${clinicaUrl}/usuarios`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  return await response.json();
};

// Crear nuevo usuario
const createUsuario = async (clinicaUrl, userData) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`https://clinera-backend-develop.up.railway.app/clinica/${clinicaUrl}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role, // 'ADMIN', 'PROFESSIONAL', 'SECRETARY', 'PATIENT'
      phone: userData.phone
    })
  });

  return await response.json();
};
```

### **6. Landing Público**

```javascript
// Obtener información del landing
const getLandingInfo = async (clinicaUrl) => {
  const response = await fetch(`https://clinera-backend-develop.up.railway.app/public/clinica/${clinicaUrl}/landing`);
  return await response.json();
};

// Crear turno desde landing público
const createTurnoFromLanding = async (clinicaUrl, turnoData) => {
  const response = await fetch(`https://clinera-backend-develop.up.railway.app/public/clinica/${clinicaUrl}/landing/turnos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nombre: turnoData.nombre,
      email: turnoData.email,
      telefono: turnoData.telefono,
      fecha: turnoData.fecha,
      hora: turnoData.hora,
      especialidad: turnoData.especialidad,
      doctor: turnoData.doctor,
      motivo: turnoData.motivo
    })
  });

  return await response.json();
};
```

### **7. Notificaciones**

```javascript
// Obtener notificaciones
const getNotificaciones = async (clinicaUrl) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`https://clinera-backend-develop.up.railway.app/clinica/${clinicaUrl}/notificaciones`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  return await response.json();
};

// Marcar notificación como leída
const markNotificacionAsRead = async (clinicaUrl, notificacionId) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`https://clinera-backend-develop.up.railway.app/clinica/${clinicaUrl}/notificaciones/${notificacionId}/read`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  return await response.json();
};
```

---

## 🔧 **UTILIDADES COMUNES**

### **Función para hacer requests autenticados**

```javascript
const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado, redirigir al login
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
```

### **Función para validar token**

```javascript
const validateToken = () => {
  const token = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');
  const clinicaUrl = localStorage.getItem('clinicaUrl');
  
  if (!token) {
    return false;
  }
  
  // Aquí podrías validar el token con el backend
  // Por ahora solo verificamos que exista
  return {
    isValid: true,
    userRole,
    clinicaUrl
  };
};
```

### **Función para logout**

```javascript
const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('clinicaUrl');
  localStorage.removeItem('userId');
  
  // Redirigir al login
  window.location.href = '/login';
};
```

---

## 📱 **EJEMPLOS DE COMPONENTES REACT**

### **Componente de Login**

```jsx
import React, { useState } from 'react';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    clinicaUrl: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('https://clinera-backend-develop.up.railway.app/auth/clinica-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicaUrl: formData.clinicaUrl,
          username: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();
      
      if (result.success) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userRole', result.user.role);
        localStorage.setItem('clinicaUrl', result.user.clinicaUrl);
        
        // Redirigir al dashboard
        window.location.href = '/dashboard';
      } else {
        alert('Error en el login');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Error de conexión');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="URL de la clínica"
        value={formData.clinicaUrl}
        onChange={(e) => setFormData({...formData, clinicaUrl: e.target.value})}
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
      />
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
};
```

### **Componente de Lista de Turnos**

```jsx
import React, { useState, useEffect } from 'react';

const TurnosList = () => {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const clinicaUrl = localStorage.getItem('clinicaUrl');

  useEffect(() => {
    fetchTurnos();
  }, []);

  const fetchTurnos = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://clinera-backend-develop.up.railway.app/clinica/${clinicaUrl}/turnos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      const data = await response.json();
      setTurnos(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching turnos:', error);
      setLoading(false);
    }
  };

  const updateEstado = async (turnoId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`https://clinera-backend-develop.up.railway.app/clinica/${clinicaUrl}/turnos/${turnoId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      
      // Recargar turnos
      fetchTurnos();
    } catch (error) {
      console.error('Error updating turno:', error);
    }
  };

  if (loading) return <div>Cargando turnos...</div>;

  return (
    <div>
      <h2>Turnos</h2>
      {turnos.map(turno => (
        <div key={turno.id} className="turno-card">
          <h3>{turno.paciente}</h3>
          <p>Fecha: {new Date(turno.fecha).toLocaleDateString()}</p>
          <p>Hora: {turno.hora}</p>
          <p>Especialidad: {turno.especialidad}</p>
          <p>Doctor: {turno.doctor}</p>
          <p>Estado: {turno.estado}</p>
          
          <div className="actions">
            {turno.estado === 'pendiente' && (
              <>
                <button onClick={() => updateEstado(turno.id, 'confirmado')}>
                  Confirmar
                </button>
                <button onClick={() => updateEstado(turno.id, 'cancelado')}>
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 🎨 **EJEMPLOS DE ESTILOS CSS**

### **Estilos para formularios**

```css
.form-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-input {
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-button {
  width: 100%;
  padding: 12px;
  background-color: #3B82F6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.form-button:hover {
  background-color: #1E40AF;
}
```

### **Estilos para tarjetas de turnos**

```css
.turno-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.turno-card h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.turno-card p {
  margin: 4px 0;
  color: #666;
}

.actions {
  margin-top: 12px;
}

.actions button {
  margin-right: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.actions button:first-child {
  background-color: #10B981;
  color: white;
}

.actions button:last-child {
  background-color: #EF4444;
  color: white;
}
```

---

## 🔍 **VALIDACIONES FRONTEND**

### **Validación de formularios**

```javascript
const validateTurnoForm = (data) => {
  const errors = {};

  if (!data.paciente || data.paciente.trim().length < 2) {
    errors.paciente = 'El nombre del paciente es requerido (mínimo 2 caracteres)';
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Email válido es requerido';
  }

  if (!data.telefono || data.telefono.trim().length < 8) {
    errors.telefono = 'Teléfono válido es requerido';
  }

  if (!data.especialidad || data.especialidad.trim().length === 0) {
    errors.especialidad = 'Especialidad es requerida';
  }

  if (!data.doctor || data.doctor.trim().length === 0) {
    errors.doctor = 'Doctor es requerido';
  }

  if (!data.fecha) {
    errors.fecha = 'Fecha es requerida';
  } else {
    const selectedDate = new Date(data.fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      errors.fecha = 'No se pueden crear turnos para fechas pasadas';
    }
  }

  if (!data.hora) {
    errors.hora = 'Hora es requerida';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

---

## 📊 **MANEJO DE ERRORES**

### **Función para manejar errores de API**

```javascript
const handleApiError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);
  
  let message = 'Error interno del servidor';
  
  if (error.response) {
    switch (error.response.status) {
      case 400:
        message = 'Datos inválidos';
        break;
      case 401:
        message = 'Sesión expirada';
        logout();
        break;
      case 403:
        message = 'Sin permisos para esta acción';
        break;
      case 404:
        message = 'Recurso no encontrado';
        break;
      case 409:
        message = 'Conflicto: el recurso ya existe';
        break;
      default:
        message = 'Error del servidor';
    }
  } else if (error.request) {
    message = 'Error de conexión';
  }
  
  // Mostrar mensaje al usuario (ej: con toast o alert)
  showNotification(message, 'error');
};
```

---

## 🚀 **CONFIGURACIÓN DE ENTORNO**

### **Variables de entorno (.env)**

```env
# Backend URL
REACT_APP_API_URL=https://clinera-backend-develop.up.railway.app

# Configuración de la aplicación
REACT_APP_APP_NAME=Clinera
REACT_APP_VERSION=1.0.0

# Configuración de desarrollo
REACT_APP_DEBUG=true
```

### **Configuración de la aplicación**

```javascript
// config.js
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'https://clinera-backend-develop.up.railway.app',
  appName: process.env.REACT_APP_APP_NAME || 'Clinera',
  debug: process.env.REACT_APP_DEBUG === 'true',
  
  // Endpoints
  endpoints: {
    auth: {
      ownerLogin: '/auth/owner-login',
      clinicLogin: '/auth/clinica-login',
      register: '/auth/register',
      registerComplete: '/owner/register-complete'
    },
    clinic: {
      analytics: (url) => `/clinica/${url}/analytics`,
      turnos: (url) => `/clinica/${url}/turnos`,
      usuarios: (url) => `/clinica/${url}/usuarios`,
      notificaciones: (url) => `/clinica/${url}/notificaciones`
    },
    public: {
      landing: (url) => `/public/clinica/${url}/landing`,
      createTurno: (url) => `/public/clinica/${url}/landing/turnos`
    }
  }
};

export default config;
```

