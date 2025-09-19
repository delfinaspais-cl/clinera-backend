const https = require('https');

async function testRegisterDirectFinal() {
  const railwayUrl = 'https://clinera-backend-production.up.railway.app';
  
  console.log('🔍 Probando registro directo después de correcciones...');
  console.log(`🌐 URL: ${railwayUrl}`);
  
  try {
    // Datos del usuario a crear
    const userData = {
      email: 'delfina.spais@oacg.cl',
      password: 'password123',
      name: 'Delfina Admin',
      role: 'ADMIN',
      clinicaId: 'cmforbc6i0000pj31mipssih5'
    };
    
    console.log('\n👤 Datos del usuario:', JSON.stringify(userData, null, 2));
    
    // Probar endpoint de registro directo
    const registerUrl = `${railwayUrl}/auth/register`;
    console.log(`🔗 URL: ${registerUrl}`);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    };
    
    console.log('\n📤 Enviando petición...');
    const response = await fetch(registerUrl, options);
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 201) {
      console.log('✅ Usuario registrado exitosamente');
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

testRegisterDirectFinal();
