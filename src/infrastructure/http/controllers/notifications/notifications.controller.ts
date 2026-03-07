// src/infrastructure/http/controllers/notifications/notifications.controller.ts
import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { NotificationsService } from '@/application/notifications/services/notifications.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';
import {
  NotificationsListDto,
  NotificationDto,
  UnreadCountDto,
  MarkReadResponseDto,
} from '@/application/notifications/dto';

@ApiTags('Notifications')
@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /api/notifications
   * Obtener todas las notificaciones del usuario
   */
  @Get()
  @ApiOperation({
    summary: 'Obtener notificaciones',
    description: 'Retorna las notificaciones del usuario ordenadas por fecha descendente',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificaciones',
    type: NotificationsListDto,
  })
  async getNotifications(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
  ): Promise<NotificationsListDto> {
    return this.notificationsService.getNotifications(user.userId, limit);
  }

  /**
   * GET /api/notifications/unread
   * Obtener solo notificaciones no leídas
   */
  @Get('unread')
  @ApiOperation({
    summary: 'Obtener notificaciones no leídas',
    description: 'Retorna solo las notificaciones no leídas del usuario',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificaciones no leídas',
    type: [NotificationDto],
  })
  async getUnreadNotifications(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
  ): Promise<NotificationDto[]> {
    return this.notificationsService.getUnreadNotifications(user.userId, limit);
  }

  /**
   * GET /api/notifications/unread-count
   * Obtener conteo de notificaciones no leídas
   */
  @Get('unread-count')
  @ApiOperation({
    summary: 'Obtener conteo de no leídas',
    description: 'Retorna el número de notificaciones no leídas',
  })
  @ApiResponse({
    status: 200,
    description: 'Conteo de notificaciones no leídas',
    type: UnreadCountDto,
  })
  async getUnreadCount(@CurrentUser() user: JwtPayload): Promise<UnreadCountDto> {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  /**
   * POST /api/notifications/:id/read
   * Marcar una notificación como leída
   */
  @Post(':id/read')
  @ApiOperation({
    summary: 'Marcar como leída',
    description: 'Marca una notificación específica como leída',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación marcada como leída',
    type: MarkReadResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notificación no encontrada',
  })
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<MarkReadResponseDto> {
    return this.notificationsService.markAsRead(user.userId, id);
  }

  /**
   * POST /api/notifications/mark-all-read
   * Marcar todas las notificaciones como leídas
   */
  @Post('mark-all-read')
  @ApiOperation({
    summary: 'Marcar todas como leídas',
    description: 'Marca todas las notificaciones del usuario como leídas',
  })
  @ApiResponse({
    status: 200,
    description: 'Todas las notificaciones marcadas como leídas',
    type: MarkReadResponseDto,
  })
  async markAllAsRead(@CurrentUser() user: JwtPayload): Promise<MarkReadResponseDto> {
    return this.notificationsService.markAllAsRead(user.userId);
  }
}
