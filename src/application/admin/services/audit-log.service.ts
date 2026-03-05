import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';
import {
  AuditLogDto,
  GetAuditLogsQueryDto,
  AuditLogsResponseDto,
  CreateAuditLogDto,
} from '../dto/audit-log.dto';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createLog(data: CreateAuditLogDto): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminId: data.adminId,
          adminEmail: data.adminEmail,
          adminName: data.adminName,
          action: data.action,
          targetType: data.targetType ?? null,
          targetId: data.targetId ?? null,
          targetName: data.targetName ?? null,
          details: (data.details as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
        },
      });
      this.logger.debug(`Audit log created: ${data.action} by ${data.adminEmail}`);
    } catch (error) {
      this.logger.error('Error creating audit log', error);
      // Don't throw - audit logs should not break the main flow
    }
  }

  async getLogs(query: GetAuditLogsQueryDto): Promise<AuditLogsResponseDto> {
    this.logger.debug(`Fetching audit logs with query: ${JSON.stringify(query)}`);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (query.action) {
      where.action = query.action;
    }

    if (query.targetType) {
      where.targetType = query.targetType;
    }

    if (query.adminId) {
      where.adminId = query.adminId;
    }

    if (query.search) {
      where.OR = [
        { adminName: { contains: query.search, mode: 'insensitive' } },
        { adminEmail: { contains: query.search, mode: 'insensitive' } },
        { targetName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map(
        log =>
          ({
            id: log.id,
            adminId: log.adminId,
            adminEmail: log.adminEmail,
            adminName: log.adminName,
            action: log.action,
            targetType: log.targetType ?? undefined,
            targetId: log.targetId ?? undefined,
            targetName: log.targetName ?? undefined,
            details: (log.details as Record<string, unknown>) ?? undefined,
            ipAddress: log.ipAddress ?? undefined,
            createdAt: log.createdAt,
          }) as AuditLogDto,
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Helper method to get action label in Spanish
  getActionLabel(action: AuditAction): string {
    const labels: Record<AuditAction, string> = {
      USER_CREATED: 'Usuario creado',
      USER_APPROVED: 'Usuario aprobado',
      USER_REJECTED: 'Usuario rechazado',
      USER_SUSPENDED: 'Usuario suspendido',
      USER_ACTIVATED: 'Usuario activado',
      USER_DELETED: 'Usuario eliminado',
      USER_UPDATED: 'Usuario actualizado',
      USER_STRIKE_ISSUED: 'Strike emitido',
      ADMIN_CREATED: 'Admin creado',
      ADMIN_UPDATED: 'Admin actualizado',
      ADMIN_DELETED: 'Admin eliminado',
      SUBSCRIPTION_CREATED: 'Suscripción creada',
      SUBSCRIPTION_UPDATED: 'Suscripción actualizada',
      SUBSCRIPTION_CANCELLED: 'Suscripción cancelada',
      SUBSCRIPTION_DELETED: 'Suscripción eliminada',
      CLASS_CREATED: 'Clase creada',
      CLASS_UPDATED: 'Clase actualizada',
      CLASS_DELETED: 'Clase eliminada',
      CLASS_ATTENDANCE_MARKED: 'Asistencia marcada',
      MODULE_CREATED: 'Módulo creado',
      MODULE_UPDATED: 'Módulo actualizado',
      MODULE_DELETED: 'Módulo eliminado',
      LESSON_CREATED: 'Lección creada',
      LESSON_UPDATED: 'Lección actualizada',
      LESSON_DELETED: 'Lección eliminada',
      CHALLENGE_CREATED: 'Desafío creado',
      CHALLENGE_UPDATED: 'Desafío actualizado',
      CHALLENGE_DELETED: 'Desafío eliminado',
      SUBMISSION_REVIEWED: 'Envío revisado',
      JOB_CREATED: 'Trabajo creado',
      JOB_UPDATED: 'Trabajo actualizado',
      JOB_DELETED: 'Trabajo eliminado',
      SYSTEM_CONFIG_UPDATED: 'Configuración actualizada',
      LOGIN_SUCCESS: 'Inicio de sesión exitoso',
      LOGIN_FAILED: 'Inicio de sesión fallido',
    };
    return labels[action] || action;
  }
}
