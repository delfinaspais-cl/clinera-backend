const https = require('https');

console.log('🔍 PROBANDO ENDPOINT DE PACIENTES EN RAILWAY');
console.log('============================================\n');

function testEndpoint() {
  const url = 'https://clinera-backend-production.up.railway.app/clinica/metodo-hebe/pacientes';
  
  console.log(`🌐 Probando endpoint: ${url}`);
  console.log('📡 Método: GET');
  console.log('⏳ Esperando respuesta...\n');

  const req = https.get(url, (res) => {
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
        
        if (jsonData.success && jsonData.data) {
          console.log(`\n✅ Respuesta exitosa:`);
          console.log(`   - Total de pacientes: ${jsonData.data.length}`);
          console.log(`   - Total de registros: ${jsonData.pagination?.total || 'N/A'}`);
          console.log(`   - Página actual: ${jsonData.pagination?.page || 'N/A'}`);
          console.log(`   - Total de páginas: ${jsonData.pagination?.totalPages || 'N/A'}`);
          
          if (jsonData.data.length === 0) {
            console.log('\n⚠️ PROBLEMA DETECTADO: La respuesta tiene success: true pero data está vacío');
            console.log('💡 Esto explica por qué el frontend muestra "No hay pacientes registrados"');
          } else {
            console.log('\n✅ Los datos están llegando correctamente al frontend');
            console.log('💡 El problema podría estar en el frontend o en el parsing de la respuesta');
          }
        } else {
          console.log('\n❌ Respuesta no tiene el formato esperado');
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

testEndpoint();
