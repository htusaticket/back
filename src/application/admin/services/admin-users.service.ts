// src/application/admin/services/admin-users.service.ts
import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UserStatus, UserRole, NotificationType, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import {
  IUserRepository,
  USER_REPOSITORY,
  IStrikeRepository,
  STRIKE_REPOSITORY,
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
  UpdateUserData,
} from '@/core/interfaces';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { getEnvConfig } from '@/config/env.config';
import { EmailService } from '@/application/auth/services/email.service';
import { AuditLogService } from './audit-log.service';

import {
  GetUsersQueryDto,
  CreateUserDto,
  UpdateUserStatusDto,
  UpdateUserNotesDto,
  IssueStrikeDto,
  UpdateUserDto,
  RejectRegistrationDto,
  ApproveRegistrationDto,
  PaginatedUsersResponseDto,
  UserDetailDto,
  CreateUserResponseDto,
  UpdateStatusResponseDto,
  IssueStrikeResponseDto,
  ApproveRegistrationResponseDto,
  RejectRegistrationResponseDto,
  UserStatsDto,
  ModuleProgressDto,
  StrikeDetailDto,
} from '../dto/users';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);
  private readonly env = getEnvConfig();

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(STRIKE_REPOSITORY)
    private readonly strikeRepository: IStrikeRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditLogService,
  ) {}

  /**
   * Obtener lista paginada de usuarios con filtros
   */
  async getUsers(query: GetUsersQueryDto): Promise<PaginatedUsersResponseDto> {
    this.logger.debug(`Fetching users with query: ${JSON.stringify(query)}`);

    const result = await this.userRepository.findMany({
      ...(query.search && { search: query.search }),
      ...(query.role && { role: query.role }),
      ...(query.status && { status: query.status }),
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    });

    // Obtener subscripciones activas para todos los usuarios
    const userIds = result.users.map(u => u.id);
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        userId: { in: userIds },
        status: 'ACTIVE',
      },
    });

    const subscriptionMap = new Map(activeSubscriptions.map(sub => [sub.userId, sub]));

    return {
      users: result.users.map(user => {
        const subscription = subscriptionMap.get(user.id);
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          plan: subscription?.plan || null,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
          isPunished: user.isPunished,
          punishedUntil: user.punishedUntil,
        };
      }),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Obtener detalles completos de un usuario
   */
  async getUserDetails(userId: string): Promise<UserDetailDto> {
    this.logger.debug(`Fetching details for user: ${userId}`);

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Obtener subscripción activa
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Obtener estadísticas
    const stats = await this.getUserStats(userId);

    // Obtener strikes
    const strikeInfo = await this.strikeRepository.getStrikeInfo(userId);
    const strikesHistory = await this.strikeRepository.findByUserIdWithDetails(userId);

    // Obtener progreso de módulos
    const moduleProgress = await this.getModuleProgress(userId);

    // Obtener enrollments de clases
    const classEnrollments = await this.prisma.classEnrollment.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
      },
      include: {
        classSession: {
          select: {
            id: true,
            title: true,
            startTime: true,
            type: true,
          },
        },
      },
      orderBy: {
        classSession: {
          startTime: 'desc',
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      city: user.city,
      country: user.country,
      reference: user.reference,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      plan: activeSubscription?.plan || null,
      startDate: activeSubscription?.startDate || null,
      endDate: activeSubscription?.endDate || null,
      isPunished: user.isPunished,
      punishedUntil: user.punishedUntil,
      adminNotes: user.adminNotes,
      createdAt: user.createdAt,
      stats,
      strikes: {
        count: strikeInfo.strikesCount,
        maxStrikes: strikeInfo.maxStrikes,
        resetDate: strikeInfo.resetDate,
        history: strikesHistory.map(
          (s): StrikeDetailDto => ({
            id: s.id,
            reason: s.reason,
            isManual: s.isManual,
            classTitle: s.classSession?.title ?? null,
            createdAt: s.createdAt,
          }),
        ),
      },
      moduleProgress,
      enrollments: classEnrollments.map(e => ({
        id: e.id,
        attendanceStatus: e.attendanceStatus,
        attendanceMarkedAt: e.attendanceMarkedAt,
        classSession: {
          id: e.classSession.id,
          title: e.classSession.title,
          startTime: e.classSession.startTime,
          type: e.classSession.type,
        },
      })),
      subscription: activeSubscription
        ? {
            id: activeSubscription.id,
            plan: activeSubscription.plan,
            status: activeSubscription.status,
            startDate: activeSubscription.startDate,
            endDate: activeSubscription.endDate,
            hasPaid: activeSubscription.hasPaid,
          }
        : null,
    };
  }

  /**
   * Crear un nuevo usuario (invitación manual)
   * El plan se asigna por separado a través de subscriptions
   */
  async createUser(
    dto: CreateUserDto,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<CreateUserResponseDto> {
    this.logger.log(`Creating user with email: ${dto.email}`);

    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hashear password
    const hashedPassword = await bcrypt.hash(dto.password, this.env.BCRYPT_SALT_ROUNDS);

    // Crear usuario con estado ACTIVE (sin subscripción por defecto)
    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      role: dto.role ?? UserRole.USER,
      status: UserStatus.ACTIVE,
    });

    this.logger.log(`User created successfully: ${user.id}`);

    // Notificar al usuario que su cuenta fue creada y está activa.
    // Reusamos el template de "registro aprobado" porque una creación directa
    // por el admin es funcionalmente equivalente: la cuenta queda ACTIVE y
    // el usuario puede loguearse de inmediato.
    await this.emailService.sendRegistrationApprovedEmail(user.email, user.firstName);

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'USER_CREATED',
        targetType: 'USER',
        targetId: user.id,
        targetName: `${user.firstName} ${user.lastName}`,
        details: { email: user.email, role: user.role },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message:
        'Usuario creado exitosamente. Asigna una subscripción desde la gestión de subscripciones.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        plan: null,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        isPunished: user.isPunished,
        punishedUntil: user.punishedUntil,
      },
    };
  }

  /**
   * Actualizar el estado de un usuario
   */
  async updateUserStatus(
    userId: string,
    dto: UpdateUserStatusDto,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<UpdateStatusResponseDto> {
    this.logger.log(`Updating status for user ${userId} to ${dto.status}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.updateStatus(userId, dto.status);

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'USER_UPDATED',
        targetType: 'USER',
        targetId: userId,
        targetName: `${user.firstName} ${user.lastName}`,
        details: { previousStatus: user.status, newStatus: dto.status },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message: `Estado del usuario actualizado a ${dto.status}`,
    };
  }

  /**
   * Actualizar datos de un usuario
   */
  async updateUser(
    userId: string,
    dto: UpdateUserDto,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<UpdateStatusResponseDto> {
    this.logger.log(`Updating user ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Check if email is being changed and if it's already in use
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException('El email ya está en uso por otro usuario');
      }
    }

    const updateData: UpdateUserData = {};
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.role !== undefined) updateData.role = dto.role;

    // Hash and update password if provided (SUPERADMIN only, enforced by controller guard)
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, this.env.BCRYPT_SALT_ROUNDS);
      this.logger.log(`Password updated for user ${userId} by superadmin`);
    }

    await this.userRepository.update(userId, updateData);

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'USER_UPDATED',
        targetType: 'USER',
        targetId: userId,
        targetName: `${user.firstName} ${user.lastName}`,
        details: { updatedFields: Object.keys(updateData) },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
    };
  }

  /**
   * Actualizar notas del administrador (scoped per admin)
   * Stores notes as JSON: { "adminId": { "note": "text", "updatedAt": "ISO", "adminName": "Name" }, ... }
   */
  async updateUserNotes(
    userId: string,
    dto: UpdateUserNotesDto,
    adminId?: string,
  ): Promise<UpdateStatusResponseDto> {
    this.logger.log(`Updating notes for user ${userId} by admin ${adminId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // If adminId provided, store per-admin notes as JSON
    if (adminId) {
      let notesObj: Record<string, { note: string; updatedAt: string; adminName?: string }> = {};

      // Try to parse existing notes as JSON
      if (user.adminNotes) {
        try {
          notesObj = JSON.parse(user.adminNotes) as Record<
            string,
            { note: string; updatedAt: string; adminName?: string }
          >;
        } catch {
          // Legacy plain text notes - migrate to JSON under 'legacy' key
          notesObj = { legacy: { note: user.adminNotes, updatedAt: new Date().toISOString() } };
        }
      }

      // Fetch admin name
      let adminName = 'Admin';
      try {
        const admin = await this.userRepository.findById(adminId);
        if (admin) {
          adminName = [admin.firstName, admin.lastName].filter(Boolean).join(' ') || admin.email;
        }
      } catch {
        // If lookup fails, use fallback
      }

      // Update this admin's note
      notesObj[adminId] = {
        note: dto.notes,
        updatedAt: new Date().toISOString(),
        adminName,
      };

      await this.userRepository.updateNotes(userId, JSON.stringify(notesObj));
    } else {
      // Fallback: store as plain text
      await this.userRepository.updateNotes(userId, dto.notes);
    }

    return {
      success: true,
      message: 'Notas actualizadas exitosamente',
    };
  }

  /**
   * Emitir un strike manual
   * Si alcanza el máximo, aplica punishment (no puede acceder a clases en vivo)
   */
  async issueStrike(
    userId: string,
    dto: IssueStrikeDto,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<IssueStrikeResponseDto> {
    this.logger.log(`Issuing manual strike to user ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Crear el strike
    const strike = await this.strikeRepository.createManual(userId, dto.reason, dto.classSessionId);

    // Notificar al usuario sobre el strike
    await this.notificationRepository.create({
      userId,
      type: NotificationType.STRIKE_APPLIED,
      title: 'Strike Applied',
      message: `You have received a strike: ${dto.reason}`,
      data: { strikeId: strike.id, reason: dto.reason, classSessionId: dto.classSessionId },
    });

    // Obtener configuración del sistema
    const config = (await this.prisma.systemConfig.findUnique({
      where: { id: 'default' },
    })) || { maxStrikesForPunishment: 3, punishmentDurationDays: 14 };

    // Contar strikes activos del usuario
    const strikeCount = await this.prisma.strike.count({
      where: { userId },
    });

    let userPunished = false;
    let punishedUntil: Date | null = null;

    // Si alcanza el máximo, aplicar punishment (no suspender)
    if (strikeCount >= config.maxStrikesForPunishment) {
      punishedUntil = new Date();
      punishedUntil.setDate(punishedUntil.getDate() + config.punishmentDurationDays);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isPunished: true,
          punishedUntil,
        },
      });

      userPunished = true;
      this.logger.warn(
        `User ${userId} has been punished until ${punishedUntil.toISOString()} due to reaching max strikes`,
      );
    }

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'USER_STRIKE_ISSUED',
        targetType: 'USER',
        targetId: userId,
        targetName: `${user.firstName} ${user.lastName}`,
        details: { reason: dto.reason, totalStrikes: strikeCount, userPunished },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message: userPunished
        ? `Strike emitido. El usuario ha sido castigado (sin acceso a clases en vivo) por ${config.punishmentDurationDays} días.`
        : 'Strike emitido exitosamente',
      strikeId: strike.id,
      totalStrikes: strikeCount,
      userPunished,
      punishedUntil,
    };
  }

  /**
   * Aprobar un registro pendiente con plan obligatorio (PENDING → ACTIVE)
   * El usuario pasa a ACTIVE y se le asigna el plan especificado
   * Solo SUPERADMIN puede aprobar registros
   */
  async approveRegistration(
    userId: string,
    dto: ApproveRegistrationDto,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<ApproveRegistrationResponseDto> {
    const adminId = adminInfo.adminId;
    this.logger.log(`Approving registration for user ${userId} with plan ${dto.plan}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.status !== UserStatus.PENDING) {
      throw new ConflictException(
        `Solo se pueden aprobar usuarios con estado PENDING. Estado actual: ${user.status}`,
      );
    }

    // Usar transacción para asegurar consistencia
    await this.prisma.$transaction(async tx => {
      // 1. Cambiar a ACTIVE
      await tx.user.update({
        where: { id: userId },
        data: { status: UserStatus.ACTIVE },
      });

      // 2. Crear subscripción con el plan asignado
      await tx.subscription.create({
        data: {
          userId,
          plan: dto.plan,
          status: SubscriptionStatus.ACTIVE,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          hasPaid: false,
          assignedBy: adminId,
        },
      });
    });

    // Enviar email de aprobación al usuario
    await this.emailService.sendRegistrationApprovedEmail(user.email, user.firstName);

    // Crear notificación para el usuario
    await this.notificationRepository.create({
      userId,
      type: NotificationType.REGISTRATION_APPROVED,
      title: '¡Registro Aprobado!',
      message: `Tu registro ha sido aprobado con el plan ${dto.plan.replace('_', ' ')}. Ya puedes iniciar sesión.`,
      data: { plan: dto.plan },
    });

    this.logger.log(`User ${userId} registration approved with plan ${dto.plan}`);

    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'USER_APPROVED',
      targetType: 'USER',
      targetId: userId,
      targetName: `${user.firstName} ${user.lastName}`,
      details: { plan: dto.plan, email: user.email },
      ipAddress: adminInfo.ip,
    });

    return {
      success: true,
      message: `Registro aprobado exitosamente con plan ${dto.plan.replace('_', ' ')}.`,
    };
  }

  /**
   * Rechazar un registro pendiente (elimina de la BD)
   * Se envía email con el motivo y se elimina para permitir re-registro
   */
  async rejectRegistration(
    userId: string,
    dto: RejectRegistrationDto,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<RejectRegistrationResponseDto> {
    this.logger.log(`Rejecting registration for user ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.status !== UserStatus.PENDING) {
      throw new ConflictException(
        `Solo se pueden rechazar usuarios con estado PENDING. Estado actual: ${user.status}`,
      );
    }

    // Guardar datos antes de eliminar para el email
    const { email, firstName } = user;

    // Enviar email de rechazo con el motivo
    await this.emailService.sendRegistrationRejectedEmail(email, firstName, dto.reason);

    // Eliminar usuario de la BD (permite re-registro con el mismo email)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    this.logger.log(`User ${userId} registration rejected and deleted from DB`);

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'USER_REJECTED',
        targetType: 'USER',
        targetId: userId,
        targetName: `${firstName} (${email})`,
        details: { reason: dto.reason, email },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message: 'Registro rechazado. El usuario ha sido notificado y puede volver a registrarse.',
    };
  }

  /**
   * Suspender manualmente a un usuario (BAN)
   * Solo SUPERADMIN puede hacer esto
   */
  async suspendUser(
    userId: string,
    adminRole: UserRole,
    reason?: string,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<UpdateStatusResponseDto> {
    this.logger.log(`Suspending user ${userId}`);

    if (adminRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Solo el SUPERADMIN puede suspender usuarios');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ConflictException('El usuario ya está suspendido');
    }

    await this.userRepository.updateStatus(userId, UserStatus.SUSPENDED);

    // Guardar razón del ban en las notas del admin
    if (reason) {
      const currentNotes = user.adminNotes || '';
      const banNote = `\n[BAN ${new Date().toISOString()}] ${reason}`;
      await this.userRepository.updateNotes(userId, currentNotes + banNote);
    }

    this.logger.log(`User ${userId} has been suspended (banned)`);

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'USER_SUSPENDED',
        targetType: 'USER',
        targetId: userId,
        targetName: `${user.firstName} ${user.lastName}`,
        details: { reason: reason || 'No reason provided', email: user.email },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message: 'Usuario suspendido (baneado) exitosamente',
    };
  }

  /**
   * Quitar suspensión a un usuario (UNBAN)
   * Solo SUPERADMIN puede hacer esto
   */
  async unsuspendUser(
    userId: string,
    adminRole: UserRole,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<UpdateStatusResponseDto> {
    this.logger.log(`Unsuspending user ${userId}`);

    if (adminRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Solo el SUPERADMIN puede quitar la suspensión');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.status !== UserStatus.SUSPENDED) {
      throw new ConflictException('El usuario no está suspendido');
    }

    await this.userRepository.updateStatus(userId, UserStatus.ACTIVE);

    this.logger.log(`User ${userId} suspension removed`);

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'USER_ACTIVATED',
        targetType: 'USER',
        targetId: userId,
        targetName: `${user.firstName} ${user.lastName}`,
        details: { previousStatus: 'SUSPENDED', email: user.email },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message: 'Suspensión removida. El usuario puede volver a acceder.',
    };
  }

  /**
   * Quitar punishment a un usuario manualmente
   * Solo SUPERADMIN puede hacer esto
   */
  async removePunishment(userId: string, adminRole: UserRole): Promise<UpdateStatusResponseDto> {
    this.logger.log(`Removing punishment from user ${userId}`);

    if (adminRole !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Solo el SUPERADMIN puede quitar el castigo');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Quitar punishment y resetear strikes
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          isPunished: false,
          punishedUntil: null,
        },
      }),
      this.prisma.strike.deleteMany({
        where: { userId },
      }),
    ]);

    this.logger.log(`Punishment removed and strikes reset for user ${userId}`);

    return {
      success: true,
      message: 'Castigo removido y strikes reseteados.',
    };
  }

  /**
   * Eliminar permanentemente un usuario/admin y todas sus relaciones
   * Solo SUPERADMIN puede ejecutar esta acción
   * No se puede eliminar al propio usuario ni a otro SUPERADMIN
   */
  async deleteUser(
    userId: string,
    currentUserId: string,
    currentRole: string,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<UpdateStatusResponseDto> {
    this.logger.log(`Permanently deleting user ${userId}`);

    if (userId === currentUserId) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Don't allow deleting other SUPERADMINs
    if (user.role === 'SUPERADMIN' && currentRole !== 'SUPERADMIN') {
      throw new ForbiddenException('No se puede eliminar a un Super Admin');
    }
    if (user.role === 'SUPERADMIN') {
      throw new ForbiddenException(
        'No se puede eliminar a otro Super Admin. Primero cambia su rol.',
      );
    }

    // Delete user and all relations (cascaded by Prisma schema)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    this.logger.warn(`User ${userId} (${user.email}) permanently deleted by ${currentUserId}`);

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'USER_DELETED',
        targetType: 'USER',
        targetId: userId,
        targetName: `${user.firstName} ${user.lastName}`,
        details: { email: user.email, role: user.role },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message: `Usuario ${user.email} eliminado permanentemente.`,
    };
  }

  /**
   * Obtener estadísticas de un usuario
   */
  private async getUserStats(userId: string): Promise<UserStatsDto> {
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
      },
      select: {
        attendanceStatus: true,
      },
    });

    const totalClassesEnrolled = enrollments.length;
    const totalClassesAttended = enrollments.filter(
      e => e.attendanceStatus === 'PRESENT' || e.attendanceStatus === 'LATE',
    ).length;

    const attendancePercentage =
      totalClassesEnrolled > 0
        ? Math.round((totalClassesAttended / totalClassesEnrolled) * 100)
        : 0;

    const moduleProgress = await this.prisma.userModuleProgress.findMany({
      where: { userId },
    });

    const totalModules = await this.prisma.module.count();
    const modulesCompleted = moduleProgress.filter(m => m.progress === 100).length;

    const challengesCompleted = await this.prisma.userDailyChallengeProgress.count({
      where: {
        userId,
        completed: true,
      },
    });

    const jobApplicationsCount = await this.prisma.jobApplication.count({
      where: { userId },
    });

    return {
      attendancePercentage,
      totalClassesEnrolled,
      totalClassesAttended,
      modulesCompleted,
      totalModules,
      challengesCompleted,
      jobApplicationsCount,
    };
  }

  /**
   * Obtener progreso de módulos de un usuario
   */
  private async getModuleProgress(userId: string): Promise<ModuleProgressDto[]> {
    const modules = await this.prisma.module.findMany({
      orderBy: { order: 'asc' },
      include: {
        userProgress: {
          where: { userId },
          take: 1,
        },
      },
    });

    return modules.map(module => {
      const progress = module.userProgress[0]?.progress ?? 0;
      let status: 'Completed' | 'In Progress' | 'Not Started' = 'Not Started';

      if (progress === 100) {
        status = 'Completed';
      } else if (progress > 0) {
        status = 'In Progress';
      }

      return {
        moduleId: module.id,
        moduleTitle: module.title,
        progress,
        status,
      };
    });
  }
}
