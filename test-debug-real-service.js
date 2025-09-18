const https = require('https');

// Función para probar el endpoint de debug del servicio real
function testDebugRealService() {
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
    path: '/clinica/clinica-production/usuarios/debug/test-real-service',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🔍 Probando endpoint de debug del servicio real...');
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

// Ejecutar prueba
console.log('🚀 Probando endpoint de debug del servicio real...\n');
testDebugRealService();
