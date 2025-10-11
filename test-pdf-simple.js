const axios = require('axios');
const fs = require('fs');

// Configuración
const API_URL = process.env.API_URL || 'https://clinera-backend-production.up.railway.app';
const VENTA_ID = 'cmgmd03910001p90fkhazcw44';
const TOKEN = process.env.JWT_TOKEN; // Pasar el token como variable de entorno

async function testPDF() {
  try {
    if (!TOKEN) {
      console.log('❌ Error: No se proporcionó un token JWT');
      console.log('💡 Usa: JWT_TOKEN="tu-token" node test-pdf-simple.js');
      process.exit(1);
    }

    console.log('🚀 Probando endpoint de PDF...');
    console.log(`📍 URL: ${API_URL}/ventas/${VENTA_ID}/pdf`);
    console.log(`🔑 Token: ${TOKEN.substring(0, 20)}...`);
    console.log('');

    const response = await axios.get(
      `${API_URL}/ventas/${VENTA_ID}/pdf`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        },
        responseType: 'arraybuffer'
      }
    );

    // Guardar PDF
    const filename = `venta-${VENTA_ID}.pdf`;
    fs.writeFileSync(filename, response.data);
    
    const fileSize = (fs.statSync(filename).size / 1024).toFixed(2);
    
    console.log('✅ ¡PDF descargado exitosamente!');
    console.log(`📁 Archivo: ${filename}`);
    console.log(`📊 Tamaño: ${fileSize} KB`);
    console.log('');
    console.log('🎉 El endpoint está funcionando correctamente!');

  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.statusText);
    if (error.response?.status === 404) {
      console.error('⚠️  Venta no encontrada');
    } else if (error.response?.status === 401) {
      console.error('⚠️  Token inválido o expirado');
    }
    console.error('\nDetalles:', error.response?.data?.message || error.message);
  }
}

testPDF();

