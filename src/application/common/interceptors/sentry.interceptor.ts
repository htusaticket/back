import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';
import type { Request, Response } from 'express';
import { captureError, addBreadcrumb, setUserContext } from '@/config/sentry.config';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email?: string;
    username?: string;
  };
}

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();

    // Configurar contexto de la request
    const correlationId = request.headers['x-correlation-id'] as string;

    // Agregar contexto inicial
    Sentry.setContext('request', {
      method: request.method,
      url: request.url,
      correlationId,
    });

    // Agregar breadcrumb de inicio de request
    addBreadcrumb(`${request.method} ${request.url}`, 'http', {
      method: request.method,
      url: request.url,
      correlationId,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    // Configurar contexto de usuario si está disponible
    if (request.user) {
      setUserContext({
        id: request.user.id,
        ...(request.user.email && { email: request.user.email }),
        ...(request.user.username && { username: request.user.username }),
      });
    }

    return next.handle().pipe(
      tap(() => {
        // Agregar breadcrumb de respuesta exitosa
        addBreadcrumb(`Response ${response.statusCode}`, 'http.response', {
          statusCode: response.statusCode,
          correlationId,
        });
      }),
      catchError((error: Error) => {
        // Solo capturar errores 5xx (errores del servidor)
        if (error instanceof HttpException) {
          const status = error.getStatus();

          if (status >= 500) {
            // Error del servidor - capturar en Sentry
            captureError(error, {
              request: {
                method: request.method,
                url: request.url,
                headers: this.sanitizeHeaders(request.headers),
                body: request.body,
                query: request.query,
                params: request.params,
              },
              response: {
                statusCode: status,
              },
              user: request.user
                ? {
                    id: request.user.id,
                    email: request.user.email,
                  }
                : undefined,
              correlationId,
            });
          } else {
            // Error del cliente (4xx) - solo breadcrumb
            addBreadcrumb(`Client error ${status}: ${error.message}`, 'http.error', {
              statusCode: status,
              error: error.message,
              correlationId,
            });
          }
        } else {
          // Error no HTTP - capturar en Sentry
          captureError(error, {
            request: {
              method: request.method,
              url: request.url,
            },
            correlationId,
          });
        }

        return throwError(() => error);
      }),
    );
  }

  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...headers };

    // Remover headers sensibles
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];

    return sanitized;
  }
}
