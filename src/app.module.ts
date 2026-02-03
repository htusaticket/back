import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './infrastructure/http/controllers/health.controller';
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module';
import { AuthModule } from './infrastructure/http/controllers/auth/auth.module';
import { CorrelationIdMiddleware } from './application/common/middleware/correlation-id.middleware';
import { MetricsService } from './application/common/services/metrics.service';
import { SentryService } from './application/common/services/sentry.service';
import { LoggerConfigModule } from './config/logger.config';
import { validateEnv, getEnvConfig } from './config/env.config';

// Validar env al cargar el módulo
validateEnv();
const env = getEnvConfig();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    LoggerConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: env.RATE_LIMIT_TTL * 1000, // convertir a milisegundos
        limit: env.RATE_LIMIT_MAX,
      },
    ]),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, MetricsService, SentryService],
  exports: [MetricsService, SentryService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
