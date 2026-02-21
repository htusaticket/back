// src/application/dashboard/services/dashboard.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IClassSessionRepository,
  CLASS_SESSION_REPOSITORY,
  IDailyChallengeRepository,
  DAILY_CHALLENGE_REPOSITORY,
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '@/core/interfaces';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { DashboardSummaryDto } from '../dto';
import {
  formatDayString,
  formatDateString,
  formatTimeRange,
  formatClassType,
} from '@/application/common/utils/date-formatter.util';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @Inject(CLASS_SESSION_REPOSITORY)
    private readonly classSessionRepository: IClassSessionRepository,
    @Inject(DAILY_CHALLENGE_REPOSITORY)
    private readonly dailyChallengeRepository: IDailyChallengeRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Obtener resumen del dashboard para el usuario
   */
  async getDashboardSummary(userId: string): Promise<DashboardSummaryDto> {
    // Ejecutar consultas en paralelo para mejorar performance
    const [nextClass, dailyChallengeData, continueLearning, notifications] = await Promise.all([
      this.getNextClass(userId),
      this.getDailyChallenge(userId),
      this.getContinueLearning(userId),
      this.getNotifications(userId),
    ]);

    return {
      nextClass,
      dailyChallenge: dailyChallengeData,
      continueLearning,
      notifications,
    };
  }

  /**
   * Obtener la próxima clase confirmada del usuario
   */
  private async getNextClass(userId: string) {
    const nextClass = await this.classSessionRepository.findNextConfirmedClass(userId);

    if (!nextClass) return null;

    return {
      id: nextClass.id,
      title: nextClass.title,
      type: formatClassType(nextClass.type),
      day: formatDayString(nextClass.startTime),
      date: formatDateString(nextClass.startTime),
      time: formatTimeRange(nextClass.startTime, nextClass.endTime),
      meetLink: nextClass.meetLink,
      materialsLink: nextClass.materialsLink,
    };
  }

  /**
   * Obtener información del challenge diario
   */
  private async getDailyChallenge(userId: string) {
    const todayChallenge = await this.dailyChallengeRepository.findTodayChallenge();

    if (!todayChallenge) return null;

    // Verificar si el usuario ya completó el challenge de hoy
    const progress = await this.dailyChallengeRepository.findUserProgress(
      userId,
      todayChallenge.id,
    );

    // Calcular el streak
    const streak = await this.dailyChallengeRepository.calculateStreak(userId);

    return {
      id: todayChallenge.id,
      title: todayChallenge.title,
      completed: progress?.completed || false,
      streak,
    };
  }

  /**
   * Obtener el último módulo/lección visto (no completado)
   * Busca la última lección accedida que no esté completada
   */
  private async getContinueLearning(userId: string) {
    const lastLesson = await this.prisma.userLessonProgress.findFirst({
      where: {
        userId,
        completed: false,
        lastAccessedAt: {
          not: null,
        },
      },
      include: {
        lesson: {
          include: {
            module: true,
          },
        },
      },
      orderBy: {
        lastAccessedAt: 'desc',
      },
    });

    if (!lastLesson) return null;

    return {
      lessonId: lastLesson.lesson.id,
      lessonTitle: lastLesson.lesson.title,
      moduleId: lastLesson.lesson.module.id,
      moduleTitle: lastLesson.lesson.module.title,
      contentUrl: lastLesson.lesson.contentUrl,
    };
  }

  /**
   * Obtener notificaciones no leídas (máx 3)
   */
  private async getNotifications(userId: string) {
    const notifications = await this.notificationRepository.findUnreadByUserId(userId, 3);

    return notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
    }));
  }
}
