import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException, // Importante para manejo de errores
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators'; // Importa tap y catchError
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP'); // Logger con contexto HTTP

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now(); // Momento de inicio
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>(); // Obtenemos el objeto Response

    const { method, originalUrl } = request;
    const userAgent = request.get('user-agent') || 'N/A';
    const origin = request.get('origin') || 'N/A';

    // El observable 'next.handle()' representa la ejecución del controlador de ruta
    return next.handle().pipe(
      tap(() => {
        // Este código se ejecuta DESPUÉS de que el controlador termina SIN errores
        const statusCode = response.statusCode; // El código de estado ya debería estar establecido
        const delay = Date.now() - now; // Calcula la duración

        // Loguea la línea única con info de req y res
        this.logger.log(`${method} ${originalUrl} ${statusCode} ${delay}ms - Origin: ${origin}`);
      }),
      catchError(error => {
        // Este código se ejecuta SI el controlador lanza un error
        // Determina el código de estado del error
        const statusCode = error instanceof HttpException ? error.getStatus() : 500;
        const delay = Date.now() - now; // Calcula la duración

        // Loguea la línea única para errores
        this.logger.error(
          `${method} ${originalUrl} ${statusCode} ${delay}ms - Error: ${error.message} - Origin: ${origin} - Agent: ${userAgent}`,
          // Opcional: loguear el stack trace para errores internos del servidor
          // statusCode >= 500 ? error.stack : undefined,
        );

        // Es importante re-lanzar el error para que NestJS lo maneje
        return throwError(() => error);
      }),
    );
  }
}
