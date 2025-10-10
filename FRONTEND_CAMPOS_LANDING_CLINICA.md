# Guía Frontend: Nuevos Campos de Landing de Clínica

## 📋 Campos Agregados

Se agregaron 3 campos opcionales a la tabla `Clinica`:

- **`titulo`**: Título principal para la landing page
- **`subtitulo`**: Subtítulo/descripción breve
- **`comentariosHTML`**: HTML para testimonios/comentarios de clientes

---

## 📖 Obtener Datos de la Landing

### Endpoint: GET /public/clinica/:clinicaUrl/landing

**URL:**
```
GET https://clinera-backend-production.up.railway.app/public/clinica/clinica-costa-m/landing
```

**Respuesta (incluye los nuevos campos):**
```json
{
  "success": true,
  "clinica": {
    "id": "cmg4jpe4q0001ny0fbduop6xl",
    "nombre": "Clinica Costa M",
    "url": "clinica-costa-m",
    "logo": "https://...",
    "colorPrimario": "#3B82F6",
    "colorSecundario": "#1E40AF",
    "descripcion": "Clínica especializada...",
    "titulo": "Bienvenido a Clinica Costa M",
    "subtitulo": "Tu salud es nuestra prioridad",
    "comentariosHTML": "<div>...</div>",
    "direccion": "Av. Principal 123",
    "telefono": "+54 9 11...",
    "email": "info@clinica.com",
    "defaultLanguage": "es",
    "currencyCode": "USD",
    "horarios": [...],
    "especialidades": [...],
    "rating": 4.5
  }
}
```

**Ejemplo en React/Next.js:**
```javascript
const fetchClinicaLanding = async (clinicaUrl) => {
  const response = await fetch(
    `https://clinera-backend-production.up.railway.app/public/clinica/${clinicaUrl}/landing`
  );
  const data = await response.json();
  
  return data.clinica;
};

// Uso:
const clinica = await fetchClinicaLanding('clinica-costa-m');

// Mostrar en la UI:
<h1>{clinica.titulo || clinica.nombre}</h1>
<p>{clinica.subtitulo}</p>
<div dangerouslySetInnerHTML={{ __html: clinica.comentariosHTML }} />
```

---

## ✏️ Actualizar/Editar Campos desde el Panel

### Endpoint: PATCH /clinica/:clinicaUrl/configuracion

**URL:**
```
PATCH https://clinera-backend-production.up.railway.app/clinica/clinica-costa-m/configuracion
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body (todos los campos son opcionales):**
```json
{
  "titulo": "Bienvenido a Clinica Costa M",
  "subtitulo": "Expertos en tu bienestar desde 1995",
  "comentariosHTML": "<div class='testimonios'><p>Excelente atención...</p></div>"
}
```

**Respuesta:**
```json
{
  "success": true,
  "clinica": {
    "id": "cmg4jpe4q0001ny0fbduop6xl",
    "name": "Clinica Costa M",
    "titulo": "Bienvenido a Clinica Costa M",
    "subtitulo": "Expertos en tu bienestar desde 1995",
    "comentariosHTML": "<div class='testimonios'>...</div>",
    ...
  }
}
```

**Ejemplo en React:**
```javascript
const actualizarLanding = async (titulo, subtitulo, comentariosHTML) => {
  const response = await fetch(
    `https://clinera-backend-production.up.railway.app/clinica/${clinicaUrl}/configuracion`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        titulo,
        subtitulo,
        comentariosHTML
      })
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    toast.success('Landing actualizada exitosamente');
  }
  
  return data.clinica;
};
```

---

## 🎨 Uso de los Campos en el Frontend

### 1. **Título** (`titulo`)

**Cuándo usarlo:**
- Como título principal de la landing page
- Fallback al nombre de la clínica si no está definido

```jsx
<h1 className="landing-title">
  {clinica.titulo || clinica.nombre}
</h1>
```

**Ejemplos:**
- "Bienvenido a Clinica Costa M"
- "Tu Salud es Nuestra Prioridad"
- "Cuidamos de Ti y Tu Familia"

---

### 2. **Subtítulo** (`subtitulo`)

**Cuándo usarlo:**
- Como tagline o descripción breve
- Debajo del título principal

```jsx
<p className="landing-subtitle">
  {clinica.subtitulo || clinica.descripcion}
