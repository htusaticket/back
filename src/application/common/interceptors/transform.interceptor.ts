import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    return next.handle().pipe(
      map(data => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();

        const statusCode = response.statusCode;
        const isSuccess = statusCode >= 200 && statusCode < 300;

        // Skip for file downloads and other non-JSON responses
        const contentType = response.getHeader('content-type');
        if (contentType && !contentType.includes('application/json')) {
          return data;
        }

        // Si ya es una instancia de ApiResponseDto, devolverla tal cual
        if (data instanceof ApiResponseDto) {
          return data;
        }

        // Caso contrario, crear una nueva respuesta estándar
        return new ApiResponseDto(
          isSuccess,
          isSuccess ? 'Operation successful' : 'Operation failed',
          isSuccess ? data : null,
        );
      }),
    );
  }
}
