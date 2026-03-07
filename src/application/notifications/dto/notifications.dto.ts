// src/application/notifications/dto/notifications.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationDto {
  @ApiProperty({ example: 'clxxxxxxxxxxxxxxxxxx' })
  id!: string;

  @ApiProperty({
    example: 'CLASS_CONFIRMED',
    enum: [
      'STRIKE_APPLIED',
      'CLASS_REMINDER',
      'MATERIAL_AVAILABLE',
      'CHALLENGE_FEEDBACK',
      'CLASS_CONFIRMED',
      'GENERAL',
    ],
  })
  type!: NotificationType;

  @ApiProperty({ example: 'Class Confirmed' })
  title!: string;

  @ApiProperty({ example: 'You have been enrolled in Advanced English Conversation' })
  message!: string;

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiPropertyOptional({ example: { classId: 1 } })
  data?: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-02-27T10:00:00.000Z' })
  createdAt!: Date;
}

export class NotificationsListDto {
  @ApiProperty({ type: [NotificationDto] })
  notifications!: NotificationDto[];

  @ApiProperty({ example: 5 })
  total!: number;

  @ApiProperty({ example: 3 })
  unreadCount!: number;
}

export class UnreadCountDto {
  @ApiProperty({ example: 3 })
  count!: number;
}

export class MarkReadResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Notification marked as read' })
  message!: string;
}
