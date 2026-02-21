// src/application/academy/dto/lesson.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ResourceDto {
  @ApiProperty({ example: 1, description: 'ID del recurso' })
  id!: number;

  @ApiProperty({ example: 'Lesson Transcript.pdf', description: 'Nombre del recurso' })
  title!: string;

  @ApiProperty({ example: 'https://storage.googleapis.com/...', description: 'URL del archivo' })
  fileUrl!: string;

  @ApiProperty({ enum: ['PDF', 'LINK', 'VIDEO', 'DOCUMENT'], description: 'Tipo de recurso' })
  type!: string;

  @ApiProperty({ example: '245 KB', description: 'Tamaño del archivo', required: false })
  size!: string | null;
}

export class AdjacentLessonDto {
  @ApiProperty({ example: 1, description: 'ID de la lección' })
  id!: number;

  @ApiProperty({ example: 'Previous Lesson Title', description: 'Título de la lección' })
  title!: string;
}

export class LessonDetailDto {
  @ApiProperty({ example: 1, description: 'ID de la lección' })
  id!: number;

  @ApiProperty({ example: 'Small Talk Techniques', description: 'Título de la lección' })
  title!: string;

  @ApiProperty({
    example: 'Learn effective techniques...',
    description: 'Descripción de la lección',
  })
  description!: string | null;

  @ApiProperty({ example: '18 min', description: 'Duración de la lección' })
  duration!: string;

  @ApiProperty({
    example: 'https://www.youtube.com/embed/xxx',
    description: 'URL del contenido (video)',
  })
  contentUrl!: string | null;

  @ApiProperty({ example: true, description: 'Si el usuario completó la lección' })
  completed!: boolean;

  @ApiProperty({ description: 'Información del módulo' })
  module!: {
    id: number;
    title: string;
  };

  @ApiProperty({ type: [ResourceDto], description: 'Recursos descargables' })
  resources!: ResourceDto[];

  @ApiProperty({ type: AdjacentLessonDto, required: false, description: 'Lección anterior' })
  previousLesson!: AdjacentLessonDto | null;

  @ApiProperty({ type: AdjacentLessonDto, required: false, description: 'Lección siguiente' })
  nextLesson!: AdjacentLessonDto | null;
}

export class ToggleLessonCompleteDto {
  @ApiProperty({ example: true, description: 'Nuevo estado de completado' })
  completed!: boolean;

  @ApiProperty({ example: 66, description: 'Nuevo progreso del módulo (0-100)' })
  moduleProgress!: number;

  @ApiProperty({ example: 'Lesson marked as completed', description: 'Mensaje de confirmación' })
  message!: string;
}
