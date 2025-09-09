# 📋 Sistema de Fichas Médicas con Historial de Versiones

## 🎯 Descripción

Sistema completo de fichas médicas con versionado que permite:
- Crear y mantener historial de versiones de fichas médicas
- Comparar versiones entre sí
- Gestionar archivos e imágenes por versión
- Buscar y filtrar fichas médicas
- Obtener estadísticas y reportes

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### `FichaMedicaHistorial`
```sql
CREATE TABLE ficha_medica_historial (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
  clinica_id INTEGER REFERENCES clinicas(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_por INTEGER REFERENCES usuarios(id),
  
  -- Datos básicos
  grupo_sanguineo VARCHAR(10),
  ocupacion VARCHAR(255),
  alergias TEXT,
  medicamentos_actuales TEXT,
  antecedentes_patologicos TEXT,
  antecedentes_quirurgicos TEXT,
  antecedentes_familiares TEXT,
  habitos TEXT,
  
  -- Historia clínica
  motivo_consulta TEXT,
  sintomas TEXT,
  diagnostico TEXT,
  tratamiento TEXT,
  evolucion TEXT,
  
  -- Metadatos
  notas_cambio TEXT,
  es_version_actual BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `FichaMedicaArchivo`
```sql
CREATE TABLE ficha_medica_archivos (
  id SERIAL PRIMARY KEY,
  ficha_historial_id INTEGER REFERENCES ficha_medica_historial(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL, -- 'archivo' o 'imagen'
  nombre VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  descripcion TEXT,
  fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Endpoints Principales

### 1. Obtener Ficha Médica Actual
```http
GET /api/clinica/{clinicaUrl}/pacientes/{pacienteId}/ficha-medica
```

**Respuesta:**
```json
{
  "id": "version_id",
  "pacienteId": "paciente_id",
  "version": 3,
  "fechaCreacion": "2024-01-15T10:30:00Z",
  "creadoPor": {
    "id": "user_id",
    "nombre": "Dr. García",
    "especialidad": "Cardiología"
  },
  "datosBasicos": {
    "grupoSanguineo": "O+",
    "ocupacion": "Ingeniero",
    "alergias": "Penicilina, Polen",
    "medicamentosActuales": "Aspirina 100mg",
    "antecedentesPatologicos": "Hipertensión",
    "antecedentesQuirurgicos": "Apendicectomía 2010",
    "antecedentesFamiliares": "Diabetes materna",
    "habitos": "No fuma, ejercicio regular"
  },
  "historiaClinica": {
    "motivoConsulta": "Dolor en el pecho",
    "sintomas": "Dolor opresivo, sudoración",
    "diagnostico": "Angina de pecho",
    "tratamiento": "Nitroglicerina, reposo",
    "evolucion": "Mejoría con tratamiento"
  },
  "archivos": [
    {
      "id": "archivo_id",
      "tipo": "archivo",
      "nombre": "electrocardiograma.pdf",
      "url": "https://storage.../ecg.pdf",
      "descripcion": "ECG de reposo",
      "fechaSubida": "2024-01-15T10:30:00Z"
    }
  ],
  "imagenes": [
    {
      "id": "imagen_id",
      "tipo": "imagen",
      "nombre": "radiografia_torax.jpg",
      "url": "https://storage.../rx.jpg",
      "descripcion": "Radiografía de tórax PA",
      "fechaSubida": "2024-01-15T10:30:00Z"
    }
  ],
  "notasCambio": "Se agregaron nuevos estudios complementarios",
  "esVersionActual": true
}
```

### 2. Obtener Historial Completo
```http
GET /api/clinica/{clinicaUrl}/pacientes/{pacienteId}/ficha-medica/historial
```

**Respuesta:**
```json
{
  "paciente": {
    "id": "paciente_id",
    "nombre": "Juan Pérez",
    "email": "juan@email.com"
  },
  "versiones": [
    {
      "id": "version_3_id",
      "version": 3,
      "fechaCreacion": "2024-01-15T10:30:00Z",
      "creadoPor": "Dr. García",
      "notasCambio": "Se agregaron nuevos estudios complementarios",
      "esVersionActual": true,
      "resumenCambios": "Se agregaron nuevos estudios complementarios. Se actualizaron: diagnóstico, tratamiento"
    },
    {
      "id": "version_2_id",
      "version": 2,
      "fechaCreacion": "2024-01-10T14:20:00Z",
      "creadoPor": "Dr. López",
      "notasCambio": "Actualización de medicamentos",
      "esVersionActual": false,
      "resumenCambios": "Actualización de medicamentos. Se actualizaron: medicamentos"
    }
  ],
  "totalVersiones": 3
}
```

### 3. Crear Nueva Versión
```http
POST /api/clinica/{clinicaUrl}/pacientes/{pacienteId}/ficha-medica/version
```

**Body:**
```json
{
  "datosBasicos": {
    "alergias": "Penicilina, Polen, Nueces",
    "medicamentosActuales": "Aspirina 100mg, Metformina 500mg"
  },
  "historiaClinica": {
    "diagnostico": "Angina de pecho estable",
    "tratamiento": "Nitroglicerina, Metoprolol 50mg"
  },
  "notasCambio": "Se detectaron nuevas alergias y se ajustó el tratamiento"
}
```

### 4. Comparar Versiones
```http
GET /api/clinica/{clinicaUrl}/pacientes/{pacienteId}/ficha-medica/compare/{version1Id}/{version2Id}
```

**Respuesta:**
```json
{
  "version1": { /* FichaMedicaHistorialResponseDto */ },
  "version2": { /* FichaMedicaHistorialResponseDto */ },
  "diferencias": [
    {
      "campo": "datosBasicos.alergias",
      "valorAnterior": "Penicilina, Polen",
      "valorNuevo": "Penicilina, Polen, Nueces",
      "tipo": "modificado"
    },
    {
      "campo": "historiaClinica.tratamiento",
      "valorAnterior": "Nitroglicerina, reposo",
      "valorNuevo": "Nitroglicerina, Metoprolol 50mg",
      "tipo": "modificado"
    }
  ],
  "archivosAgregados": [
    {
      "id": "nuevo_archivo_id",
      "tipo": "archivo",
      "nombre": "analisis_sangre.pdf",
      "url": "https://storage.../analisis.pdf",
      "descripcion": "Análisis de sangre completo",
      "fechaSubida": "2024-01-15T10:30:00Z"
    }
  ],
  "archivosEliminados": [],
  "imagenesAgregadas": [],
  "imagenesEliminadas": []
}
```

## 📁 Gestión de Archivos e Imágenes

### Subir Archivo a Versión Específica
```http
POST /api/clinica/{clinicaUrl}/pacientes/{pacienteId}/ficha-medica/version/{versionId}/upload-file
```

**Form Data:**
- `file`: Archivo (PDF, DOC, DOCX para archivos; JPG, PNG, etc. para imágenes)
- `tipo`: "archivo" o "imagen"
- `descripcion`: Descripción opcional

### Obtener Archivos de una Versión
```http
GET /api/clinica/{clinicaUrl}/pacientes/{pacienteId}/ficha-medica/version/{versionId}/archivos
```

### Eliminar Archivo
```http
DELETE /api/clinica/{clinicaUrl}/pacientes/{pacienteId}/ficha-medica/version/{versionId}/archivos/{archivoId}
```

## 🔍 Búsqueda y Filtrado

### Buscar Fichas Médicas
```http
GET /api/clinica/{clinicaUrl}/fichas-medicas?search=diabetes&fechaDesde=2024-01-01&fechaHasta=2024-01-31&doctorId=doctor_id
```

### Obtener Estadísticas
```http
GET /api/clinica/{clinicaUrl}/fichas-medicas/stats
```

**Respuesta:**
```json
{
  "totalFichas": 150,
  "fichasActualizadas30Dias": 45,
  "fichasPendientesActualizacion": 12,
  "promedioVersionesPorFicha": 2.3
}
```

### Pacientes con Fichas Recientes
```http
GET /api/clinica/{clinicaUrl}/fichas-medicas/pacientes/fichas-recientes?dias=7
```

## 🔄 Funcionalidades Adicionales

### Restaurar Versión Anterior
```http
POST /api/clinica/{clinicaUrl}/pacientes/{pacienteId}/ficha-medica/restore/{versionId}
```

**Body:**
```json
{
  "notasCambio": "Se restauró la versión anterior debido a error en el diagnóstico"
}
```

## 💡 Ejemplos de Uso en Frontend

### React/TypeScript

```typescript
// Obtener ficha médica actual
const getFichaActual = async (clinicaUrl: string, pacienteId: string) => {
  const response = await fetch(`/api/clinica/${clinicaUrl}/pacientes/${pacienteId}/ficha-medica`);
  return await response.json();
};

// Crear nueva versión
const crearNuevaVersion = async (
  clinicaUrl: string, 
  pacienteId: string, 
  datos: CrearVersionFichaMedicaDto
) => {
  const response = await fetch(`/api/clinica/${clinicaUrl}/pacientes/${pacienteId}/ficha-medica/version`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(datos)
  });
  return await response.json();
};

// Subir archivo
const subirArchivo = async (
  clinicaUrl: string,
  pacienteId: string,
  versionId: string,
  file: File,
  tipo: 'archivo' | 'imagen',
  descripcion?: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tipo', tipo);
  if (descripcion) formData.append('descripcion', descripcion);

  const response = await fetch(
    `/api/clinica/${clinicaUrl}/pacientes/${pacienteId}/ficha-medica/version/${versionId}/upload-file`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );
  return await response.json();
};

// Comparar versiones
const compararVersiones = async (
  clinicaUrl: string,
  pacienteId: string,
  version1Id: string,
  version2Id: string
) => {
  const response = await fetch(
    `/api/clinica/${clinicaUrl}/pacientes/${pacienteId}/ficha-medica/compare/${version1Id}/${version2Id}`
  );
  return await response.json();
};
```

### Componente React de Ejemplo

```tsx
import React, { useState, useEffect } from 'react';

interface FichaMedicaProps {
  clinicaUrl: string;
  pacienteId: string;
}

const FichaMedicaHistorial: React.FC<FichaMedicaProps> = ({ clinicaUrl, pacienteId }) => {
  const [fichaActual, setFichaActual] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [ficha, hist] = await Promise.all([
          getFichaActual(clinicaUrl, pacienteId),
          getHistorial(clinicaUrl, pacienteId)
        ]);
        setFichaActual(ficha);
        setHistorial(hist);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [clinicaUrl, pacienteId]);

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="ficha-medica-historial">
      <h2>Ficha Médica - Versión {fichaActual.version}</h2>
      
      {/* Datos básicos */}
      <section className="datos-basicos">
        <h3>Datos Básicos</h3>
        <div className="grid">
          <div>
            <label>Grupo Sanguíneo:</label>
            <span>{fichaActual.datosBasicos.grupoSanguineo || 'No especificado'}</span>
          </div>
          <div>
            <label>Alergias:</label>
            <span>{fichaActual.datosBasicos.alergias || 'Ninguna'}</span>
          </div>
          {/* Más campos... */}
        </div>
      </section>

      {/* Historia clínica */}
      <section className="historia-clinica">
        <h3>Historia Clínica</h3>
        <div className="grid">
          <div>
            <label>Diagnóstico:</label>
            <span>{fichaActual.historiaClinica.diagnostico || 'No especificado'}</span>
          </div>
          <div>
            <label>Tratamiento:</label>
            <span>{fichaActual.historiaClinica.tratamiento || 'No especificado'}</span>
          </div>
          {/* Más campos... */}
        </div>
      </section>

      {/* Archivos e imágenes */}
      <section className="archivos">
        <h3>Archivos Médicos</h3>
        <div className="archivos-grid">
          {fichaActual.archivos.map(archivo => (
            <div key={archivo.id} className="archivo-item">
              <a href={archivo.url} target="_blank" rel="noopener noreferrer">
                {archivo.nombre}
              </a>
              <p>{archivo.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Historial de versiones */}
      <section className="historial">
        <h3>Historial de Versiones</h3>
        <div className="versiones-list">
          {historial.versiones.map(version => (
            <div key={version.id} className={`version-item ${version.esVersionActual ? 'actual' : ''}`}>
              <div className="version-header">
                <span className="version-number">v{version.version}</span>
                <span className="version-date">{new Date(version.fechaCreacion).toLocaleDateString()}</span>
                <span className="version-creator">{version.creadoPor}</span>
              </div>
              <p className="version-changes">{version.resumenCambios}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FichaMedicaHistorial;
```

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT. Incluir el token en el header:

```http
Authorization: Bearer <jwt_token>
```

## 📝 Notas Importantes

1. **Versionado Automático**: Cada vez que se crea una nueva versión, se marca automáticamente como la versión actual y las anteriores se marcan como no actuales.

2. **Integridad de Datos**: Los archivos e imágenes están vinculados a versiones específicas, manteniendo la integridad histórica.

3. **Búsqueda Avanzada**: El sistema permite búsquedas por texto, fechas y doctor, facilitando la gestión de grandes volúmenes de fichas.

4. **Comparación Detallada**: La funcionalidad de comparación muestra exactamente qué cambió entre versiones, incluyendo archivos agregados/eliminados.

5. **Estadísticas**: El sistema proporciona métricas útiles para el seguimiento y gestión de las fichas médicas.

## 🚀 Próximas Funcionalidades

- Exportación de fichas médicas en PDF
- Notificaciones automáticas de cambios
- Integración con sistemas de laboratorio
- Backup automático de versiones
- Auditoría completa de cambios
