import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { getEnvConfig } from './env.config';

export function initializeSentry(): void {
  const env = getEnvConfig();

  // Solo inicializar Sentry si tenemos DSN configurado
  if (!env.SENTRY_DSN) {
    if (env.NODE_ENV === 'development') {
      console.log('🔍 Sentry DSN no configurado, saltando inicialización');
    }
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,

    // Release tracking para deployment
    release: process.env.npm_package_version || '1.0.0',

    // Integrations
    integrations: [
      // Profiling de performance (opcional)
      nodeProfilingIntegration(),

      // Captura automática de errores no manejados
      Sentry.anrIntegration({ captureStackTrace: true }),

      // Instrumentación automática
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
      Sentry.prismaIntegration(),
    ],

    // Performance monitoring (reducido en desarrollo para menos logs)
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0.1, // 10% en ambos

    // Profiling (deshabilitado en desarrollo)
    profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0.0,

    // Configuración de contexto
    beforeSend(event, hint) {
      // Filtrar errores conocidos o de terceros
      if (event.exception) {
        const error = hint.originalException;

        // No reportar errores de validación (400)
        if (error && typeof error === 'object' && 'status' in error && error.status === 400) {
          return null;
        }

        // No reportar errores de autenticación (401)
        if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
          return null;
        }
      }

      return event;
    },

    // Configurar tags por defecto
    initialScope: {
      tags: {
        component: 'backend',
        service: 'zazcreditos-api',
      },
    },

    // Debug deshabilitado para reducir logs
    debug: false,

    // Configuración de servidor
    serverName: process.env.HOSTNAME || 'zazcreditos-backend',
  });

  if (env.NODE_ENV === 'development') {
    console.log(`✅ Sentry inicializado para entorno: ${env.NODE_ENV}`);
  }
}

// Función para capturar errores manualmente
export function captureError(error: Error, context?: Record<string, any>): void {
  Sentry.withScope(scope => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value as Record<string, any>);
      });
    }
    Sentry.captureException(error);
  });
}

// Función para capturar mensajes
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>,
): void {
  Sentry.withScope(scope => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value as Record<string, any>);
      });
    }
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

// Función para agregar contexto de usuario
export function setUserContext(user: { id: string; email?: string; username?: string }): void {
  Sentry.setUser({
    id: user.id,
    ...(user.email && { email: user.email }),
    ...(user.username && { username: user.username }),
  });
}

// Función para agregar breadcrumbs personalizados
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    timestamp: Date.now() / 1000,
    ...(data && { data }),
  });
}

// Performance monitoring helpers
export function measureFunction<T>(name: string, fn: () => T): T {
  const startTime = Date.now();
  try {
    const result = fn();
    const duration = Date.now() - startTime;
    captureMessage(`Performance: ${name}`, 'info', { duration });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    captureError(error as Error, { operation: name, duration });
    throw error;
  }
}

export async function measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    captureMessage(`Performance: ${name}`, 'info', { duration });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    captureError(error as Error, { operation: name, duration });
    throw error;
  }
}
