// src/core/interfaces/academy.repository.ts
import type {
  Module,
  Lesson,
  LessonResource,
  UserLessonProgress,
  ModuleWithProgress,
  LessonWithProgress,
} from '../entities/module.entity';

export const ACADEMY_REPOSITORY = 'ACADEMY_REPOSITORY';

export interface IAcademyRepository {
  /**
   * Obtener todos los módulos ordenados
   */
  findAllModules(): Promise<Module[]>;

  /**
   * Obtener módulo por ID con lecciones
   */
  findModuleById(moduleId: number): Promise<Module | null>;

  /**
   * Obtener módulos con progreso del usuario
   */
  findModulesWithProgress(userId: string): Promise<ModuleWithProgress[]>;

  /**
   * Obtener lección por ID con recursos
   */
  findLessonById(
    lessonId: number,
  ): Promise<(Lesson & { resources: LessonResource[]; module: Module }) | null>;

  /**
   * Obtener lecciones de un módulo con progreso del usuario
   */
  findLessonsWithProgress(moduleId: number, userId: string): Promise<LessonWithProgress[]>;

  /**
   * Obtener progreso de una lección específica
   */
  findLessonProgress(userId: string, lessonId: number): Promise<UserLessonProgress | null>;

  /**
   * Marcar lección como completada o no completada
   */
  toggleLessonComplete(userId: string, lessonId: number): Promise<UserLessonProgress>;

  /**
   * Actualizar el progreso del módulo basado en lecciones completadas
   */
  updateModuleProgress(userId: string, moduleId: number): Promise<number>;

  /**
   * Obtener estadísticas globales del usuario
   */
  getUserStats(userId: string): Promise<{
    overallProgress: number;
    lessonsCompleted: number;
    totalLessons: number;
    totalTimeMinutes: number;
  }>;

  /**
   * Obtener recursos de una lección
   */
  findLessonResources(lessonId: number): Promise<LessonResource[]>;

  /**
   * Obtener lecciones adyacentes (previous/next)
   */
  findAdjacentLessons(
    lessonId: number,
    moduleId: number,
  ): Promise<{
    previous: { id: number; title: string } | null;
    next: { id: number; title: string } | null;
  }>;

  /**
   * Track lesson access for "Continue Learning" on dashboard.
   * Upserts UserLessonProgress with lastAccessedAt without changing completed status.
   */
  trackLessonAccess(userId: string, lessonId: number): Promise<void>;
}
