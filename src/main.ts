import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🚀 Iniciando aplicación...');
  console.log('🔍 DATABASE_URL presente:', !!process.env.DATABASE_URL);
  console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔍 PORT:', process.env.PORT);
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
    console.log('✅ Aplicación creada exitosamente');

    // Configuración básica de CORS
    app.enableCors({
      origin: true,
      credentials: true,
    });
    console.log('✅ CORS habilitado');

    // Configuración del puerto
    const port = process.env.PORT || 3000;
    console.log(`🔍 Puerto configurado: ${port}`);
    
    await app.listen(port, '0.0.0.0');
    console.log(`✅ Aplicación ejecutándose en puerto ${port}`);
    console.log(`✅ Health check disponible en: http://0.0.0.0:${port}/`);
    console.log(`✅ Health check detallado en: http://0.0.0.0:${port}/health`);
    
  } catch (error) {
    console.error('❌ Error crítico en bootstrap:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    // No hacer exit(1) inmediatamente, dar tiempo para que Railway vea el error
    setTimeout(() => {
      console.error('❌ Forzando salida después de timeout');
      process.exit(1);
    }, 5000);
  }
}

bootstrap();
