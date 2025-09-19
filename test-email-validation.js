const https = require('https');

async function testEmailValidation() {
  const railwayUrl = 'https://clinera-backend-production.up.railway.app';
  
  console.log('🔍 Probando validación de email...');
  console.log(`🌐 URL: ${railwayUrl}`);
  
  try {
    const email = 'delfina.spais@oacg.cl';
    const clinicaId = 'cmforbc6i0000pj31mipssih5';
    
    // Probar endpoint de validación de email
    const validateUrl = `${railwayUrl}/auth/validate/email/${email}`;
    console.log(`🔗 URL: ${validateUrl}`);
    console.log(`🏥 Clínica ID: ${clinicaId}`);
    
    const options = {
      method: 'GET',
      headers: {
        'x-clinica-id': clinicaId,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('\n📤 Enviando petición...');
    const response = await fetch(validateUrl, options);
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Endpoint de validación funciona');
    } else {
      console.log('❌ Endpoint de validación no funciona correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error al probar Railway:', error.message);
  }
}

testEmailValidation();
