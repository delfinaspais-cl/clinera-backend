const axios = require('axios');

const BASE_URL = 'https://clinera-backend-production.up.railway.app';

async function testServerHealth() {
  console.log('🏥 Verificando salud del servidor...\n');
  
  try {
    // Probar endpoint básico
    console.log('📡 Probando endpoint raíz...');
    const rootResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Servidor respondiendo:', rootResponse.status);
    
    // Probar endpoint de test
    console.log('\n🧪 Probando endpoint de test...');
    const testResponse = await axios.post(`${BASE_URL}/users/test`, {
      message: 'Test desde script'
    });
    console.log('✅ Endpoint de test funcionando:', testResponse.data);
    
  } catch (error) {
    console.error('❌ Error en la verificación:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔴 Servidor no disponible - aún desplegando...');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Ejecutar la verificación
testServerHealth();
