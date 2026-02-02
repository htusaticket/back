import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const correlationId = request.headers['x-correlation-id'] as string;

    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;

          if (duration > 1000) {
            this.logger.warn(`Slow request detected: ${method} ${url} took ${duration}ms`, {
              method,
              url,
              duration,
              correlationId,
              threshold: 1000,
            });
          } else if (duration > 500) {
            this.logger.log(`${method} ${url} completed in ${duration}ms`, {
              method,
              url,
              duration,
              correlationId,
            });
          }
        },
        error: error => {
          const duration = Date.now() - start;
          this.logger.error(`Request failed: ${method} ${url} after ${duration}ms`, {
            method,
            url,
            duration,
            correlationId,
            error: error.message,
          });
        },
      }),
    );
  }
}