</p>
```

**Ejemplos:**
- "Más de 20 años cuidando tu salud"
- "Profesionales certificados a tu servicio"
- "Tecnología de punta en medicina estética"

---

### 3. **Comentarios HTML** (`comentariosHTML`)

**Cuándo usarlo:**
- Sección de testimonios
- Reseñas de clientes
- Comentarios destacados

```jsx
{clinica.comentariosHTML && (
  <section className="testimonios">
    <div dangerouslySetInnerHTML={{ __html: clinica.comentariosHTML }} />
  </section>
)}
```

**Ejemplo de HTML que pueden guardar:**
```html
<div class="testimonios-grid">
  <div class="testimonio">
    <p>"Excelente atención, muy profesionales"</p>
    <strong>- María González</strong>
  </div>
  <div class="testimonio">
    <p>"Los mejores en su área, altamente recomendados"</p>
    <strong>- Juan Pérez</strong>
  </div>
  <div class="testimonio">
    <p>"Instalaciones modernas y personal capacitado"</p>
    <strong>- Ana Martínez</strong>
  </div>
</div>
```

---

## 🛠️ Componente de Formulario para el Panel Admin

### Ejemplo en React:

```jsx
import { useState } from 'react';

function ConfiguracionLandingForm({ clinica, onUpdate }) {
  const [titulo, setTitulo] = useState(clinica.titulo || '');
  const [subtitulo, setSubtitulo] = useState(clinica.subtitulo || '');
  const [comentariosHTML, setComentariosHTML] = useState(clinica.comentariosHTML || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `https://clinera-backend-production.up.railway.app/clinica/${clinica.url}/configuracion`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            titulo,
            subtitulo,
            comentariosHTML
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Landing actualizada exitosamente');
        onUpdate(data.clinica);
      } else {
        toast.error('Error al actualizar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Título Principal
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej: Bienvenido a nuestra clínica"
          className="w-full px-3 py-2 border rounded"
        />
        <p className="text-xs text-gray-500 mt-1">
          Título principal de tu landing page
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Subtítulo
        </label>
        <input
          type="text"
          value={subtitulo}
          onChange={(e) => setSubtitulo(e.target.value)}
          placeholder="Ej: Tu salud es nuestra prioridad"
          className="w-full px-3 py-2 border rounded"
        />
        <p className="text-xs text-gray-500 mt-1">
          Descripción breve o tagline
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Testimonios/Comentarios (HTML)
        </label>
        <textarea
          value={comentariosHTML}
          onChange={(e) => setComentariosHTML(e.target.value)}
          placeholder="<div>HTML de testimonios...</div>"
          rows={8}
          className="w-full px-3 py-2 border rounded font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          HTML personalizado para mostrar comentarios de clientes
        </p>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  );
}
```

---

## 🎨 Ejemplo de Landing Page con los Nuevos Campos

```jsx
function LandingPage({ clinicaUrl }) {
  const [clinica, setClinica] = useState(null);

  useEffect(() => {
    fetchClinicaLanding(clinicaUrl).then(setClinica);
  }, [clinicaUrl]);

  if (!clinica) return <div>Cargando...</div>;

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero" style={{
        background: `linear-gradient(135deg, ${clinica.colorPrimario}, ${clinica.colorSecundario})`
      }}>
        <div className="container">
          {clinica.logo && <img src={clinica.logo} alt={clinica.nombre} />}
          
          <h1 className="text-5xl font-bold text-white">
            {clinica.titulo || clinica.nombre}
          </h1>
          
          {clinica.subtitulo && (
            <p className="text-xl text-white/90 mt-4">
              {clinica.subtitulo}
            </p>
          )}
          
          <button className="cta-button mt-8">
            Agendar Cita
          </button>
        </div>
      </section>

      {/* Servicios */}
      <section className="servicios">
        <h2>Nuestros Servicios</h2>
        <div className="grid">
          {clinica.especialidades.map(esp => (
            <div key={esp.id} className="servicio-card">
              {esp.name}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonios - NUEVO */}
      {clinica.comentariosHTML && (
        <section className="testimonios">
          <h2>Lo que dicen nuestros pacientes</h2>
          <div 
            className="testimonios-container"
            dangerouslySetInnerHTML={{ __html: clinica.comentariosHTML }}
          />
        </section>
      )}

      {/* Horarios */}
      <section className="horarios">
        <h2>Horarios de Atención</h2>
        {clinica.horarios.map(h => (
          <div key={h.id}>
            <strong>{h.day}:</strong> {h.openTime} - {h.closeTime}
          </div>
        ))}
      </section>
    </div>
  );
}
```

---

## 📝 Editor WYSIWYG Recomendado para comentariosHTML

Para que las secretarias puedan editar fácilmente el HTML, puedes usar:

### Opción 1: TinyMCE (Recomendado)
```jsx
import { Editor } from '@tinymce/tinymce-react';

