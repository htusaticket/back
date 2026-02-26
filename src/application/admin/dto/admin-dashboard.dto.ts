// src/application/admin/dto/admin-dashboard.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== DASHBOARD STATS ====================

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total de usuarios registrados' })
  totalUsers!: number;

  @ApiProperty({ description: 'Usuarios pendientes de aprobación' })
  pendingUsers!: number;

  @ApiProperty({ description: 'Usuarios activos' })
  activeUsers!: number;

  @ApiProperty({ description: 'Trabajos activos publicados' })
  activeJobs!: number;

  @ApiProperty({ description: 'Clases programadas para hoy' })
  classesToday!: number;

  @ApiProperty({ description: 'Total de aplicaciones a trabajos' })
  totalApplications!: number;

  @ApiProperty({ description: 'Aplicaciones pendientes de revisión' })
  pendingApplications!: number;

  @ApiProperty({ description: 'Cursos activos en la academia' })
  activeCourses!: number;

  @ApiProperty({ description: 'Challenges pendientes de corrección' })
  pendingCorrections!: number;
}

export class RecentActivityDto {
  @ApiProperty({ description: 'ID de la actividad' })
  id!: string;

  @ApiProperty({
    description: 'Tipo de actividad',
    enum: [
      'NEW_USER',
      'JOB_APPLICATION',
      'CLASS_FINISHED',
      'NEW_COURSE',
      'USER_APPROVED',
      'NEW_SUBMISSION',
    ],
  })
  type!: string;

  @ApiProperty({ description: 'Título de la actividad' })
  title!: string;

  @ApiProperty({ description: 'Descripción de la actividad' })
  description!: string;

  @ApiProperty({ description: 'Fecha de la actividad' })
  createdAt!: Date;
}

export class AdminDashboardResponseDto {
  @ApiProperty({ type: DashboardStatsDto })
  stats!: DashboardStatsDto;

  @ApiProperty({ type: [RecentActivityDto] })
  recentActivity!: RecentActivityDto[];
}

// ==================== ADMIN NOTIFICATIONS ====================

export class AdminNotificationDto {
  @ApiProperty({ description: 'ID de la notificación' })
  id!: string;

  @ApiProperty({
    description: 'Tipo de notificación',
    enum: ['NEW_REGISTRATION', 'NEW_COURSE', 'NEW_SUBMISSION', 'USER_SUSPENDED', 'SYSTEM'],
  })
  type!: string;

  @ApiProperty({ description: 'Título de la notificación' })
  title!: string;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  message!: string;

  @ApiProperty({ description: 'Si la notificación ha sido leída' })
  isRead!: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;

  @ApiPropertyOptional({ description: 'Datos adicionales (userId, courseId, etc)' })
  data?: Record<string, unknown>;
}

export class AdminNotificationsResponseDto {
  @ApiProperty({ type: [AdminNotificationDto] })
  notifications!: AdminNotificationDto[];

  @ApiProperty({ description: 'Total de notificaciones sin leer' })
  unreadCount!: number;
}
