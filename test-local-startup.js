const { execSync } = require('child_process');

console.log('🔍 PROBANDO INICIO LOCAL DE LA APLICACIÓN');
console.log('==========================================\n');

try {
  console.log('1. Verificando si la aplicación compila...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build exitoso\n');
  
  console.log('2. Verificando variables de entorno...');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'No configurada');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'No definida');
  console.log('   PORT:', process.env.PORT || 'No definida');
  
  console.log('\n3. Iniciando aplicación en modo test...');
  console.log('   (Esto se ejecutará por 10 segundos para ver si hay errores de startup)');
  
  // Iniciar la aplicación en background
  const child = execSync('timeout 10s npm run start:prod || echo "Timeout o error"', { 
    stdio: 'pipe',
    encoding: 'utf8'
  });
  
  console.log('📄 Output del startup:');
  console.log(child);
  
} catch (error) {
  console.error('❌ Error en prueba local:', error.message);
  console.error('Stack:', error.stack);
}