<Editor
  apiKey="tu-api-key"
  value={comentariosHTML}
  init={{
    height: 300,
    menubar: false,
    plugins: ['lists', 'link'],
    toolbar: 'bold italic | alignleft aligncenter | bullist numlist'
  }}
  onEditorChange={(content) => setComentariosHTML(content)}
/>
```

### Opción 2: React-Quill (Más simple)
```jsx
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

<ReactQuill 
  theme="snow"
  value={comentariosHTML}
  onChange={setComentariosHTML}
  modules={{
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link']
    ]
  }}
/>
```

### Opción 3: Textarea Simple (Básico)
```jsx
<textarea
  value={comentariosHTML}
  onChange={(e) => setComentariosHTML(e.target.value)}
  placeholder="Escribe HTML aquí..."
  className="font-mono"
/>
```

---

## 🔧 Actualizar Campos

### Endpoint: PATCH /clinica/:clinicaUrl/configuracion

**Actualizar solo el título:**
```javascript
await fetch(`${API_URL}/clinica/${clinicaUrl}/configuracion`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    titulo: 'Nuevo Título'
  })
});
```

**Actualizar todos los campos de landing:**
```javascript
await fetch(`${API_URL}/clinica/${clinicaUrl}/configuracion`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    titulo: 'Bienvenido a Nuestra Clínica',
    subtitulo: 'Cuidamos tu salud desde 1990',
    comentariosHTML: `
      <div class="grid grid-cols-3 gap-4">
        <div class="testimonio">
          <p>"Excelente servicio"</p>
          <strong>- María G.</strong>
        </div>
        <div class="testimonio">
          <p>"Muy profesionales"</p>
          <strong>- Juan P.</strong>
        </div>
        <div class="testimonio">
          <p>"Altamente recomendados"</p>
          <strong>- Ana M.</strong>
        </div>
      </div>
    `
  })
});
```

**Actualizar junto con otros campos:**
```javascript
await fetch(`${API_URL}/clinica/${clinicaUrl}/configuracion`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // Campos de configuración existentes
    nombre: 'Clinica Costa M',
    colorPrimario: '#3B82F6',
    colorSecundario: '#1E40AF',
    descripcion: 'Clínica especializada...',
    
    // Nuevos campos de landing
    titulo: 'Bienvenido',
    subtitulo: 'Tu salud es nuestra prioridad',
    comentariosHTML: '<div>...</div>'
  })
});
```

---

## 🎯 Casos de Uso Comunes

### 1. **Landing Simple (Solo Título y Subtítulo)**
```jsx
<div className="hero">
  <h1>{clinica.titulo || 'Bienvenido'}</h1>
  <p>{clinica.subtitulo || 'Agenda tu cita ahora'}</p>
</div>
```

### 2. **Landing con Testimonios**
```jsx
<div className="landing">
  <section className="hero">
    <h1>{clinica.titulo}</h1>
    <p>{clinica.subtitulo}</p>
  </section>
  
  {clinica.comentariosHTML && (
    <section className="testimonios">
      <h2>Testimonios</h2>
      <div dangerouslySetInnerHTML={{ __html: clinica.comentariosHTML }} />
    </section>
  )}
