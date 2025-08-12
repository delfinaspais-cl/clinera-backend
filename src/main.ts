import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService>(ConfigService);

  // Configuración de CORS más permisiva para desarrollo
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  
  const corsOptions = {
    origin: isProduction 
      ? [
          config.get<string>('ALLOWED_ORIGIN'),
          'http://localhost:3000',
          'http://localhost:3001',
          'https://clinera-frontend.vercel.app',
          'https://clinera.vercel.app'
        ].filter(Boolean) // Remueve valores undefined/null
      : true, // Permite todos los orígenes en desarrollo
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  };

  app.enableCors(corsOptions);

  // Configuración de Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Clinera API')
    .setDescription('Documentación de la API de Clinera')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Configuración del puerto
  const port = config.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`Aplicación ejecutándose en: http://localhost:${port}`);
  console.log(`Documentación disponible en: http://localhost:${port}/docs`);
}

bootstrap();