const https = require('https');

// URL del backend
const baseUrl = 'https://clinera-backend-develop.up.railway.app';

// Función para hacer GET requests
function makeGetRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
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

// Probar endpoint de turnos con fecha
async function testTurnosFecha() {
  console.log('🧪 Probando endpoint de turnos con fecha...\n');
  
  const fecha = '2025-08-25';
  const url = `${baseUrl}/api/clinica/clinica-cuyo/turnos?fecha=${fecha}`;
  
  try {
    console.log(`📡 Probando: ${url}`);
    
    const result = await makeGetRequest(url);
    console.log(`✅ Status: ${result.status}`);
    console.log(`📄 Response:`, JSON.stringify(result.data, null, 2));
    
    if (result.status === 400) {
      console.log(`❌ ERROR 400: El endpoint está devolviendo Bad Request`);
      console.log(`🔍 Posibles causas:`);
      console.log(`   - Formato de fecha inválido`);
      console.log(`   - Validación en el backend`);
      console.log(`   - Problema con el parámetro fecha`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testTurnosFecha().catch(console.error);
