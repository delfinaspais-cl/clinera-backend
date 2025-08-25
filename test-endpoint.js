const https = require('https');
const http = require('http');

// URL del backend
const baseUrl = 'https://clinera-backend-develop.up.railway.app';

// Función para hacer requests HTTP/HTTPS
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, { method }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Función para probar endpoints
async function testEndpoints() {
  console.log('🧪 Probando endpoints del backend...\n');
  
  const endpoints = [
    '/api/public/test',
    '/api/public/debug-redirect',
    '/api/public/debug-clinica-cuyo',
    '/api/public/clinica/clinica-cuyo/exists',
    '/api/health',
    '/api/contact/health'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Probando: ${baseUrl}${endpoint}`);
      const result = await makeRequest(`${baseUrl}${endpoint}`);
      console.log(`✅ Status: ${result.status}`);
      console.log(`📄 Data:`, JSON.stringify(result.data, null, 2));
      console.log('---\n');
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('---\n');
    }
  }
}

// Ejecutar las pruebas
testEndpoints().catch(console.error);
