const https = require('https');

// Función para verificar el estado del email
function debugEmail() {
  const options = {
    hostname: 'clinera-backend-production.up.railway.app',
    port: 443,
    path: '/clinica/clinica-production/usuarios/debug/check-email/delfina.spais@oacg.cl',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log('🔍 Verificando estado del email delfina.spais@oacg.cl...');
  console.log('URL:', `https://${options.hostname}${options.path}`);

  const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('📄 Response:', data);
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ JSON Response:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('❌ No es JSON válido');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error);
  });

  req.end();
}

// Ejecutar verificación
console.log('🚀 Verificando estado del email...\n');
debugEmail();
