# 🚀 Guía de Integración Frontend - Nuevo Sistema de Usuarios

## 📋 Información General

**Base URL:** `https://clinera-backend-production.up.railway.app`

Este documento contiene toda la información necesaria para implementar el nuevo sistema de usuarios en el frontend.

---

## 🎯 Endpoints del Sistema de Usuarios

### 1. **Registro de Usuario**

**Endpoint:** `POST /users/register`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "username": "juan_perez",
  "name": "Juan Pérez",
  "password": "miContraseña123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123456789",
    "email": "usuario@ejemplo.com",
    "username": "juan_perez",
    "name": "Juan Pérez",
    "role": "OWNER"
  }
}
```

**Validaciones:**
- Email debe ser válido
- Username debe tener al menos 3 caracteres
- Contraseña debe tener al menos 6 caracteres
- Email y username deben ser únicos

---

### 2. **Login de Usuario**

**Endpoint:** `POST /users/login`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "username": "juan_perez",  // Puede ser username o email
  "password": "miContraseña123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123456789",
    "email": "usuario@ejemplo.com",
    "username": "juan_perez",
    "name": "Juan Pérez",
    "role": "OWNER"
  }
}
```

---

### 3. **Obtener Perfil del Usuario**

**Endpoint:** `GET /users/profile`

**Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "clx123456789",
    "email": "usuario@ejemplo.com",
    "username": "juan_perez",
    "name": "Juan Pérez",
    "phone": null,
    "role": "OWNER",
    "estado": "activo",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "avatar_url": null
  }
}
```

---

### 4. **Obtener Clínicas del Usuario**

**Endpoint:** `GET /users/clinicas`

**Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Response (200):**
```json
{
  "success": true,
  "clinicas": [
    {
      "id": "clx987654321",
      "name": "Mi Clínica",
      "url": "mi-clinica",
      "estado": "activo",
      "estadoPago": "pagado",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "colorPrimario": "#3B82F6",
      "colorSecundario": "#1E40AF"
    }
  ]
}
```

---

### 5. **Crear Nueva Clínica**

**Endpoint:** `POST /users/clinicas`

**Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "nombre": "Mi Nueva Clínica",
  "url": "mi-nueva-clinica",
  "email": "admin@mi-nueva-clinica.com",
  "password": "admin123",
  "direccion": "Av. Principal 123",
  "telefono": "+54 11 1234-5678",
  "descripcion": "Descripción de la clínica",
  "colorPrimario": "#3B82F6",
  "colorSecundario": "#1E40AF",
  "estado": "activa"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Clínica creada exitosamente",
  "clinica": {
    "id": "clx987654321",
    "name": "Mi Nueva Clínica",
    "url": "mi-nueva-clinica",
    "estado": "activa"
  },
  "adminCredentials": {
    "email": "admin@mi-nueva-clinica.com",
    "password": "admin123",
    "note": "Guarda estas credenciales para acceder a la clínica"
  }
}
```

---

### 6. **Verificar Acceso a Clínica**

**Endpoint:** `GET /users/clinicas/{clinicaUrl}/access`

**Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Response (200):**
```json
{
  "success": true,
  "hasAccess": true,
  "clinica": {
    "id": "clx987654321",
    "name": "Mi Clínica",
    "url": "mi-clinica",
    "estado": "activo"
  }
}
```

---

## 📧 Sistema de Emails

### **Email de Bienvenida al Usuario**
Cuando un usuario se registra, recibe automáticamente un email con:
- ✅ Sus credenciales completas (email, username, contraseña)
- ✅ Recordatorio de seguridad para guardar las credenciales
- ✅ Instrucciones sobre qué puede hacer con su cuenta
- ✅ Enlace directo al dashboard
- ✅ Diseño profesional con colores de Clinera

### **Email de Credenciales de Admin**
Cuando se crea una clínica, se envía un email al admin con:
- ✅ Credenciales de acceso a la clínica
- ✅ URL de la clínica
- ✅ Instrucciones de uso como administrador

---

## 🎨 Flujo de Pantallas para el Frontend

### **1. Pantalla de Registro**
```typescript
interface RegisterForm {
  email: string;
  username: string;
  name: string;
  password: string;
  confirmPassword: string;
}
```

**Campos requeridos:**
- Email (válido y único)
- Username (mínimo 3 caracteres, único)
- Nombre completo
- Contraseña (mínimo 6 caracteres)
- Confirmar contraseña

### **2. Pantalla de Login**
```typescript
interface LoginForm {
  username: string; // Puede ser username o email
  password: string;
}
```

**Características:**
- Campo username acepta tanto username como email
- Validación de credenciales
- Manejo de errores de autenticación

### **3. Dashboard del Usuario**
**Funcionalidades:**
- Mostrar clínicas del usuario
- Botón para crear nueva clínica
- Información del perfil
- Opción de cerrar sesión

### **4. Pantalla de Crear Clínica**
```typescript
interface CreateClinicForm {
  nombre: string;
  url: string;
  email: string;
  password: string;
  direccion: string;
  telefono: string;
  descripcion: string;
  colorPrimario: string;
  colorSecundario: string;
}
```

**Características:**
- URL debe ser única
- Email para el admin de la clínica
- Contraseña para el admin
- Colores personalizables

---

## 🔧 Implementación en React/TypeScript

