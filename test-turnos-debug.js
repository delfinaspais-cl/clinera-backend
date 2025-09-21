const https = require('https');

// Función para hacer petición HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function testTurnosEndpoints() {
  const baseUrl = 'https://clinera-backend-production.up.railway.app';
  const clinicaUrl = 'clinica-sur';
  
  console.log('🧪 Probando endpoints de turnos...\n');
  
  // 1. Probar endpoint de debug sin autenticación
  console.log('1. Probando endpoint de debug sin autenticación:');
  try {
    const debugResponse = await makeRequest(`${baseUrl}/clinica/${clinicaUrl}/turnos-debug?fecha=2025-09-21&limit=100`);
    console.log('Status:', debugResponse.statusCode);
    console.log('Response:', JSON.stringify(debugResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 2. Probar endpoint de test sin autenticación
  console.log('2. Probando endpoint de test sin autenticación:');
  try {
    const testResponse = await makeRequest(`${baseUrl}/clinica/${clinicaUrl}/turnos-test?fecha=2025-09-21&limit=100`);
    console.log('Status:', testResponse.statusCode);
    console.log('Response:', JSON.stringify(testResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 3. Probar endpoint normal con token de prueba
  console.log('3. Probando endpoint normal con token de prueba:');
  try {
    const normalResponse = await makeRequest(`${baseUrl}/clinica/${clinicaUrl}/turnos?fecha=2025-09-21&limit=100`, {
      headers: {
        'Authorization': 'Bearer test_token',
        'Content-Type': 'application/json'
      }
    });
    console.log('Status:', normalResponse.statusCode);
    console.log('Response:', JSON.stringify(normalResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 4. Probar endpoint normal sin token
  console.log('4. Probando endpoint normal sin token:');
  try {
    const noTokenResponse = await makeRequest(`${baseUrl}/clinica/${clinicaUrl}/turnos?fecha=2025-09-21&limit=100`);
    console.log('Status:', noTokenResponse.statusCode);
    console.log('Response:', JSON.stringify(noTokenResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 5. Probar endpoint simple sin filtros
  console.log('5. Probando endpoint simple sin filtros:');
  try {
    const simpleResponse = await makeRequest(`${baseUrl}/clinica/${clinicaUrl}/turnos-simple`);
    console.log('Status:', simpleResponse.statusCode);
    console.log('Response:', JSON.stringify(simpleResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 6. Probar endpoint básico
  console.log('6. Probando endpoint básico:');
  try {
    const basicResponse = await makeRequest(`${baseUrl}/clinica/${clinicaUrl}/test-basic`);
    console.log('Status:', basicResponse.statusCode);
    console.log('Response:', JSON.stringify(basicResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Ejecutar las pruebas
testTurnosEndpoints().catch(console.error);
