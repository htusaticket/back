import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Interfaz para el detalle de errores en las respuestas de la API
 */
export interface ErrorDetail {
  code?: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

/**
 * DTO genérico para todas las respuestas de la API
 * Este modelo estandariza el formato de respuesta para todas las operaciones
 */
export class ApiResponseDto<T> {
  @ApiProperty({
    example: true,
    description: 'Indica si la operación fue exitosa',
  })
  success: boolean;

  @ApiProperty({
    example: 'Operación completada exitosamente',
    description: 'Mensaje descriptivo del resultado',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Datos devueltos por la operación',
  })
  data?: T;

  @ApiPropertyOptional({
    example: '2023-10-15T14:30:00.000Z',
    description: 'Marca de tiempo de la respuesta',
  })
  timestamp: string = new Date().toISOString();

  @ApiPropertyOptional({
    example: null,
    description: 'Detalles del error en caso de fallo',
    nullable: true,
  })
  error?: ErrorDetail | null;

  constructor(success: boolean, message: string, data?: T, error?: ErrorDetail | null) {
    this.success = success;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
    if (error !== undefined) {
      this.error = error;
    }
  }

  /**
   * Método estático para crear una respuesta exitosa
   */
  static success<T>(message: string, data?: T): ApiResponseDto<T> {
    return new ApiResponseDto<T>(true, message, data);
  }

  /**
   * Método estático para crear una respuesta de error
   */
  static error<T>(message: string, error?: ErrorDetail | null): ApiResponseDto<T> {
    return new ApiResponseDto<T>(false, message, undefined, error);
  }
}
