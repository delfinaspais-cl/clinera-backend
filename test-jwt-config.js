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

// Probar configuración JWT
async function testJwtConfig() {
  console.log('🔐 Probando configuración JWT...\n');
  
  try {
    console.log(`📡 Probando: ${baseUrl}/api/auth/jwt-config`);
    
    const result = await makeGetRequest(`${baseUrl}/api/auth/jwt-config`);
    console.log(`✅ Status: ${result.status}`);
    console.log(`📄 Response:`, JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testJwtConfig().catch(console.error);
