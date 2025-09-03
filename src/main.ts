import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService>(ConfigService);

  // Configurar prefijo global de la API
  // app.setGlobalPrefix('api'); // Comentado para endpoints públicos

  // Configurar ValidationPipe global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false, // Permitir campos adicionales
    transform: true,
  }));

  // Interceptor global simplificado
  app.useGlobalInterceptors(new (class {
    intercept(context: any, next: any) {
      return next.handle();
    }
  })());

  // Configuración de CORS más permisiva para desarrollo
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  const corsOptions = {
    origin: isProduction
      ? [
          config.get<string>('ALLOWED_ORIGIN'),
          'http://localhost:3000',
          'http://localhost:3001',
          'https://clinera-frontend.vercel.app',
          'https://clinera.vercel.app',
          'https://clinera-web-git-develop-clinera-io-b8a9d478.vercel.app',
          // Tu dominio específico de Vercel
          'https://clinera-101a5caom-clinera-io-b8a9d478.vercel.app',
          // Patrón para dominios de Vercel con preview deployments
          /^https:\/\/clinera-web.*\.vercel\.app$/,
          // Patrón más amplio para cualquier subdominio de clinera en Vercel
          /^https:\/\/clinera.*\.vercel\.app$/,
        ].filter((origin): origin is string | RegExp => Boolean(origin)) // Remueve valores undefined/null
      : true, // Permite todos los orígenes en desarrollo
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
    // Agregar configuración para evitar redirecciones automáticas
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  app.enableCors(corsOptions);

  // Configurar archivos estáticos para servir uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Logging simple para debugging (sin modificar headers)
  app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });

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
