// src/application/admin/services/admin-subscriptions.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, UserPlan, SubscriptionStatus, UserStatus } from '@prisma/client';

import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

import {
  GetSubscriptionsQueryDto,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  PaginatedSubscriptionsResponseDto,
  SubscriptionDto,
  CreateSubscriptionResponseDto,
  UpdateSubscriptionResponseDto,
  DeleteSubscriptionResponseDto,
  UserActiveSubscriptionDto,
} from '../dto/subscriptions';

// Tipo para subscription con usuario incluido
interface SubscriptionWithUser {
  id: string;
  userId: string;
  plan: UserPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  hasPaid: boolean;
  paidAt: Date | null;
  paymentNote: string | null;
  assignedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: UserStatus;
  };
}

@Injectable()
export class AdminSubscriptionsService {
  private readonly logger = new Logger(AdminSubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditLogService,
  ) {}

  /**
   * Obtener lista paginada de subscripciones con filtros
   */
  async getSubscriptions(
    query: GetSubscriptionsQueryDto,
  ): Promise<PaginatedSubscriptionsResponseDto> {
    this.logger.debug(`Fetching subscriptions with query: ${JSON.stringify(query)}`);

    const { page = 1, limit = 10, search, plan, status } = query;
    const skip = (page - 1) * limit;

    // Construir where clause
    const where: Prisma.SubscriptionWhereInput = {};

    if (plan) {
      where.plan = plan;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions: subscriptions.map(s => this.mapSubscriptionToDto(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener subscripción por ID
   */
  async getSubscriptionById(id: string): Promise<SubscriptionDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscripción no encontrada');
    }

    return this.mapSubscriptionToDto(subscription);
  }

  /**
   * Obtener subscripción activa de un usuario
   */
  async getUserActiveSubscription(userId: string): Promise<UserActiveSubscriptionDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isPunished: true,
        punishedUntil: true,
        subscriptions: {
          where: {
            status: SubscriptionStatus.ACTIVE,
            endDate: { gte: new Date() },
          },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const activeSubscription = user.subscriptions[0] || null;

    return {
      hasActiveSubscription: !!activeSubscription,
      subscription: activeSubscription ? this.mapSubscriptionToDto(activeSubscription) : null,
      isPunished: user.isPunished,
      punishedUntil: user.punishedUntil?.toISOString() || null,
    };
  }

  /**
   * Crear nueva subscripción para un usuario (Solo SUPERADMIN)
   */
  async createSubscription(
    dto: CreateSubscriptionDto,
    adminId: string,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<CreateSubscriptionResponseDto> {
    this.logger.log(`Creating subscription for user ${dto.userId}`);

    // Verificar que el usuario existe y está activo
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(
        'El usuario debe estar aprobado (ACTIVE) para asignarle una subscripción',
      );
    }

    // Verificar si ya tiene una subscripción activa
    const existingActive = await this.prisma.subscription.findFirst({
      where: {
        userId: dto.userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: { gte: new Date() },
      },
    });

    if (existingActive) {
      throw new BadRequestException(
        'El usuario ya tiene una subscripción activa. Edita la existente o cancélala primero.',
      );
    }

    // Crear subscripción
    const subscription = await this.prisma.subscription.create({
      data: {
        userId: dto.userId,
        plan: dto.plan,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        hasPaid: dto.hasPaid ?? false,
        paidAt: dto.hasPaid ? new Date() : null,
        paymentNote: dto.paymentNote || null,
        assignedBy: adminId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(`Subscription created: ${subscription.id} for user ${dto.userId}`);

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'SUBSCRIPTION_CREATED',
        targetType: 'SUBSCRIPTION',
        targetId: subscription.id,
        targetName: `${subscription.user?.firstName} ${subscription.user?.lastName} - ${dto.plan}`,
        details: { userId: dto.userId, plan: dto.plan },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      subscription: this.mapSubscriptionToDto(subscription),
      message: 'Subscripción creada exitosamente',
    };
  }

  /**
   * Actualizar subscripción (Solo SUPERADMIN)
   */
  async updateSubscription(
    id: string,
    dto: UpdateSubscriptionDto,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<UpdateSubscriptionResponseDto> {
    this.logger.log(`Updating subscription ${id}`);

    const existing = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Subscripción no encontrada');
    }

    // Preparar datos de actualización
    const updateData: Prisma.SubscriptionUpdateInput = {};

    if (dto.plan !== undefined) updateData.plan = dto.plan;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
    if (dto.paymentNote !== undefined) updateData.paymentNote = dto.paymentNote;

    // Si se marca como pagado
    if (dto.hasPaid !== undefined) {
      updateData.hasPaid = dto.hasPaid;
      if (dto.hasPaid && !existing.hasPaid) {
        updateData.paidAt = new Date();
      }
    }

    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(`Subscription updated: ${id}`);

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'SUBSCRIPTION_UPDATED',
        targetType: 'SUBSCRIPTION',
        targetId: id,
        targetName: `${subscription.user?.firstName} ${subscription.user?.lastName}`,
        details: { updatedFields: Object.keys(dto) },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      subscription: this.mapSubscriptionToDto(subscription),
      message: 'Subscripción actualizada exitosamente',
    };
  }

  /**
   * Eliminar subscripción (Solo SUPERADMIN)
   */
  async deleteSubscription(id: string, adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string }): Promise<DeleteSubscriptionResponseDto> {
    this.logger.log(`Deleting subscription ${id}`);

    const existing = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Subscripción no encontrada');
    }

    await this.prisma.subscription.delete({
      where: { id },
    });

    this.logger.log(`Subscription deleted: ${id}`);

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'SUBSCRIPTION_DELETED',
        targetType: 'SUBSCRIPTION',
        targetId: id,
        targetName: `Subscription ${id}`,
        details: { userId: existing.userId },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message: 'Subscripción eliminada exitosamente',
    };
  }

  /**
   * Cancelar subscripción de un usuario
   */
  async cancelSubscription(id: string, adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string }): Promise<UpdateSubscriptionResponseDto> {
    this.logger.log(`Cancelling subscription ${id}`);

    const existing = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Subscripción no encontrada');
    }

    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELLED },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'SUBSCRIPTION_CANCELLED',
        targetType: 'SUBSCRIPTION',
        targetId: id,
        targetName: `${subscription.user?.firstName} ${subscription.user?.lastName}`,
        details: { userId: existing.userId },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      subscription: this.mapSubscriptionToDto(subscription),
      message: 'Subscripción cancelada exitosamente',
    };
  }

  /**
   * Mapper de entidad a DTO
   */
  private mapSubscriptionToDto(subscription: SubscriptionWithUser): SubscriptionDto {
    const dto: SubscriptionDto = {
      id: subscription.id,
      userId: subscription.userId,
      plan: subscription.plan,
      status: subscription.status,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate.toISOString(),
      hasPaid: subscription.hasPaid,
      paidAt: subscription.paidAt?.toISOString() || null,
      paymentNote: subscription.paymentNote,
      assignedBy: subscription.assignedBy,
      createdAt: subscription.createdAt.toISOString(),
    };

    if (subscription.user) {
      dto.user = {
        id: subscription.user.id,
        email: subscription.user.email,
        firstName: subscription.user.firstName,
        lastName: subscription.user.lastName,
        status: subscription.user.status,
      };
    }

    return dto;
  }
}
