const https = require('https');

async function testDifferentEmail() {
  const railwayUrl = 'https://clinera-backend-production.up.railway.app';
  
  console.log('🔍 Probando con email diferente...');
  console.log(`🌐 URL: ${railwayUrl}`);
  
  try {
    // Payload con email diferente
    const userData = {
      nombre: "Test User",
      email: "test@example.com",
      tipo: "SECRETARY",
      phone: "",
      clinicaId: "cmforbc6i0000pj31mipssih5"
    };
    
    console.log('\n👤 Payload con email diferente:', JSON.stringify(userData, null, 2));
    
    // Endpoint exacto del frontend
    const createUrl = `${railwayUrl}/clinica/clinica-production/usuarios`;
    console.log(`🔗 URL: ${createUrl}`);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    };
    
    console.log('\n📤 Enviando petición...');
    const response = await fetch(createUrl, options);
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 201) {
      console.log('✅ Usuario creado exitosamente');
    } else if (response.status === 409) {
      console.log('❌ Email ya existe en esta clínica');
    } else if (response.status === 500) {
      console.log('❌ Error interno del servidor');
    } else {
      console.log(`❌ Error ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error al probar Railway:', error.message);
  }
}

testDifferentEmail();