### **Servicio de Usuarios**
```typescript
class UserService {
  private baseURL = 'https://clinera-backend-production.up.railway.app';
  
  async register(data: RegisterForm) {
    const response = await fetch(`${this.baseURL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
  
  async login(data: LoginForm) {
    const response = await fetch(`${this.baseURL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
  
  async getProfile(token: string) {
    const response = await fetch(`${this.baseURL}/users/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
  
  async getUserClinicas(token: string) {
    const response = await fetch(`${this.baseURL}/users/clinicas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
  
  async createClinica(token: string, data: CreateClinicForm) {
    const response = await fetch(`${this.baseURL}/users/clinicas`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
  
  async checkClinicaAccess(token: string, clinicaUrl: string) {
    const response = await fetch(`${this.baseURL}/users/clinicas/${clinicaUrl}/access`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
}
```

### **Hook de Autenticación**
```typescript
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Verificar token válido
      userService.getProfile(token)
        .then(response => {
          if (response.success) {
            setUser(response.user);
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (credentials: LoginForm) => {
    try {
      const response = await userService.login(credentials);
      if (response.success) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('token', response.token);
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return { user, token, loading, login, logout };
};
```

### **Componente de Login**
```typescript
import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData);
    
    if (result.success) {
      // Redirigir al dashboard
      window.location.href = '/dashboard';
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username o Email"
        value={formData.username}
        onChange={(e) => setFormData({...formData, username: e.target.value})}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
};
```

---

## ⚠️ Manejo de Errores

### **Errores Comunes y sus Códigos:**

#### **409 - Conflict (Email o Username ya existe)**
```json
{
  "statusCode": 409,
  "message": "El email ya está registrado",
  "error": "Conflict"
}
```

#### **401 - Unauthorized (Credenciales inválidas)**
```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas",
  "error": "Unauthorized"
}
```

#### **400 - Bad Request (Datos inválidos)**
```json
{
  "statusCode": 400,
  "message": "El username debe tener al menos 3 caracteres",
  "error": "Bad Request"
}
```

#### **403 - Forbidden (Sin acceso a clínica)**
```json
{
  "statusCode": 403,
  "message": "No tienes acceso a esta clínica",
  "error": "Forbidden"
}
```

### **Función de Manejo de Errores**
```typescript
const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;
    switch (status) {
      case 400:
        return `Datos inválidos: ${data.message}`;
      case 401:
        return 'Credenciales inválidas';
      case 403:
        return 'No tienes permisos para esta acción';
      case 409:
        return 'El email o username ya está en uso';
      case 500:
        return 'Error interno del servidor';
      default:
        return 'Error desconocido';
    }
  }
  return 'Error de conexión';
};
```

---

## 🎯 Flujo Completo Recomendado

### **1. Pantalla de Registro**
- Formulario con validaciones
- Confirmación de contraseña
- Mensaje de éxito con información sobre el email
- Redirección automática al login

### **2. Pantalla de Login**
- Campo que acepta username o email
- Validación de credenciales
- Opción de "¿Olvidaste tu contraseña?" (futuro)
- Redirección al dashboard

### **3. Dashboard del Usuario**
- Lista de clínicas del usuario
- Botón "Crear Nueva Clínica"
- Información del perfil
- Opción de cerrar sesión

### **4. Crear Clínica**
- Formulario completo con validaciones
- URL única de la clínica
- Credenciales para el admin
- Colores personalizables
- Confirmación con credenciales del admin

### **5. Gestión de Clínicas**
- Lista de clínicas con estado
- Acceso directo a cada clínica
- Información de cada clínica

---

## 🔐 Consideraciones de Seguridad

### **Almacenamiento del Token**
```typescript
// Guardar token de forma segura
localStorage.setItem('token', token);

// Obtener token para requests
const token = localStorage.getItem('token');
```

### **Validación de Token**
```typescript
const isValidToken = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};
```

### **Interceptores de Requests**
```typescript
// Interceptor para agregar token automáticamente
const apiClient = axios.create({
  baseURL: 'https://clinera-backend-production.up.railway.app'
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 📱 Ejemplo de Estructura de Componentes

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── AuthGuard.tsx
│   ├── dashboard/
│   │   ├── UserDashboard.tsx
│   │   ├── ClinicasList.tsx
│   │   └── CreateClinicaForm.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       └── ErrorMessage.tsx
├── services/
│   ├── userService.ts
│   └── apiClient.ts
├── hooks/
│   ├── useAuth.ts
│   └── useClinicas.ts
├── types/
│   ├── user.ts
│   └── clinica.ts
└── utils/
    ├── validation.ts
    └── errorHandler.ts
```

---

## 🚀 Próximos Pasos

1. **Implementar pantalla de registro** con validaciones
2. **Crear pantalla de login** con manejo de errores
3. **Desarrollar dashboard** con lista de clínicas
4. **Implementar creación de clínicas** con formulario completo
5. **Agregar gestión de perfil** del usuario
6. **Implementar navegación** entre pantallas
7. **Agregar manejo de estados** de carga y errores

---

## 📞 Soporte

Si tienes alguna pregunta sobre la implementación o necesitas ayuda con algún endpoint específico, no dudes en contactar al equipo de desarrollo.

**¡El nuevo sistema está listo para ser implementado en el frontend!** 🎉
