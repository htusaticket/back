// src/core/entities/notification.entity.ts
import type { NotificationType } from '@prisma/client';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data: unknown; // Prisma JsonValue
  createdAt: Date;
}
