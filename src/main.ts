import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  console.log('Starting application...');
  
  // Debug: Verificar variables de entorno
  console.log('Environment variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 20) + '...');
  }
  
  const app = await NestFactory.create(AppModule);
  console.log('NestJS app created successfully');

  let allowedOrigins: string[];

  switch (process.env.NODE_ENV) {
    case 'production':
      allowedOrigins = ['https://tu-frontend-domain.com', 'http://localhost:3000'];
      break;
    case 'develop':
      allowedOrigins = ['https://tu-frontend-develop.com', 'http://localhost:3000'];
      break;
    default:
      allowedOrigins = ['http://localhost:3000'];
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  console.log('CORS configured');

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Clinera API')
    .setDescription('Documentación de la API de Clinera')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  console.log('Swagger configured');

  const port = process.env.PORT || 3000;
  console.log(`Attempting to listen on port ${port}...`);
  
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/docs`);
}
bootstrap();
