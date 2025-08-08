import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration for production
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://tu-frontend-domain.com', 'http://localhost:3000'] // Ajusta según tu frontend
    : ['http://localhost:3000'];
    
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,              
  });

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Clinera API')
    .setDescription('Documentación de la API de Clinera')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
