const https = require('https');

// URL del backend
const baseUrl = 'https://clinera-backend-develop.up.railway.app';

// Función para hacer POST requests
function makePostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Probar endpoint de login de clínica
async function testClinicaLogin() {
  console.log('🔐 Probando endpoint de login de clínica...\n');
  
  const loginData = {
    clinicaUrl: 'clinica-cuyo',
    username: 'admin@clinera.io',
    password: '123456'
  };
  
  try {
    console.log(`📡 Probando: ${baseUrl}/api/auth/clinica/login`);
    console.log(`📄 Data:`, JSON.stringify(loginData, null, 2));
    
    const result = await makePostRequest(`${baseUrl}/api/auth/clinica/login`, loginData);
    console.log(`✅ Status: ${result.status}`);
    console.log(`📄 Response:`, JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testClinicaLogin().catch(console.error);
