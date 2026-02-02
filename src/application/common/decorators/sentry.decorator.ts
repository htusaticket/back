import { createParamDecorator, Logger } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { SentryService } from '../services/sentry.service';

/**
 * Decorator para inyectar SentryService en controladores
 *
 * @example
 * async createUser(@Sentry() sentry: SentryService, @Body() data: CreateUserDto) {
 *   sentry.addBreadcrumb('Creating user', 'user', { email: data.email });
 *   // ... lógica del controlador
 * }
 */
export const Sentry = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SentryService => {
    const request = ctx.switchToHttp().getRequest();
    return request.app.get('SentryService');
  },
);

/**
 * Decorator de método para medir automáticamente el tiempo de ejecución
 *
 * @example
 * @MeasurePerformance('user.create')
 * async createUser(@Body() data: CreateUserDto) {
 *   // ... lógica del método
 * }
 */
export function MeasurePerformance(operationName: string) {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    const logger = new Logger('Performance');

    descriptor.value = async function (...args: unknown[]) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);

        const duration = Date.now() - startTime;

        // Log de performance solo si es lento
        if (duration > 100) {
          logger.log(`${operationName} completed in ${duration}ms`);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`${operationName} failed after ${duration}ms`, (error as Error).message);
        throw error;
      }
    };

    return descriptor;
  };
}
