// src/infrastructure/http/controllers/admin/admin-dashboard.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { AdminDashboardService } from '@/application/admin/services/admin-dashboard.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/application/auth/guards/roles.guard';
import { Roles } from '@/application/auth/decorators/roles.decorator';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';

import {
  AdminDashboardResponseDto,
  AdminNotificationsResponseDto,
} from '@/application/admin/dto/admin-dashboard.dto';

@ApiTags('Admin - Dashboard')
@Controller('api/admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  /**
   * GET /api/admin/dashboard
   * Obtener estadísticas y actividad reciente
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Obtener dashboard de admin',
    description: 'Retorna estadísticas del sistema y actividad reciente',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['today', 'week'],
    description: 'Período de estadísticas',
  })
  @ApiResponse({ status: 200, description: 'Dashboard data', type: AdminDashboardResponseDto })
  async getDashboard(
    @Query('period') period?: 'today' | 'week',
  ): Promise<AdminDashboardResponseDto> {
    return this.dashboardService.getDashboard(period);
  }

  /**
   * GET /api/admin/dashboard/notifications
   * Obtener notificaciones para admin
   */
  @Get('notifications')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.JOB_UPLOADER)
  @ApiOperation({
    summary: 'Obtener notificaciones de admin',
    description: 'Retorna notificaciones relevantes para administradores',
  })
  @ApiResponse({ status: 200, description: 'Notifications', type: AdminNotificationsResponseDto })
  async getNotifications(@CurrentUser() user: JwtPayload): Promise<AdminNotificationsResponseDto> {
    return this.dashboardService.getNotifications(user.userId);
  }

  /**
   * POST /api/admin/dashboard/notifications/:id/read
   * Marcar notificación como leída
   */
  @Post('notifications/:id/read')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.JOB_UPLOADER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar notificación como leída',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  async markAsRead(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.dashboardService.markNotificationAsRead(id);
    return { success: true };
  }

  /**
   * POST /api/admin/dashboard/notifications/read-all
   * Marcar todas las notificaciones como leídas
   */
  @Post('notifications/read-all')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.JOB_UPLOADER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar todas las notificaciones como leídas',
  })
  @ApiResponse({ status: 200, description: 'Notificaciones marcadas como leídas' })
  async markAllAsRead(@CurrentUser() user: JwtPayload): Promise<{ success: boolean }> {
    await this.dashboardService.markAllNotificationsAsRead(user.userId);
    return { success: true };
  }
}
