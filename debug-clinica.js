const axios = require('axios');

const API_URL = 'https://clinera-backend-production.up.railway.app';
const VENTA_ID = 'cmgmd03910001p90fkhazcw44';

async function debugClinica() {
  try {
    // Login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'marianacosta',
      password: '12345678'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Token obtenido');

    // Obtener la venta completa
    const ventaResponse = await axios.get(
      `${API_URL}/ventas/${VENTA_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const venta = ventaResponse.data.data;
    console.log('\n📊 Datos de la venta:');
    console.log('ID:', venta.id);
    console.log('VentaID:', venta.ventaId);
    console.log('Clínica ID:', venta.clinicaId);

    console.log('\n🏥 Datos de la clínica:');
    console.log('Nombre:', venta.clinica.name);
    console.log('URL:', venta.clinica.url);
    console.log('Email:', venta.clinica.email);
    console.log('Teléfono (phone):', venta.clinica.phone);
    console.log('Dirección (address):', venta.clinica.address);

    // Verificar si la clínica tiene más datos
    const clinicaResponse = await axios.get(
      `${API_URL}/clinicas/${venta.clinicaId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const clinica = clinicaResponse.data.data;
    console.log('\n🔍 Datos completos de la clínica:');
    console.log('Nombre:', clinica.name);
    console.log('Dirección:', clinica.address);
    console.log('Teléfono:', clinica.phone);
    console.log('Email:', clinica.email);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugClinica();
