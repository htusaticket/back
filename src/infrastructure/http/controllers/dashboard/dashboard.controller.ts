// src/infrastructure/http/controllers/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { DashboardService } from '@/application/dashboard/services/dashboard.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';
import { DashboardSummaryDto } from '@/application/dashboard/dto';

@ApiTags('Dashboard')
@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/dashboard/summary
   * Obtener resumen del dashboard
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Obtener resumen del dashboard',
    description:
      'Retorna: próxima clase confirmada, challenge diario + streak, último módulo/lección visto (continue learning), notificaciones no leídas (máx 3)',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen del dashboard',
    type: DashboardSummaryDto,
  })
  async getDashboardSummary(@CurrentUser() user: JwtPayload): Promise<DashboardSummaryDto> {
    return this.dashboardService.getDashboardSummary(user.userId);
  }
}
