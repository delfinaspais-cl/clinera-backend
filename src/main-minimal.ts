import { NestFactory } from '@nestjs/core';
import { AppMinimalModule } from './app-minimal.module';

async function bootstrap() {
  console.log('🚀 Iniciando aplicación mínima...');
  
  try {
    const app = await NestFactory.create(AppMinimalModule);
    console.log('✅ Aplicación creada');
    
    app.enableCors();
    console.log('✅ CORS habilitado');
    
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`✅ Aplicación ejecutándose en puerto ${port}`);
    
  } catch (error) {
    console.error('❌ Error crítico:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

bootstrap();
