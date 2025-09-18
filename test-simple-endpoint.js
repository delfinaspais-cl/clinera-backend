const https = require('https');

// Función para probar el endpoint de debug GET
function testDebugGet() {
  const options = {
    hostname: 'clinera-backend-production.up.railway.app',
    port: 443,
    path: '/clinica/clinica-production/usuarios/debug/test',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log('🔍 Probando endpoint GET de debug...');
  console.log('URL:', `https://${options.hostname}${options.path}`);

  const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('📄 Response:', data);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error);
  });

  req.end();
}

// Función para probar el endpoint POST de debug
function testDebugPost() {
  const postData = JSON.stringify({
    test: "data",
    clinicaId: "cmforbc6i0000pj31mipssih5"
  });

  const options = {
    hostname: 'clinera-backend-production.up.railway.app',
    port: 443,
    path: '/clinica/clinica-production/usuarios/debug/test-post',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('\n🔍 Probando endpoint POST de debug...');
  console.log('URL:', `https://${options.hostname}${options.path}`);
  console.log('Payload:', postData);

  const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('📄 Response:', data);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error);
  });

  req.write(postData);
  req.end();
}

// Ejecutar pruebas
console.log('🚀 Iniciando pruebas de endpoints de debug...\n');
testDebugGet();

setTimeout(() => {
  testDebugPost();
}, 2000);
