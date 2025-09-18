const https = require('https');

// Función para probar el endpoint real con datos mínimos
function testRealEndpointSimple() {
  const postData = JSON.stringify({
    nombre: "Test User",
    email: "test@example.com",
    tipo: "SECRETARY",
    phone: "",
    clinicaId: "cmforbc6i0000pj31mipssih5"
  });

  const options = {
    hostname: 'clinera-backend-production.up.railway.app',
    port: 443,
    path: '/clinica/clinica-production/usuarios',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🔍 Probando endpoint real con datos simples...');
  console.log('URL:', `https://${options.hostname}${options.path}`);
  console.log('Payload:', postData);

  const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📄 Response Body:', data);
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ JSON Response:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('❌ No es JSON válido');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error en la petición:', error);
  });

  req.write(postData);
  req.end();
}

// Función para probar con el email problemático
function testRealEndpointProblematic() {
  const postData = JSON.stringify({
    nombre: "Delfina Admin",
    email: "delfina.spais@oacg.cl",
    tipo: "SECRETARY",
    phone: "",
    clinicaId: "cmforbc6i0000pj31mipssih5"
  });

  const options = {
    hostname: 'clinera-backend-production.up.railway.app',
    port: 443,
    path: '/clinica/clinica-production/usuarios',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('\n🔍 Probando endpoint real con email problemático...');
  console.log('URL:', `https://${options.hostname}${options.path}`);
  console.log('Payload:', postData);

  const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📄 Response Body:', data);
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ JSON Response:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('❌ No es JSON válido');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error en la petición:', error);
  });

  req.write(postData);
  req.end();
}

// Ejecutar pruebas
console.log('🚀 Iniciando pruebas del endpoint real...\n');
testRealEndpointSimple();

setTimeout(() => {
  testRealEndpointProblematic();
}, 3000);
