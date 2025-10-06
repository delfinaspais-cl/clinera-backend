const https = require('https');

console.log('🔍 PROBANDO ENDPOINT DE PACIENTES CON TOKEN DE PRUEBA');
console.log('======================================================\n');

function testEndpointWithToken() {
  const url = 'https://clinera-backend-production.up.railway.app/clinica/metodo-hebe/pacientes';
  
  console.log(`🌐 Probando endpoint: ${url}`);
  console.log('📡 Método: GET');
  console.log('🔐 Token: test_token (token de prueba)');
  console.log('⏳ Esperando respuesta...\n');

  const options = {
    headers: {
      'Authorization': 'Bearer test_token',
      'Content-Type': 'application/json'
    }
  };

  const req = https.get(url, options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, JSON.stringify(res.headers, null, 2));
    console.log('');

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📄 Respuesta completa recibida:');
      console.log('================================');
      
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
        
        if (res.statusCode === 200 && jsonData.success && jsonData.data) {
          console.log(`\n✅ RESPUESTA EXITOSA:`);
          console.log(`   - Total de pacientes devueltos: ${jsonData.data.length}`);
          console.log(`   - Total de registros: ${jsonData.pagination?.total || 'N/A'}`);
          console.log(`   - Página actual: ${jsonData.pagination?.page || 'N/A'}`);
          console.log(`   - Total de páginas: ${jsonData.pagination?.totalPages || 'N/A'}`);
          
          if (jsonData.data.length === 0) {
            console.log('\n⚠️ PROBLEMA: La respuesta tiene success: true pero data está vacío');
            console.log('💡 Esto explica por qué el frontend muestra "No hay pacientes registrados"');
          } else {
            console.log('\n✅ Los datos están llegando correctamente');
            console.log('💡 El problema está en el frontend o en el token que está enviando');
            console.log('\n📋 Muestra de pacientes (primeros 3):');
            jsonData.data.slice(0, 3).forEach((p, index) => {
              console.log(`     ${index + 1}. ID: ${p.id}, Nombre: ${p.name}, Email: ${p.email || 'N/A'}, Turnos: ${p.totalTurnos}`);
            });
          }
        } else if (res.statusCode === 401) {
          console.log('\n❌ AÚN 401 - El token de prueba no funciona');
          console.log('💡 Posibles causas:');
          console.log('   - El ENABLE_TEST_TOKEN no está configurado en Railway');
          console.log('   - El NODE_ENV no está configurado correctamente');
          console.log('   - El token de prueba fue deshabilitado');
        } else {
          console.log('\n❌ Respuesta inesperada');
        }
        
      } catch (error) {
        console.log('❌ Error parseando JSON:', error.message);
        console.log('📄 Respuesta raw:');
        console.log(data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error en la petición:', error.message);
  });

  req.setTimeout(30000, () => {
    console.log('⏰ Timeout - la petición tardó más de 30 segundos');
    req.destroy();
  });
}

testEndpointWithToken();
