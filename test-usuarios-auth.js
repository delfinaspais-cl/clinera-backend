const axios = require('axios');

const BASE_URL = 'https://clinera-backend-production.up.railway.app';
const CLINICA_URL = 'clinica-sur';

async function testUsuariosEndpoint() {
  console.log('🧪 Probando endpoint de usuarios...');
  
  try {
    // 1. Probar endpoint sin autenticación (debería fallar)
    console.log('\n1. Probando sin autenticación...');
    try {
      const response = await axios.get(`${BASE_URL}/clinica/${CLINICA_URL}/usuarios`);
      console.log('❌ ERROR: Debería haber fallado sin autenticación');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('✅ Correcto: Sin autenticación falla como esperado');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
    }

    // 2. Probar con token de prueba
    console.log('\n2. Probando con token de prueba...');
    try {
      const response = await axios.get(`${BASE_URL}/clinica/${CLINICA_URL}/usuarios`, {
        headers: {
          'Authorization': 'Bearer test_token'
        }
      });
      console.log('✅ Token de prueba funciona');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ Error con token de prueba');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
    }

    // 3. Probar endpoint de test auth
    console.log('\n3. Probando endpoint de test auth...');
    try {
      const response = await axios.get(`${BASE_URL}/clinica/test-auth/${CLINICA_URL}`, {
        headers: {
          'Authorization': 'Bearer test_token'
        }
      });
      console.log('✅ Test auth funciona');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ Error en test auth');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
    }

    // 4. Probar endpoint sin autenticación (test-usuarios)
    console.log('\n4. Probando endpoint test-usuarios (sin auth)...');
    try {
      const response = await axios.get(`${BASE_URL}/clinica/test-usuarios/${CLINICA_URL}`);
      console.log('✅ Test usuarios sin auth funciona');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ Error en test usuarios');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
    }

    // 5. Probar endpoint temporal (temp-usuarios)
    console.log('\n5. Probando endpoint temp-usuarios (sin auth)...');
    try {
      const response = await axios.get(`${BASE_URL}/clinica/temp-usuarios/${CLINICA_URL}`);
      console.log('✅ Temp usuarios sin auth funciona');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ Error en temp usuarios');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
    }

    // 6. Probar endpoint debug (debug-usuarios)
    console.log('\n6. Probando endpoint debug-usuarios (sin auth)...');
    try {
      const response = await axios.get(`${BASE_URL}/clinica/debug-usuarios/${CLINICA_URL}`);
      console.log('✅ Debug usuarios funciona');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ Error en debug usuarios');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar las pruebas
testUsuariosEndpoint();
