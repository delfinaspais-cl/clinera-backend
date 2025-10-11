# Endpoint de Descarga de PDF de Ventas

## Descripción

Este endpoint permite obtener y descargar un PDF con el detalle completo de una venta específica. El PDF incluye toda la información de la venta: datos del comprador, paciente, tratamiento, montos, estado de pago, y más.

## Endpoint

### GET `/ventas/:id/pdf`

**Autenticación:** Requiere JWT Token

**Parámetros:**
- `id` (path parameter): ID de la venta (campo `id` en la base de datos)

## Uso desde el Frontend

### Opción 1: Con Axios (Recomendado)

```javascript
import axios from 'axios';

const descargarPDFVenta = async (ventaId) => {
  try {
    const token = localStorage.getItem('token'); // O como guardes tu token
    
    const response = await axios.get(
      `${API_URL}/ventas/${ventaId}/pdf`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // MUY IMPORTANTE: para manejar archivos binarios
      }
    );

    // Crear un blob URL del PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    // Crear un link temporal y hacer clic automático para descargar
    const link = document.createElement('a');
    link.href = url;
    link.download = `venta-${ventaId}.pdf`; // Nombre del archivo
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('PDF descargado exitosamente');
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    if (error.response?.status === 404) {
      alert('Venta no encontrada');
    } else {
      alert('Error al generar el PDF');
    }
  }
};

// Uso: llamar desde un botón
// <button onClick={() => descargarPDFVenta('venta-id-aqui')}>
//   Descargar PDF
// </button>
```

### Opción 2: Con Fetch API

```javascript
const descargarPDFVenta = async (ventaId) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/ventas/${ventaId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener el PDF');
    }

    // Convertir la respuesta a blob
    const blob = await response.blob();
    
    // Crear URL temporal
    const url = window.URL.createObjectURL(blob);
    
    // Crear link de descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = `venta-${ventaId}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error:', error);
    alert('Error al descargar el PDF');
  }
};
```

### Opción 3: Abrir en nueva pestaña (en lugar de descargar)

```javascript
const abrirPDFVenta = async (ventaId) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.get(
      `${API_URL}/ventas/${ventaId}/pdf`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      }
    );

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    
    // Abrir en nueva pestaña en lugar de descargar
    window.open(url, '_blank');
    
    // Limpiar después de un tiempo
    setTimeout(() => window.URL.revokeObjectURL(url), 100);

  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Ejemplo de Componente React Completo

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const VentasPDFDownloader = ({ ventaId, ventaIdDisplay }) => {
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const descargarPDF = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_URL}/ventas/${ventaId}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `venta-${ventaIdDisplay || ventaId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Notificación de éxito (puedes usar tu librería de notificaciones favorita)
      alert('PDF descargado exitosamente');
      
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      
      if (error.response?.status === 404) {
        alert('Venta no encontrada');
      } else if (error.response?.status === 401) {
        alert('No autorizado. Por favor inicia sesión nuevamente.');
      } else {
        alert('Error al generar el PDF. Por favor intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={descargarPDF}
      disabled={loading}
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm mr-2" />
          Generando PDF...
        </>
      ) : (
        <>
          📄 Descargar PDF
        </>
      )}
    </button>
  );
};

export default VentasPDFDownloader;

// Uso:
// <VentasPDFDownloader 
//   ventaId="clxxxxx123" 
//   ventaIdDisplay="V1234567890-abc123" 
// />
```

## Ejemplo con React Query (Para mejor manejo de estado)

```jsx
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const useDescargarPDFVenta = () => {
  return useMutation({
    mutationFn: async (ventaId) => {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/ventas/${ventaId}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      return response.data;
    },
    onSuccess: (data, ventaId) => {
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `venta-${ventaId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error('Error al descargar PDF:', error);
      alert('Error al generar el PDF');
    }
  });
};

