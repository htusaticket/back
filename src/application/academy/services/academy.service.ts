// src/application/academy/services/academy.service.ts
import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { IAcademyRepository, ACADEMY_REPOSITORY } from '@/core/interfaces';
import { AcademyOverviewDto, LessonDetailDto, ToggleLessonCompleteDto } from '../dto';

@Injectable()
export class AcademyService {
  private readonly logger = new Logger(AcademyService.name);

  constructor(
    @Inject(ACADEMY_REPOSITORY)
    private readonly academyRepository: IAcademyRepository,
  ) {}

  /**
   * Obtener vista general de la Academy con estadísticas y módulos
   */
  async getOverview(userId: string): Promise<AcademyOverviewDto> {
    this.logger.debug(`Getting academy overview for user: ${userId}`);

    const [stats, modules] = await Promise.all([
      this.academyRepository.getUserStats(userId),
      this.academyRepository.findModulesWithProgress(userId),
    ]);

    // Formatear tiempo total
    const totalTime = this.formatTime(stats.totalTimeMinutes);

    return {
      stats: {
        overallProgress: stats.overallProgress,
        lessonsCompleted: stats.lessonsCompleted,
        totalLessons: stats.totalLessons,
        totalTime,
      },
      modules: modules.map(module => ({
        id: module.id,
        title: module.title,
        description: module.description,
        image: module.image,
        totalLessons: module.totalLessons,
        completedLessons: module.completedLessons,
        progress: module.progress,
        lessons: module.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          duration: lesson.duration,
          completed: lesson.completed,
        })),
      })),
    };
  }

  /**
   * Obtener detalle de una lección específica
   */
  async getLessonDetail(lessonId: number, userId: string): Promise<LessonDetailDto> {
    this.logger.debug(`Getting lesson detail: ${lessonId} for user: ${userId}`);

    const lesson = await this.academyRepository.findLessonById(lessonId);

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Obtener progreso del usuario y lecciones adyacentes
    const [progress, adjacent] = await Promise.all([
      this.academyRepository.findLessonProgress(userId, lessonId),
      this.academyRepository.findAdjacentLessons(lessonId, lesson.moduleId),
    ]);

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      contentUrl: lesson.contentUrl,
      completed: progress?.completed || false,
      module: {
        id: lesson.module.id,
        title: lesson.module.title,
      },
      resources: lesson.resources.map(r => ({
        id: r.id,
        title: r.title,
        fileUrl: r.fileUrl,
        type: r.type,
        size: r.size,
      })),
      previousLesson: adjacent.previous,
      nextLesson: adjacent.next,
    };
  }

  /**
   * Alternar el estado de completado de una lección
   */
  async toggleLessonComplete(lessonId: number, userId: string): Promise<ToggleLessonCompleteDto> {
    this.logger.debug(`Toggling lesson complete: ${lessonId} for user: ${userId}`);

    // Verificar que la lección existe
    const lesson = await this.academyRepository.findLessonById(lessonId);

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    // Toggle el progreso
    const progress = await this.academyRepository.toggleLessonComplete(userId, lessonId);

    // Actualizar progreso del módulo
    const moduleProgress = await this.academyRepository.updateModuleProgress(
      userId,
      lesson.moduleId,
    );

    const message = progress.completed
      ? 'Lesson marked as completed'
      : 'Lesson marked as not completed';

    return {
      completed: progress.completed,
      moduleProgress,
      message,
    };
  }

  /**
   * Formatea minutos a string legible
   */
  private formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}.${Math.round((remainingMinutes / 60) * 10)}h`;
  }
}
