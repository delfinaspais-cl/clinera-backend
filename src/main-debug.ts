import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    console.log('🚀 Iniciando aplicación...');
    
    const app = await NestFactory.create(AppModule);
    
    console.log('✅ Aplicación creada exitosamente');
    
    // Configuración básica de CORS
    app.enableCors({
      origin: true,
      credentials: true,
    });
    
    const port = process.env.PORT || 3000;
    await app.listen(port);
    
    console.log(`✅ Aplicación ejecutándose en puerto ${port}`);
    
  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error);
    process.exit(1);
  }
}

bootstrap();