// Componente usando el hook
const BotonDescargarPDF = ({ ventaId }) => {
  const { mutate, isLoading } = useDescargarPDFVenta();

  return (
    <button 
      onClick={() => mutate(ventaId)}
      disabled={isLoading}
    >
      {isLoading ? 'Generando...' : 'Descargar PDF'}
    </button>
  );
};
```

## Contenido del PDF

El PDF generado incluye las siguientes secciones:

### 1. **Header**
   - Nombre de la clínica
   - Dirección, teléfono y email de la clínica
   - Título: "DETALLE DE VENTA"
   - ID de la venta

### 2. **Información General**
   - Fecha de creación
   - Comprador
   - Paciente
   - Email
   - Teléfono
   - Profesional
   - Sucursal
   - Estado
   - Origen

### 3. **Tratamiento y Sesiones**
   - Nombre del tratamiento
   - Sesiones usadas / Total de sesiones
   - Fecha de vencimiento (si existe)

### 4. **Detalles Financieros**
   - Monto total
   - Monto abonado (en verde)
   - Monto pendiente (en rojo)
   - Estado de pago (con colores según estado)
   - Medio de pago
   - ATE (si existe)

### 5. **Notas Adicionales** (si existen)
   - Notas de la venta

### 6. **Footer**
   - Fecha y hora de generación del documento

## Diseño del PDF

- **Tamaño:** A4
- **Márgenes:** 50 puntos
- **Colores:**
  - Primario: Azul (#3B82F6)
  - Secundario: Azul oscuro (#1E40AF)
  - Texto: Gris oscuro (#374151)
  - Fondo de secciones: Gris claro (#F3F4F6)
  - Verde para montos positivos (#10B981)
  - Rojo para montos pendientes (#EF4444)
  - Amarillo para estados parciales (#F59E0B)

## Ejemplo de Tabla de Ventas con Botón de Descarga

```jsx
const TablaVentas = ({ ventas }) => {
  const descargarPDF = async (ventaId) => {
    // ... código de descarga aquí
  };

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th>ID Venta</th>
          <th>Paciente</th>
          <th>Tratamiento</th>
          <th>Monto Total</th>
          <th>Estado Pago</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {ventas.map((venta) => (
          <tr key={venta.id}>
            <td>{venta.ventaId}</td>
            <td>{venta.paciente}</td>
            <td>{venta.tratamiento}</td>
            <td>${parseFloat(venta.montoTotal).toFixed(2)}</td>
            <td>
              <span className={`badge ${
                venta.estadoPago === 'pagado' ? 'bg-green-100 text-green-800' :
                venta.estadoPago === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {venta.estadoPago.toUpperCase()}
              </span>
            </td>
            <td>
              <button 
                onClick={() => descargarPDF(venta.id)}
                className="text-blue-600 hover:text-blue-800"
                title="Descargar PDF"
              >
                📄 PDF
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

## Notas Importantes

1. **Autenticación:** El endpoint requiere autenticación JWT. Asegúrate de incluir el token en el header.

2. **ResponseType:** Es CRÍTICO usar `responseType: 'blob'` en axios o convertir la respuesta a blob con fetch para manejar correctamente archivos binarios.

3. **Manejo de errores:** Implementa manejo de errores apropiado para casos como venta no encontrada (404) o falta de autorización (401).

4. **Nombre del archivo:** El PDF se descargará con el nombre `venta-{ventaId}.pdf` donde ventaId es el ID personalizado de la venta.

5. **Cross-Origin:** Si tu frontend y backend están en dominios diferentes, asegúrate de tener CORS configurado correctamente.

## Respuestas del Endpoint

### Éxito (200)
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename=venta-{ventaId}.pdf`
- Body: Archivo PDF binario

### Venta no encontrada (404)
```json
{
  "statusCode": 404,
  "message": "Venta no encontrada"
}
```

### No autorizado (401)
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Error del servidor (400/500)
```json
{
  "statusCode": 400,
  "message": "Error al generar el PDF de la venta"
}
```

## Testing

Para probar el endpoint con curl:

```bash
curl -X GET \
  'http://localhost:3000/ventas/{ventaId}/pdf' \
  -H 'Authorization: Bearer {tu-token-jwt}' \
  --output venta.pdf
```

O con Postman:
1. Método: GET
2. URL: `http://localhost:3000/ventas/{ventaId}/pdf`
3. Headers: `Authorization: Bearer {token}`
4. En "Send and Download" selecciona la opción de guardar el archivo

---

¡Listo! Ahora puedes descargar PDFs profesionales de tus ventas con solo hacer clic en un botón. 🎉

