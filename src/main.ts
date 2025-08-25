import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService>(ConfigService);

  // Configurar prefijo global de la API
  app.setGlobalPrefix('api');

  // Configurar ValidationPipe global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Interceptor global para manejar respuestas
  app.useGlobalInterceptors(new (class {
    intercept(context: any, next: any) {
      const response = context.switchToHttp().getResponse();
      
      // Agregar headers para evitar cache en endpoints públicos
      response.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.header('Pragma', 'no-cache');
      response.header('Expires', '0');
      
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
          // Patrón para dominios de Vercel con preview deployments
          /^https:\/\/clinera-web.*\.vercel\.app$/,
        ].filter(Boolean) // Remueve valores undefined/null
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

  // Middleware personalizado para evitar redirecciones infinitas
  app.use((req, res, next) => {
    // Log de todas las requests para debugging
    console.log(`🌐 ${req.method} ${req.url} - ${new Date().toISOString()}`);
    
    // Verificar si hay redirecciones infinitas
    const redirectCount = req.headers['x-redirect-count'] || 0;
    if (redirectCount > 5) {
      console.error('🚫 Redirección infinita detectada:', req.url);
      return res.status(500).json({
        error: 'Redirección infinita detectada',
        url: req.url,
        method: req.method
      });
    }
    
    // Agregar contador de redirecciones
    req.headers['x-redirect-count'] = (parseInt(redirectCount.toString()) + 1).toString();
    
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