</div>
```

### 3. **Editor en el Panel de Admin**
```jsx
function LandingEditor({ clinica }) {
  const [form, setForm] = useState({
    titulo: clinica.titulo || '',
    subtitulo: clinica.subtitulo || '',
    comentariosHTML: clinica.comentariosHTML || ''
  });

  const handleSave = async () => {
    await actualizarLanding(
      form.titulo, 
      form.subtitulo, 
      form.comentariosHTML
    );
  };

  return (
    <div className="editor-panel">
      <h2>Configurar Landing Page</h2>
      
      <label>Título Principal</label>
      <input
        value={form.titulo}
        onChange={(e) => setForm({...form, titulo: e.target.value})}
        placeholder={clinica.nombre}
      />
      
      <label>Subtítulo</label>
      <input
        value={form.subtitulo}
        onChange={(e) => setForm({...form, subtitulo: e.target.value})}
        placeholder="Breve descripción..."
      />
      
      <label>Testimonios (HTML)</label>
      <ReactQuill 
        value={form.comentariosHTML}
        onChange={(value) => setForm({...form, comentariosHTML: value})}
      />
      
      <button onClick={handleSave}>
        Guardar Cambios
      </button>
    </div>
  );
}
```

---

## ⚠️ Consideraciones de Seguridad

### Sanitizar HTML

Si permites que usuarios escriban HTML, **sanitízalo** antes de mostrarlo:

```javascript
import DOMPurify from 'dompurify';

// Al mostrar:
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(clinica.comentariosHTML) 
}} />
```

### Validación en el Editor

```javascript
// Limitar tags permitidos
const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['div', 'p', 'strong', 'em', 'br', 'span', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['class', 'style']
  });
};
```

---

## 📊 Estructura Recomendada para comentariosHTML

```html
<!-- Opción 1: Grid de testimonios -->
<div class="testimonios-grid">
  <div class="testimonio-card">
    <div class="stars">⭐⭐⭐⭐⭐</div>
    <p>"Excelente atención y profesionalismo"</p>
    <div class="autor">
      <strong>María González</strong>
      <span>Paciente desde 2020</span>
    </div>
  </div>
  <!-- Más testimonios... -->
</div>

<!-- Opción 2: Carrusel de comentarios -->
<div class="testimonios-carousel">
  <div class="testimonio">
    <blockquote>
      "Los mejores profesionales de la zona"
    </blockquote>
    <cite>- Juan Pérez</cite>
  </div>
</div>

<!-- Opción 3: Lista simple -->
<ul class="testimonios-lista">
  <li>
    <p>"Muy recomendados" - Ana M.</p>
  </li>
  <li>
    <p>"Excelente servicio" - Carlos R.</p>
  </li>
</ul>
```

---

## ✅ Checklist de Implementación

**Backend:**
- [x] Campos agregados al schema de Prisma
- [x] DTOs actualizados (todos opcionales)
- [x] Endpoint de landing retorna nuevos campos
- [x] Endpoint de actualización acepta nuevos campos
- [x] Migración SQL creada
- [x] Prisma Client generado

**Frontend (por implementar):**
- [ ] Mostrar `titulo` en landing page
- [ ] Mostrar `subtitulo` en landing page
- [ ] Mostrar `comentariosHTML` en sección de testimonios
- [ ] Crear formulario de edición en panel admin
- [ ] Implementar editor HTML (TinyMCE o React-Quill)
- [ ] Sanitizar HTML antes de mostrar
- [ ] Agregar preview en tiempo real
- [ ] Validación de campos

---

## 🚀 Valores por Defecto

Si los campos están vacíos, usa fallbacks:

```javascript
const titulo = clinica.titulo || clinica.nombre;
const subtitulo = clinica.subtitulo || clinica.descripcion || 'Agenda tu cita hoy';
const mostrarTestimonios = !!clinica.comentariosHTML;
```

---

## 📱 Responsive Design

```css
/* Mobile-first para testimonios */
.testimonios-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .testimonios-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .testimonios-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

¿Necesitas ayuda con algún componente específico del frontend o ejemplos adicionales?

