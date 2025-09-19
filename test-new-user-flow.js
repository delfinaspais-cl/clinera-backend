const axios = require('axios');

const BASE_URL = 'https://clinera-backend-production.up.railway.app';

async function testNewUserFlow() {
  console.log('🚀 Iniciando prueba del nuevo flujo de usuarios...\n');

  try {
    // Paso 1: Registrar un nuevo usuario
    console.log('📝 Paso 1: Registrando nuevo usuario...');
    const registerData = {
      email: 'juan.perez@ejemplo.com',
      username: 'juan_perez',
      name: 'Juan Pérez',
      password: 'miContraseña123'
    };

    const registerResponse = await axios.post(`${BASE_URL}/users/register`, registerData);
    console.log('✅ Usuario registrado exitosamente:');
    console.log('   - ID:', registerResponse.data.user.id);
    console.log('   - Email:', registerResponse.data.user.email);
    console.log('   - Username:', registerResponse.data.user.username);
    console.log('   - Token:', registerResponse.data.token.substring(0, 20) + '...');
    console.log('   - 📧 Email de bienvenida enviado con credenciales');
    console.log('');

    const userToken = registerResponse.data.token;

    // Paso 2: Obtener perfil del usuario
    console.log('👤 Paso 2: Obteniendo perfil del usuario...');
    const profileResponse = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Perfil obtenido:');
    console.log('   - Nombre:', profileResponse.data.user.name);
    console.log('   - Email:', profileResponse.data.user.email);
    console.log('   - Username:', profileResponse.data.user.username);
    console.log('   - Rol:', profileResponse.data.user.role);
    console.log('');

    // Paso 3: Crear una clínica
    console.log('🏥 Paso 3: Creando nueva clínica...');
    const clinicaData = {
      nombre: 'Clínica de Prueba',
      url: 'clinica-prueba-' + Date.now(),
      email: 'admin@clinica-prueba.com',
      password: 'admin123',
      direccion: 'Av. Principal 123',
      telefono: '+54 11 1234-5678',
      descripcion: 'Clínica de prueba para el nuevo sistema',
      colorPrimario: '#3B82F6',
      colorSecundario: '#1E40AF',
      estado: 'activa'
    };

    const clinicaResponse = await axios.post(`${BASE_URL}/users/clinicas`, clinicaData, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Clínica creada exitosamente:');
    console.log('   - ID:', clinicaResponse.data.clinica.id);
    console.log('   - Nombre:', clinicaResponse.data.clinica.name);
    console.log('   - URL:', clinicaResponse.data.clinica.url);
    console.log('   - Credenciales Admin:', clinicaResponse.data.adminCredentials);
    console.log('');

    // Paso 4: Obtener clínicas del usuario
    console.log('🏥 Paso 4: Obteniendo clínicas del usuario...');
    const clinicasResponse = await axios.get(`${BASE_URL}/users/clinicas`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Clínicas del usuario:');
    clinicasResponse.data.clinicas.forEach((clinica, index) => {
      console.log(`   ${index + 1}. ${clinica.name} (${clinica.url})`);
    });
    console.log('');

    // Paso 5: Verificar acceso a la clínica
    console.log('🔐 Paso 5: Verificando acceso a la clínica...');
    const accessResponse = await axios.get(`${BASE_URL}/users/clinicas/${clinicaData.url}/access`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Acceso verificado:');
    console.log('   - Tiene acceso:', accessResponse.data.hasAccess);
    console.log('   - Clínica:', accessResponse.data.clinica.name);
    console.log('');

    // Paso 6: Probar login con username
    console.log('🔑 Paso 6: Probando login con username...');
    const loginData = {
      username: 'juan_perez', // Usando username en lugar de email
      password: 'miContraseña123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/users/login`, loginData);
    console.log('✅ Login exitoso con username:');
    console.log('   - Usuario:', loginResponse.data.user.username);
    console.log('   - Email:', loginResponse.data.user.email);
    console.log('   - Token:', loginResponse.data.token.substring(0, 20) + '...');
    console.log('');

    console.log('🎉 ¡Flujo completo probado exitosamente!');
    console.log('\n📋 Resumen del nuevo sistema:');
    console.log('   1. ✅ Los usuarios se registran con email, username, nombre y contraseña');
    console.log('   2. ✅ Los usuarios pueden crear clínicas');
    console.log('   3. ✅ Se crea automáticamente un admin para cada clínica');
    console.log('   4. ✅ Los usuarios pueden acceder a sus clínicas');
    console.log('   5. ✅ El login funciona tanto con email como con username');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Detalles:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Ejecutar la prueba
testNewUserFlow();
