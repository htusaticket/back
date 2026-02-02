import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import {
  captureError,
  captureMessage,
  setUserContext,
  addBreadcrumb,
  measureAsyncFunction,
  measureFunction,
} from '@/config/sentry.config';

@Injectable()
export class SentryService {
  /**
   * Captura un error en Sentry con contexto adicional
   */
  captureException(error: Error, context?: Record<string, unknown>): void {
    captureError(error, context);
  }

  /**
   * Captura un mensaje en Sentry
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: Record<string, unknown>,
  ): void {
    captureMessage(message, level, context);
  }

  /**
   * Configura el contexto del usuario actual
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    setUserContext(user);
  }

  /**
   * Limpia el contexto del usuario
   */
  clearUser(): void {
    Sentry.setUser(null);
  }

  /**
   * Agrega un breadcrumb personalizado
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    addBreadcrumb(message, category, data);
  }

  /**
   * Configura tags personalizados
   */
  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  }

  /**
   * Configura contexto adicional
   */
  setContext(key: string, context: Record<string, unknown>): void {
    Sentry.setContext(key, context);
  }

  /**
   * Mide el tiempo de ejecución de una función síncrona
   */
  measureSync<T>(name: string, fn: () => T): T {
    return measureFunction(name, fn);
  }

  /**
   * Mide el tiempo de ejecución de una función asíncrona
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return measureAsyncFunction(name, fn);
  }

  /**
   * Crea un checkpoint para debugging
   */
  addCheckpoint(name: string, data?: Record<string, unknown>): void {
    this.addBreadcrumb(`Checkpoint: ${name}`, 'debug', data);
  }

  /**
   * Reporta métricas personalizadas (como mensaje)
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.captureMessage(`Metric: ${name}`, 'info', {
      metric: { name, value, tags },
    });
  }

  /**
   * Captura información de performance
   */
  capturePerformance(name: string, duration: number, data?: Record<string, unknown>): void {
    this.captureMessage(`Performance: ${name}`, 'info', {
      performance: {
        name,
        duration,
        ...data,
      },
    });
  }

  /**
   * Wrapper para operaciones de base de datos
   */
  async wrapDatabaseOperation<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      this.addBreadcrumb(`DB Operation: ${operation}`, 'database', { table });

      const result = await this.measureAsync(`db.${operation}.${table}`, fn);

      const duration = Date.now() - startTime;
      this.capturePerformance(`Database ${operation}`, duration, { table });

      return result;
    } catch (error) {
      this.captureException(error as Error, {
        database: {
          operation,
          table,
          duration: Date.now() - startTime,
        },
      });
      throw error;
    }
  }

  /**
   * Wrapper para operaciones de API externa
   */
  async wrapExternalAPI<T>(service: string, endpoint: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    try {
      this.addBreadcrumb(`External API: ${service}`, 'http', { endpoint });

      const result = await this.measureAsync(`api.${service}`, fn);

      const duration = Date.now() - startTime;
      this.capturePerformance(`External API ${service}`, duration, { endpoint });

      return result;
    } catch (error) {
      this.captureException(error as Error, {
        externalAPI: {
          service,
          endpoint,
          duration: Date.now() - startTime,
        },
      });
      throw error;
    }
  }

  /**
   * Captura eventos de negocio importantes
   */
  captureBusinessEvent(event: string, data: Record<string, unknown>): void {
    this.captureMessage(`Business Event: ${event}`, 'info', {
      businessEvent: {
        event,
        ...data,
      },
    });
  }

  /**
   * Captura errores de validación (no críticos)
   */
  captureValidationError(field: string, value: unknown, rule: string): void {
    this.addBreadcrumb('Validation Error', 'validation', {
      field,
      value: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value),
      rule,
    });
  }
}
