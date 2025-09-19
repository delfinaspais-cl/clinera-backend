const https = require('https');

async function testDtoDebug() {
  const railwayUrl = 'https://clinera-backend-production.up.railway.app';
  
  console.log('🔍 Probando validación de DTO...');
  console.log(`🌐 URL: ${railwayUrl}`);
  
  const testCases = [
    {
      name: 'Campos mínimos sin clínica',
      data: {
        email: 'test1@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'ADMIN'
      }
    },
    {
      name: 'Con clínica',
      data: {
        email: 'test2@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'ADMIN',
        clinicaId: 'cmforbc6i0000pj31mipssih5'
      }
    },
    {
      name: 'Email problemático sin clínica',
      data: {
        email: 'delfina.spais@oacg.cl',
        password: 'password123',
        name: 'Delfina Admin',
        role: 'ADMIN'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Probando: ${testCase.name}`);
    console.log(`👤 Datos:`, JSON.stringify(testCase.data, null, 2));
    
    try {
      const registerUrl = `${railwayUrl}/auth/register`;
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.data)
      };
      
      const response = await fetch(registerUrl, options);
      const data = await response.json();
      
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Response:`, JSON.stringify(data, null, 2));
      
      if (response.status === 201) {
        console.log('✅ Usuario registrado exitosamente');
        break; // Si funciona, no probar más
      } else if (response.status === 400) {
        console.log('❌ Error de validación');
      } else if (response.status === 409) {
        console.log('❌ Email ya existe');
      } else {
        console.log(`❌ Error ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

testDtoDebug();
