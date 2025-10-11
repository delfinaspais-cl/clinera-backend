const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración
const API_URL = process.env.API_URL || 'https://clinera-backend-production.up.railway.app';
const VENTA_ID = 'cmgmd03910001p90fkhazcw44';

// Primero necesitamos obtener un token válido
async function login() {
  try {
    console.log('🔐 Intentando autenticar...');
    
    // Intenta con credenciales de prueba (ajusta según tus credenciales)
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: process.env.TEST_EMAIL || 'admin@test.com',
      password: process.env.TEST_PASSWORD || 'password123'
    });

    if (response.data.access_token) {
      console.log('✅ Autenticación exitosa');
      return response.data.access_token;
    }
  } catch (error) {
    console.error('❌ Error en autenticación:', error.response?.data || error.message);
    throw error;
  }
}

async function testPDFDownload(token) {
  try {
    console.log(`\n📄 Probando descarga de PDF para venta ID: ${VENTA_ID}`);
    console.log(`🌐 URL: ${API_URL}/ventas/${VENTA_ID}/pdf`);
    
    const response = await axios.get(
      `${API_URL}/ventas/${VENTA_ID}/pdf`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'arraybuffer' // Para manejar datos binarios
      }
    );

    // Verificar que la respuesta sea un PDF
    const contentType = response.headers['content-type'];
    console.log(`\n📋 Content-Type: ${contentType}`);
    
    if (contentType === 'application/pdf') {
      // Guardar el PDF localmente para verificación
      const outputPath = path.join(__dirname, `venta-${VENTA_ID}.pdf`);
      fs.writeFileSync(outputPath, response.data);
      
      const fileSize = fs.statSync(outputPath).size;
      console.log(`\n✅ PDF generado exitosamente!`);
      console.log(`📁 Guardado en: ${outputPath}`);
      console.log(`📊 Tamaño del archivo: ${(fileSize / 1024).toFixed(2)} KB`);
      console.log(`\n🎉 El endpoint está funcionando correctamente!`);
      
      return true;
    } else {
      console.error(`❌ Error: La respuesta no es un PDF`);
      console.error(`Respuesta recibida:`, response.data.toString());
      return false;
    }
  } catch (error) {
    console.error('\n❌ Error al descargar PDF:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Mensaje:`, error.response.data?.message || error.response.statusText);
      
      if (error.response.status === 404) {
        console.error(`\n⚠️  La venta con ID ${VENTA_ID} no fue encontrada`);
      } else if (error.response.status === 401) {
        console.error('\n⚠️  Token inválido o expirado');
      }
    } else {
      console.error('Error:', error.message);
    }
    
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando prueba del endpoint de PDF de ventas\n');
  console.log('═'.repeat(60));
  
  try {
    // Primero autenticarse
    const token = await login();
    
    // Luego probar la descarga del PDF
    const success = await testPDFDownload(token);
    
    console.log('\n' + '═'.repeat(60));
    if (success) {
      console.log('✅ PRUEBA EXITOSA - El endpoint funciona correctamente');
    } else {
      console.log('❌ PRUEBA FALLIDA - Revisa los errores arriba');
    }
    
  } catch (error) {
    console.log('\n' + '═'.repeat(60));
    console.log('❌ PRUEBA FALLIDA - Error general:', error.message);
  }
}

// Ejecutar
main();

