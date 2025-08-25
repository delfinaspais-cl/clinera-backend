const https = require('https');

// URL del backend
const baseUrl = 'https://clinera-backend-develop.up.railway.app';

// Función simple para hacer requests
function makeRequest(url) {
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
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Probar endpoints básicos
async function testBasicEndpoints() {
  console.log('🧪 Probando endpoints básicos...\n');
  
  const endpoints = [
    '/api/public/test',
    '/api/public/clinica/clinica-cuyo/exists',
    '/api/health'
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

testBasicEndpoints().catch(console.error);
