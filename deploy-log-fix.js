const { exec } = require('child_process');

console.log('🚀 DESPLEGANDO FIX DE LOGS A RAILWAY');
console.log('====================================\n');

console.log('📋 Cambios realizados:');
console.log('   ✅ Comentados logs de debug en patients.service.ts');
console.log('   ✅ Eliminados logs que causaban rate limit');
console.log('   ✅ Reducido volumen de logs en Railway\n');

console.log('🔄 Iniciando deploy a Railway...');

// Ejecutar git add, commit y push
exec('git add . && git commit -m "Fix: Comentar logs de debug para evitar rate limit en Railway" && git push origin main', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error en deploy:', error);
    return;
  }
  
  console.log('✅ Deploy iniciado exitosamente');
  console.log('📊 Railway detectará los cambios automáticamente');
  console.log('⏱️ Tiempo estimado de deploy: 2-3 minutos');
  
  console.log('\n🎯 RESULTADO ESPERADO:');
  console.log('   ✅ Rate limit de logs eliminado');
  console.log('   ✅ Búsqueda de pacientes funcionando normalmente');
  console.log('   ✅ Sin logs excesivos en Railway');
  
  console.log('\n📝 Para verificar:');
  console.log('   1. Espera 2-3 minutos');
  console.log('   2. Prueba buscar pacientes en tu aplicación');
  console.log('   3. Verifica que no aparezcan más logs de debug');
});

console.log('\n⏳ Procesando deploy...');
