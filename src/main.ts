import { NestFactory } from '@nestjs/core';
import { AppMinimalModule } from './app-minimal.module';

async function bootstrap() {
  console.log('🚀 Iniciando aplicación simplificada...');
  
  try {
    const app = await NestFactory.create(AppMinimalModule);
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
    console.log(`🔍 Variables de entorno PORT: ${process.env.PORT}`);
    
    await app.listen(port, '0.0.0.0');
    console.log(`✅ Aplicación ejecutándose en puerto ${port} en 0.0.0.0`);
    
  } catch (error) {
    console.error('❌ Error crítico:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

bootstrap();
