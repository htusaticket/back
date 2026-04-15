// src/infrastructure/http/controllers/admin/admin-system-config.controller.ts
import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { AdminSystemConfigService } from '@/application/admin/services/admin-system-config.service';
import { CloudflareStorageService } from '@/infrastructure/storage/cloudflare/cloudflare-storage.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/application/auth/guards/roles.guard';
import { Roles } from '@/application/auth/decorators/roles.decorator';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';

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
  constructor(
    private readonly systemConfigService: AdminSystemConfigService,
    private readonly storage: CloudflareStorageService,
  ) {}

  /**
   * GET /api/admin/system-config
   * Obtener configuración del sistema
   */
  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.JOB_UPLOADER)
  @ApiOperation({
    summary: 'Obtener configuración del sistema',
    description:
      'Obtiene la configuración actual del sistema (strikes, castigos, etc). Solo SUPERADMIN y JOB_UPLOADER (lectura).',
  })
  @ApiResponse({ status: 200, description: 'Configuración del sistema' })
  @ApiResponse({ status: 403, description: 'No tiene permisos para ver la configuración' })
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
  async updateConfig(
    @Body() dto: UpdateSystemConfigDto,
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ): Promise<UpdateSystemConfigResponseDto> {
    const adminInfo = {
      adminId: admin.userId,
      adminEmail: admin.email,
      adminName: admin.email,
      ip: req.ip ?? 'unknown',
    };
    return this.systemConfigService.updateConfig(dto, adminInfo);
  }

  /**
   * POST /api/admin/system-config/logo
   * Upload global system logo (branding usado en front, admin y emails).
   */
  @Post('logo')
  @Roles(UserRole.SUPERADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (
        _req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
        if (allowed.includes(file.mimetype)) callback(null, true);
        else
          callback(
            new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}`),
            false,
          );
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir logo global del sistema' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Logo actualizado' })
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ): Promise<SystemConfigDto> {
    if (!file) throw new BadRequestException('No se proporcionó ningún archivo');
    if (!this.storage.isReady()) {
      throw new BadRequestException('File storage no está configurado.');
    }
    const url = await this.storage.uploadSystemLogo(file.buffer, file.originalname, file.mimetype);
    return this.systemConfigService.setLogoUrl(url, {
      adminId: admin.userId,
      adminEmail: admin.email,
      adminName: admin.email,
      ip: req.ip ?? 'unknown',
    });
  }
}
