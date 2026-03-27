// src/infrastructure/persistence/repositories/academy.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  IAcademyRepository,
  Module,
  Lesson,
  LessonResource,
  UserLessonProgress,
  ModuleWithProgress,
  LessonWithProgress,
} from '@/core/interfaces';

@Injectable()
export class AcademyRepository implements IAcademyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllModules(): Promise<Module[]> {
    return this.prisma.module.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async findModuleById(moduleId: number): Promise<Module | null> {
    return this.prisma.module.findUnique({
      where: { id: moduleId },
    });
  }

  async findModulesWithProgress(userId: string): Promise<ModuleWithProgress[]> {
    const modules = await this.prisma.module.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          where: { status: 'PUBLISHED' },
          orderBy: { order: 'asc' },
          include: {
            userProgress: {
              where: { userId },
            },
          },
        },
      },
    });

    return modules.map(module => {
      const totalLessons = module.lessons.length;
      const completedLessons = module.lessons.filter(
        lesson => lesson.userProgress[0]?.completed === true,
      ).length;
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        id: module.id,
        title: module.title,
        description: module.description,
        image: module.image,
        order: module.order,
        visibleForSkillBuilder: module.visibleForSkillBuilder,
        visibleForSkillBuilderLive: module.visibleForSkillBuilderLive,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
        totalLessons,
        completedLessons,
        progress,
        lessons: module.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration,
          contentUrl: lesson.contentUrl,
          order: lesson.order,
          moduleId: lesson.moduleId,
          completed: lesson.userProgress[0]?.completed || false,
        })),
      };
    });
  }

  async findLessonById(
    lessonId: number,
  ): Promise<(Lesson & { resources: LessonResource[]; module: Module }) | null> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        resources: {
          orderBy: { createdAt: 'asc' },
        },
        module: true,
      },
    });

    if (!lesson) return null;

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      contentUrl: lesson.contentUrl,
      order: lesson.order,
      moduleId: lesson.moduleId,
      resources: lesson.resources.map(r => ({
        id: r.id,
        title: r.title,
        fileUrl: r.fileUrl,
        type: r.type,
        size: r.size,
        lessonId: r.lessonId,
        createdAt: r.createdAt,
      })),
      module: {
        id: lesson.module.id,
        title: lesson.module.title,
        description: lesson.module.description,
        image: lesson.module.image,
        order: lesson.module.order,
        createdAt: lesson.module.createdAt,
        updatedAt: lesson.module.updatedAt,
      },
    };
  }

  async findLessonsWithProgress(moduleId: number, userId: string): Promise<LessonWithProgress[]> {
    const lessons = await this.prisma.lesson.findMany({
      where: { moduleId, status: 'PUBLISHED' },
      orderBy: { order: 'asc' },
      include: {
        userProgress: {
          where: { userId },
        },
      },
    });

    return lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      contentUrl: lesson.contentUrl,
      order: lesson.order,
      moduleId: lesson.moduleId,
      completed: lesson.userProgress[0]?.completed || false,
    }));
  }

  async findLessonProgress(userId: string, lessonId: number): Promise<UserLessonProgress | null> {
    return this.prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: { userId, lessonId },
      },
    });
  }

  async toggleLessonComplete(userId: string, lessonId: number): Promise<UserLessonProgress> {
    const existing = await this.prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: { userId, lessonId },
      },
    });

    if (existing) {
      // Toggle el estado actual
      return this.prisma.userLessonProgress.update({
        where: { id: existing.id },
        data: {
          completed: !existing.completed,
          lastAccessedAt: new Date(),
        },
      });
    } else {
      // Crear nuevo progreso marcado como completado
      return this.prisma.userLessonProgress.create({
        data: {
          userId,
          lessonId,
          completed: true,
          lastAccessedAt: new Date(),
        },
      });
    }
  }

  async trackLessonAccess(userId: string, lessonId: number): Promise<void> {
    await this.prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      update: {
        lastAccessedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        completed: false,
        lastAccessedAt: new Date(),
      },
    });
  }

  async updateModuleProgress(userId: string, moduleId: number): Promise<number> {
    // Calcular progreso actual
    const lessons = await this.prisma.lesson.findMany({
      where: { moduleId, status: 'PUBLISHED' },
      include: {
        userProgress: {
          where: { userId },
        },
      },
    });

    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(l => l.userProgress[0]?.completed).length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Upsert del progreso del módulo
    await this.prisma.userModuleProgress.upsert({
      where: {
        userId_moduleId: { userId, moduleId },
      },
      update: { progress },
      create: {
        userId,
        moduleId,
        progress,
      },
    });

    return progress;
  }

  async getUserStats(userId: string): Promise<{
    overallProgress: number;
    lessonsCompleted: number;
    totalLessons: number;
    totalTimeMinutes: number;
  }> {
    // Obtener todas las lecciones de módulos publicados con progreso del usuario
    const lessons = await this.prisma.lesson.findMany({
      where: {
        module: { status: 'PUBLISHED' },
        status: 'PUBLISHED',
      },
      include: {
        userProgress: {
          where: { userId },
        },
      },
    });

    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(l => l.userProgress[0]?.completed).length;
    const overallProgress =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Calcular tiempo total de lecciones completadas
    let totalTimeMinutes = 0;
    lessons
      .filter(l => l.userProgress[0]?.completed)
      .forEach(lesson => {
        // Parsear duración como "10 min" o "1h 30min"
        const duration = lesson.duration.toLowerCase();
        const hourMatch = duration.match(/(\d+)\s*h/);
        const minMatch = duration.match(/(\d+)\s*min/);

        if (hourMatch?.[1]) {
          totalTimeMinutes += parseInt(hourMatch[1], 10) * 60;
        }
        if (minMatch?.[1]) {
          totalTimeMinutes += parseInt(minMatch[1], 10);
        }
      });

    return {
      overallProgress,
      lessonsCompleted: completedLessons,
      totalLessons,
      totalTimeMinutes,
    };
  }

  async findLessonResources(lessonId: number): Promise<LessonResource[]> {
    return this.prisma.lessonResource.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAdjacentLessons(
    lessonId: number,
    moduleId: number,
  ): Promise<{
    previous: { id: number; title: string } | null;
    next: { id: number; title: string } | null;
  }> {
    const currentLesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { order: true },
    });

    if (!currentLesson) {
      return { previous: null, next: null };
    }

    const [previous, next] = await Promise.all([
      this.prisma.lesson.findFirst({
        where: {
          moduleId,
          status: 'PUBLISHED',
          order: { lt: currentLesson.order },
        },
        orderBy: { order: 'desc' },
        select: { id: true, title: true },
      }),
      this.prisma.lesson.findFirst({
        where: {
          moduleId,
          status: 'PUBLISHED',
          order: { gt: currentLesson.order },
        },
        orderBy: { order: 'asc' },
        select: { id: true, title: true },
      }),
    ]);

    return { previous, next };
  }
}
