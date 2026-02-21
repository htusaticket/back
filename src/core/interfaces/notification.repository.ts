// src/core/interfaces/notification.repository.ts
import type { Notification } from '../entities/notification.entity';
import type { NotificationType } from '@prisma/client';

export const NOTIFICATION_REPOSITORY = 'NOTIFICATION_REPOSITORY';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: unknown; // Prisma JsonValue
}

export interface INotificationRepository {
  /**
   * Crear una notificación
   */
  create(data: CreateNotificationDto): Promise<Notification>;

  /**
   * Obtener notificaciones no leídas de un usuario (limitadas)
   */
  findUnreadByUserId(userId: string, limit?: number): Promise<Notification[]>;

  /**
   * Marcar notificación como leída
   */
  markAsRead(id: string): Promise<void>;

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   */
  markAllAsRead(userId: string): Promise<void>;
}
