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

// Probar endpoints sin autenticación
async function testEndpointsNoAuth() {
  console.log('🧪 Probando endpoints sin autenticación...\n');
  
  const endpoints = [
    '/api/clinica/clinica-cuyo/turnos',
    '/api/clinica/clinica-cuyo/notificaciones',
    '/api/clinica/clinica-cuyo/profesionales',
    '/api/clinica/clinica-cuyo/pacientes',
    '/api/clinica/clinica-cuyo'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Probando: ${baseUrl}${endpoint}`);
      
      const result = await makeGetRequest(`${baseUrl}${endpoint}`);
      console.log(`✅ Status: ${result.status}`);
      
      if (result.status === 200) {
        console.log(`✅ ÉXITO: Endpoint funciona sin autenticación`);
      } else if (result.status === 401) {
        console.log(`❌ ERROR: Endpoint aún requiere autenticación`);
      } else {
        console.log(`⚠️  Status inesperado: ${result.status}`);
      }
      
      console.log('---');
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('---');
    }
  }
}

testEndpointsNoAuth().catch(console.error);
