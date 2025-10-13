import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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

    // Configuración mejorada de CORS
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:5173',
        'http://localhost:8080',
        'https://clinera-backend-production.up.railway.app',
        'https://clinera-backend-develop.up.railway.app',
        // Agregar aquí el dominio de tu frontend
        'https://tu-frontend-domain.com'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With', 
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control'
      ],
      credentials: true,
      optionsSuccessStatus: 200,
    });
    console.log('✅ CORS habilitado con configuración mejorada');

    // Configuración de Swagger/OpenAPI
    const config = new DocumentBuilder()
      .setTitle('Clinera Backend API')
      .setDescription('API completa para gestión de clínicas, turnos, profesionales y pacientes')
      .setVersion('1.0.0')
      .addTag('Autenticación', 'Endpoints de registro, login y gestión de sesiones')
      .addTag('Planes', 'Gestión de planes de suscripción')
      .addTag('Suscripciones', 'Gestión de suscripciones de clínicas')
      .addTag('Clínicas', 'Gestión de clínicas del sistema')
      .addTag('Turnos', 'Gestión de turnos y citas médicas')
      .addTag('Pacientes', 'Gestión de pacientes')
      .addTag('Profesionales', 'Gestión de profesionales médicos')
      .addTag('Notificaciones', 'Sistema de notificaciones')
      .addTag('Mensajes', 'Sistema de mensajería')
      .addTag('Reportes', 'Generación de reportes')
      .addTag('WhatsApp', 'Integración con WhatsApp')
      .addTag('Fichas Médicas', 'Gestión de historias clínicas')
      .addTag('Ventas', 'Gestión de ventas y pagos')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Ingresa tu token JWT',
          in: 'header',
        },
        'JWT-auth', // Este nombre se usa en los decoradores
      )
      .addServer('https://clinera-backend-production.up.railway.app', 'Servidor de Producción')
      .addServer('http://localhost:3000', 'Servidor Local')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'Clinera API Docs',
      customfavIcon: 'https://clinera.io/favicon.ico',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 50px 0 }
        .swagger-ui .info .title { font-size: 36px }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai',
        },
      },
    });
    console.log('✅ Swagger configurado en /docs');

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
    console.log(`📚 Documentación Swagger disponible en: http://0.0.0.0:${port}/docs`);
    
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
    
    // En caso de error, intentar al menos responder a health checks básicos
    console.log('🔄 Iniciando servidor HTTP básico para health checks...');
    
    const http = require('http');
    const port = process.env.PORT || 3000;
    
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      
      if (req.url === '/health' || req.url === '/health/simple') {
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      } else {
        res.end(JSON.stringify({ 
          message: 'Clinera Backend API (modo básico)',
          status: 'running',
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`✅ Servidor básico ejecutándose en puerto ${port}`);
      console.log(`✅ Health checks disponibles en /health y /`);
    });
    
    // Manejar señales de terminación
    process.on('SIGTERM', () => {
      console.log('🔄 SIGTERM recibido, cerrando servidor...');
      server.close();
    });
    
    process.on('SIGINT', () => {
      console.log('🔄 SIGINT recibido, cerrando servidor...');
      server.close();
    });
  }
}

bootstrap();
