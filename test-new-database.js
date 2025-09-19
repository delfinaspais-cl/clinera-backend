const axios = require('axios');

const BASE_URL = 'https://clinera-backend-production.up.railway.app';

async function testUserRegistration() {
  console.log('🧪 Probando registro de usuario con nueva base de datos...\n');
  
  const testUser = {
    email: 'test.nuevo@ejemplo.com',
    username: 'testusuario123',
    name: 'Usuario de Prueba',
    password: '123456'
  };

  try {
    console.log('📤 Enviando datos:', testUser);
    
    const response = await axios.post(`${BASE_URL}/users/register`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registro exitoso!');
    console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
    
    // Probar login con username
    console.log('\n🔐 Probando login con username...');
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
      identifier: testUser.username,
      password: testUser.password
    });
    
    console.log('✅ Login exitoso!');
    console.log('📊 Token recibido:', loginResponse.data.token ? 'Sí' : 'No');
    console.log('👤 Usuario:', loginResponse.data.user);
    
  } catch (error) {
    console.error('❌ Error en la prueba:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Ejecutar la prueba
testUserRegistration();
