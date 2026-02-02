import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { getEnvConfig } from '@/config/env.config';
import { captureError } from '@/config/sentry.config';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string | undefined;
  stack?: string | undefined;
  correlationId?: string | undefined;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const env = getEnvConfig();

    let status: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string | string[]) ?? exception.message;
        error = (responseObj.error as string) ?? exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = env.NODE_ENV === 'production' ? 'Error interno del servidor' : exception.message;
      error = exception.name;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Error interno del servidor';
      error = 'UnknownError';
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      correlationId: (request.headers['x-correlation-id'] as string) || undefined,
    };

    // Solo incluir stack trace en desarrollo
    if (env.NODE_ENV === 'development' && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    // Log del error
    const logContext = {
      statusCode: status,
      method: request.method,
      path: request.url,
      correlationId: errorResponse.correlationId,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${Array.isArray(message) ? message.join(', ') : message}`,
        exception instanceof Error ? exception.stack : undefined,
        logContext,
      );

      // Capturar errores 5xx en Sentry
      if (exception instanceof Error) {
        captureError(exception, {
          request: {
            method: request.method,
            url: request.url,
            headers: this.sanitizeHeaders(request.headers),
            body: request.body as Record<string, unknown>,
            query: request.query,
            params: request.params,
          },
          response: {
            statusCode: status,
          },
          correlationId: errorResponse.correlationId,
        });
      }
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${Array.isArray(message) ? message.join(', ') : message}`,
        logContext,
      );
    }

    response.status(status).json(errorResponse);
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };

    // Remover headers sensibles
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];

    return sanitized;
  }
}
