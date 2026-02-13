// src/application/academy/dto/academy-overview.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class LessonDto {
  @ApiProperty({ example: 1, description: 'ID de la lección' })
  id!: number;

  @ApiProperty({ example: 'Introduction to English', description: 'Título de la lección' })
  title!: string;

  @ApiProperty({ example: '10 min', description: 'Duración de la lección' })
  duration!: string;

  @ApiProperty({ example: true, description: 'Si el usuario completó la lección' })
  completed!: boolean;
}

export class ModuleDto {
  @ApiProperty({ example: 1, description: 'ID del módulo' })
  id!: number;

  @ApiProperty({ example: 'Foundations & Goals', description: 'Título del módulo' })
  title!: string;

  @ApiProperty({ example: 'Start your journey...', description: 'Descripción del módulo' })
  description!: string;

  @ApiProperty({
    example: 'https://images.unsplash.com/photo-xxx',
    description: 'URL de la imagen del módulo',
  })
  image!: string;

  @ApiProperty({ example: 3, description: 'Total de lecciones en el módulo' })
  totalLessons!: number;

  @ApiProperty({ example: 2, description: 'Lecciones completadas por el usuario' })
  completedLessons!: number;

  @ApiProperty({ example: 66, description: 'Porcentaje de progreso (0-100)' })
  progress!: number;

  @ApiProperty({ type: [LessonDto], description: 'Lista de lecciones del módulo' })
  lessons!: LessonDto[];
}

export class AcademyStatsDto {
  @ApiProperty({ example: 52, description: 'Progreso general (0-100)' })
  overallProgress!: number;

  @ApiProperty({ example: 7, description: 'Lecciones completadas' })
  lessonsCompleted!: number;

  @ApiProperty({ example: 13, description: 'Total de lecciones' })
  totalLessons!: number;

  @ApiProperty({ example: '3.2h', description: 'Tiempo total de aprendizaje' })
  totalTime!: string;
}

export class AcademyOverviewDto {
  @ApiProperty({ type: AcademyStatsDto, description: 'Estadísticas globales' })
  stats!: AcademyStatsDto;

  @ApiProperty({ type: [ModuleDto], description: 'Lista de módulos con progreso' })
  modules!: ModuleDto[];
}
