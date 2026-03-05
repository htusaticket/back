// src/application/notifications/services/notifications.service.ts
import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { INotificationRepository, NOTIFICATION_REPOSITORY } from '@/core/interfaces';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { NotificationsListDto, NotificationDto, UnreadCountDto, MarkReadResponseDto } from '../dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Obtener todas las notificaciones del usuario
   */
  async getNotifications(userId: string, limit = 20): Promise<NotificationsListDto> {
    this.logger.debug(`Fetching notifications for user: ${userId}`);

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications: notifications.map(n => this.mapToDto(n)),
      total,
      unreadCount,
    };
  }

  /**
   * Obtener solo notificaciones no leídas
   */
  async getUnreadNotifications(userId: string, limit = 10): Promise<NotificationDto[]> {
    this.logger.debug(`Fetching unread notifications for user: ${userId}`);

    const notifications = await this.notificationRepository.findUnreadByUserId(userId, limit);
    return notifications.map(n => this.mapToDto(n));
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(userId: string): Promise<UnreadCountDto> {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(userId: string, notificationId: string): Promise<MarkReadResponseDto> {
    this.logger.debug(`Marking notification ${notificationId} as read for user: ${userId}`);

    // Verificar que la notificación pertenece al usuario
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.markAsRead(notificationId);

    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId: string): Promise<MarkReadResponseDto> {
    this.logger.debug(`Marking all notifications as read for user: ${userId}`);

    await this.notificationRepository.markAllAsRead(userId);

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  /**
   * Mapear entidad a DTO
   */
  private mapToDto(notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    data: unknown;
    createdAt: Date;
  }): NotificationDto {
    return {
      id: notification.id,
      type: notification.type as NotificationDto['type'],
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      data: notification.data as Record<string, unknown> | null,
      createdAt: notification.createdAt,
    };
  }
}
