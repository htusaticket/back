// src/application/admin/services/admin-dashboard.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { UserStatus, UserRole, SubmissionStatus } from '@prisma/client';
import {
  AdminDashboardResponseDto,
  AdminNotificationsResponseDto,
  DashboardStatsDto,
  RecentActivityDto,
  AdminNotificationDto,
} from '../dto/admin-dashboard.dto';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtener estadísticas y actividad reciente para el dashboard de admin
   */
  async getDashboard(period?: 'today' | 'week'): Promise<AdminDashboardResponseDto> {
    this.logger.debug(`Fetching admin dashboard data with period: ${period || 'today'}`);

    const [stats, recentActivity] = await Promise.all([
      this.getStats(period || 'today'),
      this.getRecentActivity(),
    ]);

    return {
      stats,
      recentActivity,
    };
  }

  /**
   * Obtener estadísticas del sistema
   */
  private async getStats(period: 'today' | 'week'): Promise<DashboardStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate week start (Monday of current week)
    const weekStart = new Date(today);
    const dayOfWeek = weekStart.getDay(); // 0=Sunday, 1=Monday, ...
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - diffToMonday);

    // Calculate week end (Sunday end of current week)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Use week range for weekly stats, today for daily
    const periodStart = period === 'week' ? weekStart : today;
    const periodEnd = period === 'week' ? weekEnd : tomorrow;

    const [
      totalUsers,
      pendingUsers,
      activeUsers,
      activeJobs,
      classesInPeriod,
      totalApplications,
      pendingApplications,
      activeModules,
      pendingCorrections,
    ] = await Promise.all([
      // Total users (only students)
      this.prisma.user.count({
        where: { role: UserRole.USER },
      }),
      // Pending users
      this.prisma.user.count({
        where: { status: UserStatus.PENDING, role: UserRole.USER },
      }),
      // Active users
      this.prisma.user.count({
        where: { status: UserStatus.ACTIVE, role: UserRole.USER },
      }),
      // Active jobs (using JobOffer model)
      this.prisma.jobOffer.count({
        where: { isActive: true },
      }),
      // Classes in period (today or this week) - only upcoming/ongoing, not finished
      this.prisma.classSession.count({
        where: {
          startTime: {
            gte: periodStart,
            lt: periodEnd,
          },
          endTime: {
            gt: new Date(), // Only count classes that haven't ended yet
          },
        },
      }),
      // Total applications (using JobApplication model)
      this.prisma.jobApplication.count(),
      // Pending applications (APPLIED status)
      this.prisma.jobApplication.count({
        where: { status: 'APPLIED' },
      }),
      // Active modules (instead of courses)
      this.prisma.module.count(),
      // Pending corrections (using UserDailyChallengeProgress)
      this.prisma.userDailyChallengeProgress.count({
        where: { status: SubmissionStatus.PENDING },
      }),
    ]);

    return {
      totalUsers,
      pendingUsers,
      activeUsers,
      activeJobs,
      classesToday: classesInPeriod,
      totalApplications,
      pendingApplications,
      activeCourses: activeModules,
      pendingCorrections,
    };
  }

  /**
   * Obtener actividad reciente del sistema
   */
  private async getRecentActivity(): Promise<RecentActivityDto[]> {
    const activities: RecentActivityDto[] = [];

    // Get recent registrations
    const recentUsers = await this.prisma.user.findMany({
      where: { role: UserRole.USER },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
      },
    });

    for (const user of recentUsers) {
      activities.push({
        id: `user-${user.id}`,
        type: user.status === UserStatus.PENDING ? 'NEW_USER' : 'USER_APPROVED',
        title: user.status === UserStatus.PENDING ? 'Nuevo registro pendiente' : 'Usuario aprobado',
        description: `${user.firstName} ${user.lastName} ${user.status === UserStatus.PENDING ? 'se registró y espera aprobación' : 'fue activado'}`,
        createdAt: user.createdAt,
      });
    }

    // Get recent job applications (using JobApplication model)
    const recentApplications = await this.prisma.jobApplication.findMany({
      orderBy: { appliedAt: 'desc' },
      take: 3,
      include: {
        user: { select: { firstName: true, lastName: true } },
        jobOffer: { select: { title: true } },
      },
    });

    for (const app of recentApplications) {
      activities.push({
        id: `app-${app.id}`,
        type: 'JOB_APPLICATION',
        title: 'Nueva aplicación a trabajo',
        description: `${app.user.firstName} ${app.user.lastName} aplicó a "${app.jobOffer.title}"`,
        createdAt: app.appliedAt,
      });
    }

    // Get recent classes (using startTime and title fields)
    const recentClasses = await this.prisma.classSession.findMany({
      where: {
        startTime: {
          lt: new Date(),
        },
      },
      orderBy: { startTime: 'desc' },
      take: 2,
      select: {
        id: true,
        title: true,
        startTime: true,
      },
    });

    for (const cls of recentClasses) {
      activities.push({
        id: `class-${cls.id}`,
        type: 'CLASS_FINISHED',
        title: 'Clase finalizada',
        description: `"${cls.title}" terminó`,
        createdAt: cls.startTime,
      });
    }

    // Sort by date and limit to 10
    return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);
  }

  /**
   * Obtener notificaciones para admin/superadmin
   */
  async getNotifications(userId: string): Promise<AdminNotificationsResponseDto> {
    this.logger.debug(`Fetching notifications for admin: ${userId}`);

    // For admin notifications, we'll create a virtual notification list
    // based on system events that admins should know about
    const notifications: AdminNotificationDto[] = [];

    // Get pending users as notifications
    const pendingUsers = await this.prisma.user.findMany({
      where: { status: UserStatus.PENDING, role: UserRole.USER },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
    });

    for (const user of pendingUsers) {
      notifications.push({
        id: `pending-${user.id}`,
        type: 'NEW_REGISTRATION',
        title: 'Nuevo registro pendiente',
        message: `${user.firstName} ${user.lastName} (${user.email}) está esperando aprobación`,
        isRead: false,
        createdAt: user.createdAt,
        data: { userId: user.id },
      });
    }

    // Get recent modules created (last 7 days) - instead of courses
    const recentModules = await this.prisma.module.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    for (const module of recentModules) {
      notifications.push({
        id: `module-${module.id}`,
        type: 'NEW_COURSE',
        title: 'Nuevo módulo creado',
        message: `El módulo "${module.title}" fue creado`,
        isRead: false,
        createdAt: module.createdAt,
        data: { moduleId: module.id },
      });
    }

    // Get pending submissions (using UserDailyChallengeProgress)
    const pendingSubmissions = await this.prisma.userDailyChallengeProgress.findMany({
      where: { status: SubmissionStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { firstName: true, lastName: true } },
        challenge: { select: { title: true } },
      },
    });

    for (const sub of pendingSubmissions) {
      notifications.push({
        id: `submission-${sub.id}`,
        type: 'NEW_SUBMISSION',
        title: 'Entrega pendiente de corrección',
        message: `${sub.user.firstName} ${sub.user.lastName} envió "${sub.challenge.title}"`,
        isRead: false,
        createdAt: sub.createdAt,
        data: { submissionId: sub.id },
      });
    }

    // Sort by date
    const sortedNotifications = notifications.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return {
      notifications: sortedNotifications,
      unreadCount: sortedNotifications.filter(n => !n.isRead).length,
    };
  }

  /**
   * Marcar notificación como leída
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    this.logger.debug(`Marking notification as read: ${notificationId}`);

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    this.logger.debug(`Marking all notifications as read for user: ${userId}`);

    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
