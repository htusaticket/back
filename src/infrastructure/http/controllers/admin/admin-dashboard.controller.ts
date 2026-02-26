// src/infrastructure/http/controllers/admin/admin-dashboard.controller.ts
import { Controller, Get, Post, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
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
  @ApiResponse({ status: 200, description: 'Dashboard data', type: AdminDashboardResponseDto })
  async getDashboard(): Promise<AdminDashboardResponseDto> {
    return this.dashboardService.getDashboard();
  }

  /**
   * GET /api/admin/dashboard/notifications
   * Obtener notificaciones para admin
   */
  @Get('notifications')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
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
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar notificación como leída',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  markAsRead(@Param('id') id: string): { success: boolean } {
    this.dashboardService.markNotificationAsRead(id);
    return { success: true };
  }
}
