import { NestFactory } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

async function bootstrap() {
  console.log('🚀 Iniciando aplicación sin base de datos...');
  
  try {
    // Crear aplicación sin módulos complejos
    const app = await NestFactory.create({
      controllers: [AppController],
      providers: [AppService],
    });
    
    console.log('✅ Aplicación creada sin módulos complejos');
    
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
