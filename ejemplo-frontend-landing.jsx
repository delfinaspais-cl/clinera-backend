// ============================================
// EJEMPLO 1: Landing Page Pública
// ============================================

import { useEffect, useState } from 'react';

function LandingPage({ clinicaUrl }) {
  const [clinica, setClinica] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClinicaData();
  }, []);

  const fetchClinicaData = async () => {
    try {
      const response = await fetch(
        `https://clinera-backend-production.up.railway.app/public/clinica/${clinicaUrl}/landing`
      );
      const data = await response.json();
      
      if (data.success) {
        setClinica(data.clinica);
      }
    } catch (error) {
      console.error('Error cargando clínica:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (!clinica) return <div>Clínica no encontrada</div>;

  return (
    <div className="landing-page">
      {/* HERO SECTION - USA TITULO Y SUBTITULO */}
      <section 
        className="hero"
        style={{
          background: `linear-gradient(135deg, ${clinica.colorPrimario}, ${clinica.colorSecundario})`,
          padding: '80px 20px',
          textAlign: 'center',
          color: 'white'
        }}
      >
        {clinica.logo && (
          <img 
            src={clinica.logo} 
            alt={clinica.nombre} 
            style={{ maxWidth: '200px', marginBottom: '30px' }}
          />
        )}
        
        {/* USA EL CAMPO TITULO (o nombre como fallback) */}
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px' }}>
          {clinica.titulo || clinica.nombre}
        </h1>
        
        {/* USA EL CAMPO SUBTITULO (o descripción como fallback) */}
        {(clinica.subtitulo || clinica.descripcion) && (
          <p style={{ fontSize: '24px', opacity: 0.9 }}>
            {clinica.subtitulo || clinica.descripcion}
          </p>
        )}
        
        <button 
          className="cta-button"
          style={{
            background: 'white',
            color: clinica.colorPrimario,
            padding: '15px 40px',
            fontSize: '18px',
            border: 'none',
            borderRadius: '8px',
            marginTop: '30px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Agendar Cita Ahora
        </button>
      </section>

      {/* SERVICIOS */}
      <section style={{ padding: '60px 20px', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '40px' }}>
            Nuestros Servicios
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {clinica.especialidades.map(esp => (
              <div 
                key={esp.id}
                style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}
              >
                <h3>{esp.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS - USA comentariosHTML */}
      {clinica.comentariosHTML && (
        <section style={{ padding: '60px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '40px' }}>
              Lo que dicen nuestros pacientes
            </h2>
            
            {/* RENDERIZA EL HTML DIRECTAMENTE */}
            <div 
              className="testimonios-container"
              dangerouslySetInnerHTML={{ __html: clinica.comentariosHTML }}
            />
          </div>
        </section>
      )}

      {/* CONTACTO */}
      <section style={{ padding: '60px 20px', background: '#f9fafb' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '30px' }}>Contáctanos</h2>
          {clinica.telefono && <p>📞 {clinica.telefono}</p>}
          {clinica.email && <p>✉️ {clinica.email}</p>}
          {clinica.direccion && <p>📍 {clinica.direccion}</p>}
        </div>
      </section>
    </div>
  );
}

export default LandingPage;


// ============================================
// EJEMPLO 2: Panel de Edición (Admin)
// ============================================

import { useState } from 'react';

function ConfiguracionLandingPanel({ clinica, token, clinicaUrl }) {
  const [form, setForm] = useState({
    titulo: clinica.titulo || '',
    subtitulo: clinica.subtitulo || '',
    comentariosHTML: clinica.comentariosHTML || ''
  });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(
        `https://clinera-backend-production.up.railway.app/clinica/${clinicaUrl}/configuracion`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            titulo: form.titulo,
            subtitulo: form.subtitulo,
            comentariosHTML: form.comentariosHTML
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('✅ Landing actualizada exitosamente');
      } else {
        alert('❌ Error al actualizar');
      }
    } catch (error) {
      alert('❌ Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
      <h1>Configuración de Landing Page</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* FORMULARIO */}
        <div>
          <h2>Editar Contenido</h2>
          
          {/* CAMPO TITULO */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
              Título Principal
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({...form, titulo: e.target.value})}
              placeholder={clinica.nombre}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              Si está vacío, se mostrará el nombre de la clínica
            </small>
          </div>

          {/* CAMPO SUBTITULO */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
              Subtítulo
            </label>
            <input
              type="text"
              value={form.subtitulo}
              onChange={(e) => setForm({...form, subtitulo: e.target.value})}
              placeholder="Ej: Tu salud es nuestra prioridad"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              Frase corta o tagline
            </small>
          </div>

          {/* CAMPO COMENTARIOS HTML */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
              Testimonios (HTML)
            </label>
            <textarea
              value={form.comentariosHTML}
              onChange={(e) => setForm({...form, comentariosHTML: e.target.value})}
              placeholder="<div>Tu HTML aquí...</div>"
              rows={10}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              Puedes usar HTML para dar formato a los testimonios
            </small>
          </div>

          {/* BOTONES */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                background: '#3B82F6',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            
            <button
              onClick={() => setPreview(!preview)}
              style={{
                background: '#6B7280',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {preview ? 'Ocultar Preview' : 'Ver Preview'}
            </button>
          </div>
        </div>

        {/* PREVIEW */}
        {preview && (
          <div style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '20px' }}>
            <h2>Vista Previa</h2>
            
            <div style={{ 
              background: `linear-gradient(135deg, ${clinica.colorPrimario}, ${clinica.colorSecundario})`,
              padding: '40px',
              borderRadius: '8px',
              color: 'white',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>
                {form.titulo || clinica.nombre}
              </h1>
              {form.subtitulo && (
                <p style={{ fontSize: '18px', opacity: 0.9 }}>
                  {form.subtitulo}
                </p>
              )}
            </div>

            {form.comentariosHTML && (
              <div>
                <h3>Testimonios:</h3>
                <div 
                  style={{ 
                    border: '1px solid #ddd', 
                    padding: '20px', 
                    borderRadius: '6px',
                    background: '#f9fafb'
                  }}
                  dangerouslySetInnerHTML={{ __html: form.comentariosHTML }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConfiguracionLandingPanel;


// ============================================
// EJEMPLO 3: HTML de Ejemplo para Testimonios
// ============================================

const EJEMPLOS_COMENTARIOS_HTML = {
  
  // EJEMPLO 1: Grid Simple
  simple: `
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
  <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <p style="font-style: italic; margin-bottom: 15px;">"Excelente atención, muy profesionales"</p>
    <strong>⭐⭐⭐⭐⭐</strong>
    <p style="margin-top: 10px; color: #666;">- María González</p>
  </div>
  
  <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <p style="font-style: italic; margin-bottom: 15px;">"Los mejores en su área"</p>
    <strong>⭐⭐⭐⭐⭐</strong>
    <p style="margin-top: 10px; color: #666;">- Juan Pérez</p>
  </div>
  
  <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <p style="font-style: italic; margin-bottom: 15px;">"Instalaciones modernas"</p>
    <strong>⭐⭐⭐⭐⭐</strong>
    <p style="margin-top: 10px; color: #666;">- Ana Martínez</p>
  </div>
</div>
  `,

  // EJEMPLO 2: Estilo Card Elegante
  elegante: `
<div style="max-width: 1000px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 16px; color: white; margin-bottom: 30px;">
    <h3 style="font-size: 28px; margin-bottom: 20px; text-align: center;">💬 Testimonios de Nuestros Pacientes</h3>
  </div>
  
  <div style="display: grid; gap: 20px;">
    <div style="background: #f9fafb; padding: 30px; border-left: 4px solid #667eea; border-radius: 8px;">
      <p style="font-size: 18px; line-height: 1.6; margin-bottom: 15px;">"La mejor clínica de la zona. Atención personalizada y profesionales altamente capacitados. Totalmente recomendados."</p>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 40px; height: 40px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">M</div>
        <div>
          <strong>María González</strong>
          <p style="color: #666; font-size: 14px; margin: 0;">Paciente desde 2020</p>
        </div>
      </div>
    </div>
    
    <div style="background: #f9fafb; padding: 30px; border-left: 4px solid #764ba2; border-radius: 8px;">
      <p style="font-size: 18px; line-height: 1.6; margin-bottom: 15px;">"Excelente trato y resultados increíbles. Me siento muy cuidada cada vez que vengo."</p>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 40px; height: 40px; background: #764ba2; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">A</div>
        <div>
          <strong>Ana Martínez</strong>
          <p style="color: #666; font-size: 14px; margin: 0;">Paciente desde 2019</p>
        </div>
      </div>
    </div>
  </div>
</div>
  `,

  // EJEMPLO 3: Minimalista
  minimalista: `
<div style="text-align: center; max-width: 800px; margin: 0 auto;">
  <div style="margin-bottom: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
    <p style="font-size: 20px; font-style: italic;">"Excelente servicio, muy recomendados"</p>
    <p style="margin-top: 10px; font-weight: bold;">⭐⭐⭐⭐⭐ María G.</p>
  </div>
  
  <div style="margin-bottom: 30px; padding: 20px; background: #dbeafe; border-radius: 8px;">
    <p style="font-size: 20px; font-style: italic;">"Profesionales de primera"</p>
    <p style="margin-top: 10px; font-weight: bold;">⭐⭐⭐⭐⭐ Juan P.</p>
  </div>
  
  <div style="padding: 20px; background: #dcfce7; border-radius: 8px;">
    <p style="font-size: 20px; font-style: italic;">"Los mejores en su área"</p>
    <p style="margin-top: 10px; font-weight: bold;">⭐⭐⭐⭐⭐ Ana M.</p>
  </div>
</div>
  `
};


// ============================================
// EJEMPLO 4: Componente de Editor con Preview
// ============================================

function EditorConPreview() {
  const [form, setForm] = useState({
    titulo: '',
    subtitulo: '',
    comentariosHTML: ''
  });
  const [selectedExample, setSelectedExample] = useState('');

  const cargarEjemplo = (tipo) => {
    setForm({
      ...form,
      comentariosHTML: EJEMPLOS_COMENTARIOS_HTML[tipo]
    });
    setSelectedExample(tipo);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2>Plantillas de Ejemplo</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button onClick={() => cargarEjemplo('simple')}>
            📋 Simple
          </button>
          <button onClick={() => cargarEjemplo('elegante')}>
            ✨ Elegante
          </button>
          <button onClick={() => cargarEjemplo('minimalista')}>
            🎨 Minimalista
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* EDITOR */}
        <div>
          <h3>Editor</h3>
          
          <label>Título</label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({...form, titulo: e.target.value})}
            placeholder="Bienvenido a nuestra clínica"
            style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
          />

          <label>Subtítulo</label>
          <input
            type="text"
            value={form.subtitulo}
            onChange={(e) => setForm({...form, subtitulo: e.target.value})}
            placeholder="Tu salud es nuestra prioridad"
            style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
          />

          <label>HTML de Testimonios</label>
          <textarea
            value={form.comentariosHTML}
            onChange={(e) => setForm({...form, comentariosHTML: e.target.value})}
            rows={15}
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontFamily: 'monospace',
              fontSize: '13px'
            }}
          />
        </div>

        {/* PREVIEW */}
        <div>
          <h3>Vista Previa</h3>
          <div style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '20px', background: 'white' }}>
            {/* Preview del Título */}
            <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>
              {form.titulo || 'Título de ejemplo'}
            </h1>
            
            {/* Preview del Subtítulo */}
            {form.subtitulo && (
              <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
                {form.subtitulo}
              </p>
            )}

            {/* Preview del HTML */}
            {form.comentariosHTML && (
              <div>
                <hr style={{ margin: '20px 0' }} />
                <h4>Testimonios:</h4>
                <div dangerouslySetInnerHTML={{ __html: form.comentariosHTML }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================
// EJEMPLO 5: Fetching y Guardado
// ============================================

// Función para obtener datos
const fetchClinica = async (clinicaUrl) => {
  const response = await fetch(
    `https://clinera-backend-production.up.railway.app/public/clinica/${clinicaUrl}/landing`
  );
  const data = await response.json();
  return data.clinica;
};

// Función para guardar cambios
const guardarCambios = async (clinicaUrl, token, datos) => {
  const response = await fetch(
    `https://clinera-backend-production.up.railway.app/clinica/${clinicaUrl}/configuracion`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        titulo: datos.titulo,
        subtitulo: datos.subtitulo,
        comentariosHTML: datos.comentariosHTML
      })
    }
  );
  
  const result = await response.json();
  return result;
};

// Uso:
const clinica = await fetchClinica('clinica-costa-m');

await guardarCambios('clinica-costa-m', token, {
  titulo: 'Bienvenido a Clinica Costa M',
  subtitulo: 'Más de 20 años cuidando tu salud',
  comentariosHTML: EJEMPLOS_COMENTARIOS_HTML.simple
});

