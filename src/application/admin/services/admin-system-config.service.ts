// src/application/admin/services/admin-system-config.service.ts
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

import {
  UpdateSystemConfigDto,
  SystemConfigDto,
  UpdateSystemConfigResponseDto,
} from '../dto/system-config';

// Tipo para config del sistema
interface SystemConfigEntity {
  id: string;
  strikesEnabled: boolean;
  maxStrikesForPunishment: number;
  punishmentDurationDays: number;
  lateCancellationHours: number;
  jobBoardEnabled: boolean;
  academyEnabled: boolean;
  logoUrl: string | null;
  updatedAt: Date;
}

@Injectable()
export class AdminSystemConfigService {
  private readonly logger = new Logger(AdminSystemConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditLogService,
  ) {}

  /**
   * Obtener configuración del sistema
   * Si no existe, crea una con valores por defecto
   */
  async getConfig(): Promise<SystemConfigDto> {
    let config = await this.prisma.systemConfig.findUnique({
      where: { id: 'default' },
    });

    // Si no existe, crear con valores por defecto
    if (!config) {
      config = await this.prisma.systemConfig.create({
        data: {
          id: 'default',
          strikesEnabled: false,
          maxStrikesForPunishment: 3,
          punishmentDurationDays: 14,
          lateCancellationHours: 24,
          jobBoardEnabled: true,
          academyEnabled: true,
        },
      });
      this.logger.log('Created default system config');
    }

    return this.mapConfigToDto(config);
  }

  /**
   * Actualizar configuración del sistema (Solo SUPERADMIN)
   */
  async updateConfig(
    dto: UpdateSystemConfigDto,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<UpdateSystemConfigResponseDto> {
    this.logger.log(`Updating system config: ${JSON.stringify(dto)}`);

    // Asegurar que existe
    await this.getConfig();

    const config = await this.prisma.systemConfig.update({
      where: { id: 'default' },
      data: {
        ...(dto.strikesEnabled !== undefined && { strikesEnabled: dto.strikesEnabled }),
        ...(dto.maxStrikesForPunishment !== undefined && {
          maxStrikesForPunishment: dto.maxStrikesForPunishment,
        }),
        ...(dto.punishmentDurationDays !== undefined && {
          punishmentDurationDays: dto.punishmentDurationDays,
        }),
        ...(dto.lateCancellationHours !== undefined && {
          lateCancellationHours: dto.lateCancellationHours,
        }),
        ...(dto.jobBoardEnabled !== undefined && { jobBoardEnabled: dto.jobBoardEnabled }),
        ...(dto.academyEnabled !== undefined && { academyEnabled: dto.academyEnabled }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      },
    });

    this.logger.log('System config updated successfully');

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'SYSTEM_CONFIG_UPDATED',
        targetType: 'SYSTEM_CONFIG',
        targetId: 'default',
        targetName: 'System Configuration',
        details: { updatedFields: Object.keys(dto) },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      config: this.mapConfigToDto(config),
      message: 'Configuración actualizada exitosamente',
    };
  }

  /**
   * Mapper de entidad a DTO
   */
  private mapConfigToDto(config: SystemConfigEntity): SystemConfigDto {
    return {
      id: config.id,
      strikesEnabled: config.strikesEnabled,
      maxStrikesForPunishment: config.maxStrikesForPunishment,
      punishmentDurationDays: config.punishmentDurationDays,
      lateCancellationHours: config.lateCancellationHours,
      jobBoardEnabled: config.jobBoardEnabled,
      academyEnabled: config.academyEnabled,
      logoUrl: config.logoUrl ?? null,
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  /**
   * Persiste la URL del logo en la configuración global.
   */
  async setLogoUrl(
    logoUrl: string,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<SystemConfigDto> {
    await this.getConfig();
    const config = await this.prisma.systemConfig.update({
      where: { id: 'default' },
      data: { logoUrl },
    });
    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'SYSTEM_CONFIG_UPDATED',
      targetType: 'SYSTEM_CONFIG',
      targetId: 'default',
      targetName: 'System Logo',
      details: { logoUrl },
      ipAddress: adminInfo.ip,
    });
    return this.mapConfigToDto(config);
  }
}
