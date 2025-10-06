const { execSync } = require('child_process');

console.log('🚀 DESPLEGANDO FIX DE HEALTH CHECK');
console.log('===================================\n');

try {
  console.log('1. Agregando archivos al git...');
  execSync('git add .', { stdio: 'inherit' });
  
  console.log('2. Creando commit...');
  execSync('git commit -m "Fix: Agregar módulo de health independiente para resolver healthcheck"', { stdio: 'inherit' });
  
  console.log('3. Desplegando a Railway...');
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('\n✅ DESPLIEGUE COMPLETADO');
  console.log('========================');
  console.log('🔍 Nuevos endpoints de health:');
  console.log('   - /health (detallado)');
  console.log('   - /health/simple (básico)');
  console.log('   - / (endpoint raíz mejorado)');
  console.log('\n⏳ Esperando que Railway procese el despliegue...');
  console.log('💡 El healthcheck debería funcionar ahora');
  
} catch (error) {
  console.error('❌ Error en despliegue:', error.message);
  process.exit(1);
}
