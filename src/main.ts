import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🚀 Iniciando aplicación...');
  console.log('🔍 DATABASE_URL presente:', !!process.env.DATABASE_URL);
  console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔍 PORT:', process.env.PORT);
  
  try {
    // Crear aplicación con configuración mínima
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
      abortOnError: false, // No abortar si hay errores de dependencias
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
    
    // Configurar shutdown hooks para manejo graceful
    app.enableShutdownHooks();
    
    await app.listen(port, '0.0.0.0');
    console.log(`✅ Aplicación ejecutándose en puerto ${port}`);
    console.log(`✅ Health check disponible en: http://0.0.0.0:${port}/`);
    console.log(`✅ Health check detallado en: http://0.0.0.0:${port}/health`);
    console.log(`✅ Health check simple en: http://0.0.0.0:${port}/health/simple`);
    
    // Manejar señales de terminación
    process.on('SIGTERM', () => {
      console.log('🔄 SIGTERM recibido, cerrando aplicación...');
      app.close();
    });
    
    process.on('SIGINT', () => {
      console.log('🔄 SIGINT recibido, cerrando aplicación...');
      app.close();
    });
    
  } catch (error) {
    console.error('❌ Error crítico en bootstrap:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    // Intentar iniciar con configuración mínima
    console.log('🔄 Intentando iniciar con configuración mínima...');
    
    try {
      const { NestFactory } = await import('@nestjs/core');
      const { AppModule } = await import('./app.module');
      
      const app = await NestFactory.create(AppModule, {
        logger: false, // Deshabilitar logs para evitar problemas
        abortOnError: false,
      });
      
      app.enableCors({ origin: true, credentials: true });
      
      const port = process.env.PORT || 3000;
      await app.listen(port, '0.0.0.0');
      
      console.log(`✅ Aplicación iniciada en modo mínimo en puerto ${port}`);
      
    } catch (minimalError) {
      console.error('❌ Error incluso en modo mínimo:', minimalError.message);
      process.exit(1);
    }
  }
}

bootstrap();
