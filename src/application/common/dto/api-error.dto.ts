import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para respuestas de error estándar en la API
 * Este modelo se utiliza para todas las respuestas de error HTTP
 */
export class ApiErrorDto {
  @ApiProperty({
    example: false,
    description: 'Indicador de éxito (siempre falso para errores)',
  })
  success: boolean = false;

  @ApiProperty({
    example: 'Ha ocurrido un error al procesar su solicitud',
    description: 'Mensaje descriptivo del error',
  })
  message: string = '';

  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 400,
  })
  statusCode: number = 500;

  @ApiPropertyOptional({
    example: 'BAD_REQUEST',
    description: 'Código de error específico de la aplicación',
  })
  code?: string;

  @ApiPropertyOptional({
    description: 'Información detallada del error',
    example: {
      field: 'name',
      message: 'El nombre no puede estar vacío',
      constraints: {
        isNotEmpty: 'El nombre es requerido',
        isString: 'El nombre debe ser una cadena de texto',
      },
    },
  })
  details?: Record<string, unknown>;

  @ApiProperty({
    example: '2023-10-15T14:30:00.000Z',
    description: 'Marca de tiempo del error',
  })
  timestamp: string = new Date().toISOString();

  @ApiPropertyOptional({
    example: '/api/service-types',
    description: 'Ruta donde ocurrió el error',
  })
  path?: string;
}
