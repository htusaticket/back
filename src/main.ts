import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './application/common/filters/http-exception.filter';
import { LoggingInterceptor } from './application/common/interceptors/logging.interceptors';
import { TransformInterceptor } from './application/common/interceptors/transform.interceptor';
import { SentryInterceptor } from './application/common/interceptors/sentry.interceptor';
import { validateEnv, getEnvConfig } from './config/env.config';
import { initializeSentry } from './config/sentry.config';

async function bootstrap() {
  // Validar variables de entorno al inicio
  validateEnv();
  const env = getEnvConfig();

  // Inicializar Sentry antes que nada
  initializeSentry();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const logger = new Logger('Bootstrap');

  // Configuración de seguridad
  app.use(
    helmet(
      env.NODE_ENV === 'production'
        ? {}
        : {
            contentSecurityPolicy: false,
          },
    ),
  );

  // CORS
  const allowedOrigins = env.HOSTS_WHITE_LIST
    ? env.HOSTS_WHITE_LIST.split(',').map(host => host.trim())
    : env.NODE_ENV === 'development'
      ? ['http://localhost:3000', 'http://localhost:3001']
      : [];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-correlation-id',
    ],
  });

  // Middlewares
  app.use(cookieParser());

  // Interceptors globales
  app.useGlobalInterceptors(
    new SentryInterceptor(),
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtros globales
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger - solo en desarrollo
  if (env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('JFalcon Academy API')
      .setDescription('API para JFalcon Academy - English Learning Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Autenticación y gestión de usuarios')
      .addTag('Classes', 'Gestión de clases en vivo y workshops')
      .addTag('Dashboard', 'Resumen e información del dashboard')
      .addTag('Health', 'Health checks y monitoreo')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`📚 Swagger disponible en: http://localhost:${env.PORT}/docs`);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(env.PORT);
  logger.log(`🚀 Aplicación corriendo en puerto ${env.PORT}`);
  logger.log(`🌍 Entorno: ${env.NODE_ENV}`);
}

bootstrap().catch(err => {
  console.error('❌ Error al iniciar la aplicación:', err);
  process.exit(1);
});
