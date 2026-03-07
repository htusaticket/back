// src/infrastructure/http/controllers/admin/admin-system-config.controller.ts
import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { AdminSystemConfigService } from '@/application/admin/services/admin-system-config.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/application/auth/guards/roles.guard';
import { Roles } from '@/application/auth/decorators/roles.decorator';

import {
  UpdateSystemConfigDto,
  SystemConfigDto,
  UpdateSystemConfigResponseDto,
} from '@/application/admin/dto/system-config';

@ApiTags('Admin - System Config')
@Controller('api/admin/system-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminSystemConfigController {
  constructor(private readonly systemConfigService: AdminSystemConfigService) {}

  /**
   * GET /api/admin/system-config
   * Obtener configuración del sistema
   */
  @Get()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Obtener configuración del sistema',
    description:
      'Obtiene la configuración actual del sistema (strikes, castigos, etc). Solo SUPERADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Configuración del sistema' })
  @ApiResponse({ status: 403, description: 'Solo SUPERADMIN puede ver la configuración' })
  async getConfig(): Promise<SystemConfigDto> {
    return this.systemConfigService.getConfig();
  }

  /**
   * PATCH /api/admin/system-config
   * Actualizar configuración del sistema
   */
  @Patch()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Actualizar configuración del sistema',
    description: 'Actualiza la configuración del sistema. Solo SUPERADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Configuración actualizada' })
  @ApiResponse({ status: 403, description: 'Solo SUPERADMIN puede actualizar la configuración' })
  async updateConfig(@Body() dto: UpdateSystemConfigDto): Promise<UpdateSystemConfigResponseDto> {
    return this.systemConfigService.updateConfig(dto);
  }
}
