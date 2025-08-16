// Script para debuggear el sistema de emails
const fetch = require('node-fetch');

const API_BASE_URL = 'https://clinera-backend-develop.up.railway.app';

async function testEmailSystem() {
  console.log('🧪 Probando sistema de emails...\n');
  console.log(`📍 URL del backend: ${API_BASE_URL}\n`);

  // Test con datos que deberían enviar emails
  console.log('1️⃣ Enviando consulta de prueba...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: 'Test Email Debug',
        email: 'delfina.spais@gmail.com', // Email donde deberías recibir confirmación
        telefono: '+54 11 1234-5678',
        empresa: 'Clínica de Prueba',
        tipoConsulta: 'demo',
        plan: 'profesional',
        mensaje: 'Esta es una prueba del sistema de emails. Si recibes este mensaje, el sistema funciona correctamente.'
      })
    });

    const result = await response.json();
    console.log('✅ Respuesta del servidor:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n📧 Emails que deberían haberse enviado:');
      console.log('   - Confirmación a: delfina.spais@gmail.com');
      console.log('   - Notificación a: delfina.spais@oacg.cl');
      console.log('\n⏰ Los emails pueden tardar unos minutos en llegar...');
    } else {
      console.log('❌ Error en el servidor:', result.message);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// Ejecutar la prueba
testEmailSystem().catch(console.error);
