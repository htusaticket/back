// src/application/admin/services/admin-classes.service.ts
import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { AttendanceStatus, NotificationType } from '@prisma/client';

import {
  IStrikeRepository,
  STRIKE_REPOSITORY,
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
} from '@/core/interfaces';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

import {
  GetClassesQueryDto,
  CreateClassDto,
  SaveAttendanceDto,
  UpdateClassDto,
  PaginatedClassesResponseDto,
  ClassAttendeesResponseDto,
  CreateClassResponseDto,
  SaveAttendanceResponseDto,
  UpdateClassResponseDto,
  DeleteClassResponseDto,
  ClassListItemDto,
  ClassAttendeeDto,
  BulkCreateClassesDto,
  BulkCreateClassesResponseDto,
} from '../dto/classes';

@Injectable()
export class AdminClassesService {
  private readonly logger = new Logger(AdminClassesService.name);

  constructor(
    @Inject(STRIKE_REPOSITORY)
    private readonly strikeRepository: IStrikeRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditLogService,
  ) {}

  /**
   * Obtener lista de clases con paginación y filtros
   */
  async getClasses(query: GetClassesQueryDto): Promise<PaginatedClassesResponseDto> {
    this.logger.debug(`Fetching classes with query: ${JSON.stringify(query)}`);

    const { fromDate, toDate, type, page = 1, limit = 30 } = query;

    const where: Record<string, unknown> = {};

    if (fromDate) {
      where.startTime = { ...(where.startTime as object), gte: new Date(fromDate) };
    }

    if (toDate) {
      where.startTime = { ...(where.startTime as object), lte: new Date(toDate) };
    }

    if (type) {
      where.type = type;
    }

    const [classes, total] = await Promise.all([
      this.prisma.classSession.findMany({
        where,
        orderBy: { startTime: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              enrollments: {
                where: { status: 'CONFIRMED' },
              },
            },
          },
        },
      }),
      this.prisma.classSession.count({ where }),
    ]);

    return {
      classes: classes.map(
        (c): ClassListItemDto => ({
          id: c.id,
          title: c.title,
          type: c.type,
          startTime: c.startTime,
          endTime: c.endTime,
          capacityMax: c.capacityMax,
          enrolledCount: c._count.enrollments,
          meetLink: c.meetLink,
          materialsLink: c.materialsLink,
          description: c.description,
          visibleForSkillBuilderLive: c.visibleForSkillBuilderLive,
          createdAt: c.createdAt,
        }),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Crear una nueva clase
   */
  async createClass(
    dto: CreateClassDto,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<CreateClassResponseDto> {
    this.logger.log(`Creating class: ${dto.title}`);

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio');
    }

    const classSession = await this.prisma.classSession.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        type: dto.type,
        startTime,
        endTime,
        capacityMax: dto.capacityMax ?? null,
        meetLink: dto.meetLink ?? null,
        materialsLink: dto.materialsLink ?? null,
        visibleForSkillBuilderLive: dto.visibleForSkillBuilderLive ?? false,
      },
    });

    this.logger.log(`Class created successfully: ${classSession.id}`);

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'CLASS_CREATED',
        targetType: 'CLASS',
        targetId: classSession.id.toString(),
        targetName: classSession.title,
        details: { type: dto.type, startTime: dto.startTime },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message: 'Clase creada exitosamente',
      classSession: {
        id: classSession.id,
        title: classSession.title,
        type: classSession.type,
        startTime: classSession.startTime,
        endTime: classSession.endTime,
        capacityMax: classSession.capacityMax,
        enrolledCount: 0,
        meetLink: classSession.meetLink,
        materialsLink: classSession.materialsLink,
        description: classSession.description,
        visibleForSkillBuilderLive: classSession.visibleForSkillBuilderLive,
        createdAt: classSession.createdAt,
      },
    };
  }

  /**
   * Obtener lista de inscritos en una clase
   */
  async getClassAttendees(classId: number): Promise<ClassAttendeesResponseDto> {
    this.logger.debug(`Fetching attendees for class: ${classId}`);

    const classSession = await this.prisma.classSession.findUnique({
      where: { id: classId },
      include: {
        enrollments: {
          where: { status: 'CONFIRMED' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { enrolledAt: 'asc' },
        },
      },
    });

    if (!classSession) {
      throw new NotFoundException('Clase no encontrada');
    }

    return {
      classId: classSession.id,
      classTitle: classSession.title,
      startTime: classSession.startTime,
      attendees: classSession.enrollments.map(
        (e): ClassAttendeeDto => ({
          id: e.id,
          userId: e.userId,
          name: `${e.user.firstName} ${e.user.lastName}`,
          email: e.user.email,
          avatar: e.user.avatar,
          attendanceStatus: e.attendanceStatus,
          enrolledAt: e.enrolledAt,
        }),
      ),
    };
  }

  /**
   * Guardar asistencia de una clase
   */
  async saveAttendance(
    classId: number,
    dto: SaveAttendanceDto,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<SaveAttendanceResponseDto> {
    this.logger.log(`Saving attendance for class: ${classId}`);

    const classSession = await this.prisma.classSession.findUnique({
      where: { id: classId },
    });

    if (!classSession) {
      throw new NotFoundException('Clase no encontrada');
    }

    let strikesIssued = 0;
    const now = new Date();

    for (const record of dto.attendance) {
      await this.prisma.classEnrollment.updateMany({
        where: {
          userId: record.userId,
          classSessionId: classId,
          status: 'CONFIRMED',
        },
        data: {
          attendanceStatus: record.status,
          attendanceMarkedAt: now,
        },
      });

      if (record.status === AttendanceStatus.ABSENT && dto.autoStrike !== false) {
        try {
          await this.strikeRepository.create(record.userId, classId, 'ABSENCE');
          strikesIssued++;

          const strikeInfo = await this.strikeRepository.getStrikeInfo(record.userId);
          if (strikeInfo.strikesCount >= strikeInfo.maxStrikes) {
            // Apply punishment (block live classes), NOT suspension/ban
            const config = (await this.prisma.systemConfig.findUnique({
              where: { id: 'default' },
            })) || { punishmentDurationDays: 14 };

            const punishedUntil = new Date();
            punishedUntil.setDate(punishedUntil.getDate() + config.punishmentDurationDays);

            await this.prisma.user.update({
              where: { id: record.userId },
              data: {
                isPunished: true,
                punishedUntil,
              },
            });

            await this.notificationRepository.create({
              userId: record.userId,
              type: NotificationType.STRIKE_APPLIED,
              title: 'Acceso a Clases Restringido',
              message: `Tu acceso a clases en vivo ha sido restringido por acumular ${strikeInfo.maxStrikes} strikes. Podrás volver a inscribirte después del ${punishedUntil.toLocaleDateString()}.`,
              data: { classSessionId: classId },
            });
          } else {
            await this.notificationRepository.create({
              userId: record.userId,
              type: NotificationType.STRIKE_APPLIED,
              title: 'Strike Recibido',
              message: `Has recibido un strike por ausencia a la clase "${classSession.title}".`,
              data: { classSessionId: classId },
            });
          }
        } catch (error) {
          this.logger.error(`Error creating strike for user ${record.userId}:`, error);
        }
      }
    }

    this.logger.log(`Attendance saved for class ${classId}. Strikes issued: ${strikesIssued}`);

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'CLASS_ATTENDANCE_MARKED',
        targetType: 'CLASS',
        targetId: classId.toString(),
        targetName: classSession.title,
        details: { attendeesCount: dto.attendance.length, strikesIssued },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message: `Asistencia guardada. ${strikesIssued > 0 ? `Se emitieron ${strikesIssued} strikes por ausencias.` : ''}`,
      strikesIssued,
    };
  }

  /**
   * Actualizar una clase existente
   */
  async updateClass(
    classId: number,
    dto: UpdateClassDto,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<UpdateClassResponseDto> {
    this.logger.log(`Updating class: ${classId}`);

    const existing = await this.prisma.classSession.findUnique({ where: { id: classId } });
    if (!existing) {
      throw new NotFoundException('Clase no encontrada');
    }

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.startTime !== undefined) data.startTime = new Date(dto.startTime);
    if (dto.endTime !== undefined) data.endTime = new Date(dto.endTime);
    if (dto.capacityMax !== undefined) data.capacityMax = dto.capacityMax;
    if (dto.meetLink !== undefined) data.meetLink = dto.meetLink;
    if (dto.materialsLink !== undefined) data.materialsLink = dto.materialsLink;
    if (dto.visibleForSkillBuilderLive !== undefined)
      data.visibleForSkillBuilderLive = dto.visibleForSkillBuilderLive;

    const startTime = (data.startTime as Date) || existing.startTime;
    const endTime = (data.endTime as Date) || existing.endTime;
    if (endTime <= startTime) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio');
    }

    const updated = await this.prisma.classSession.update({
      where: { id: classId },
      data,
      include: {
        _count: { select: { enrollments: { where: { status: 'CONFIRMED' } } } },
      },
    });

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'CLASS_UPDATED',
        targetType: 'CLASS',
        targetId: classId.toString(),
        targetName: updated.title,
        details: { updatedFields: Object.keys(data) },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message: 'Clase actualizada exitosamente',
      classSession: {
        id: updated.id,
        title: updated.title,
        type: updated.type,
        startTime: updated.startTime,
        endTime: updated.endTime,
        capacityMax: updated.capacityMax,
        enrolledCount: updated._count.enrollments,
        meetLink: updated.meetLink,
        materialsLink: updated.materialsLink,
        description: updated.description,
        visibleForSkillBuilderLive: updated.visibleForSkillBuilderLive,
        createdAt: updated.createdAt,
      },
    };
  }

  /**
   * Eliminar una clase y sus inscripciones
   */
  async deleteClass(
    classId: number,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<DeleteClassResponseDto> {
    this.logger.log(`Deleting class: ${classId}`);

    const existing = await this.prisma.classSession.findUnique({ where: { id: classId } });
    if (!existing) {
      throw new NotFoundException('Clase no encontrada');
    }

    // Delete enrollments first (foreign key constraint), then the class
    await this.prisma.classEnrollment.deleteMany({ where: { classSessionId: classId } });
    await this.prisma.classSession.delete({ where: { id: classId } });

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'CLASS_DELETED',
        targetType: 'CLASS',
        targetId: classId.toString(),
        targetName: existing.title,
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message: 'Clase eliminada exitosamente',
    };
  }

  /**
   * Crear múltiples clases en lote desde Excel/CSV
   */
  async bulkCreateClasses(
    dto: BulkCreateClassesDto,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<BulkCreateClassesResponseDto> {
    this.logger.log(`Bulk creating ${dto.classes.length} classes`);

    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const classData of dto.classes) {
      try {
        const startTime = new Date(classData.startTime);
        const endTime = new Date(classData.endTime);

        if (endTime <= startTime) {
          failed++;
          errors.push(`"${classData.title}": End time must be after start time`);
          continue;
        }

        await this.prisma.classSession.create({
          data: {
            title: classData.title,
            description: classData.description ?? null,
            type: classData.type,
            startTime,
            endTime,
            capacityMax: classData.capacityMax ?? null,
            meetLink: classData.meetLink ?? null,
            materialsLink: classData.materialsLink ?? null,
            visibleForSkillBuilderLive: classData.visibleForSkillBuilderLive ?? false,
          },
        });

        created++;
      } catch (err) {
        failed++;
        errors.push(
          `"${classData.title}": ${err instanceof Error ? err.message : 'Unknown error'}`,
        );
      }
    }

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'CLASS_CREATED',
        targetType: 'CLASS',
        targetId: 'bulk',
        targetName: `Bulk: ${created} classes created`,
        details: { total: dto.classes.length, created, failed },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: failed === 0,
      message: `${created} classes created successfully${failed > 0 ? `, ${failed} failed` : ''}`,
      created,
      failed,
      errors,
    };
  }
}
