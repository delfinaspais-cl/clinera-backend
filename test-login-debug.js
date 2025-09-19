const axios = require('axios');

const BASE_URL = 'https://clinera-backend-production.up.railway.app';

async function testLogin() {
  console.log('🔐 Probando login con email...\n');
  
  try {
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
      identifier: 'test.nuevo@ejemplo.com', // Usar email
      password: '123456'
    });
    
    console.log('✅ Login con email exitoso!');
    console.log('📊 Token recibido:', loginResponse.data.token ? 'Sí' : 'No');
    console.log('👤 Usuario:', loginResponse.data.user);
    
  } catch (error) {
    console.error('❌ Error en login con email:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }

  console.log('\n🔐 Probando login con username...\n');
  
  try {
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
      identifier: 'testusuario123', // Usar username
      password: '123456'
    });
    
    console.log('✅ Login con username exitoso!');
    console.log('📊 Token recibido:', loginResponse.data.token ? 'Sí' : 'No');
    console.log('👤 Usuario:', loginResponse.data.user);
    
  } catch (error) {
    console.error('❌ Error en login con username:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Ejecutar la prueba
testLogin();
