// src/application/classes/services/classes.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { UserStatus, EnrollmentStatus, NotificationType } from '@prisma/client';
import {
  IClassSessionRepository,
  CLASS_SESSION_REPOSITORY,
  IStrikeRepository,
  STRIKE_REPOSITORY,
  INotificationRepository,
  NOTIFICATION_REPOSITORY,
  IUserRepository,
  USER_REPOSITORY,
} from '@/core/interfaces';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { ClassResponseDto, EnrollResponseDto, CancelResponseDto } from '../dto';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(
    @Inject(CLASS_SESSION_REPOSITORY)
    private readonly classSessionRepository: IClassSessionRepository,
    @Inject(STRIKE_REPOSITORY)
    private readonly strikeRepository: IStrikeRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Obtener todas las clases disponibles (futuras)
   * Si el usuario tiene plan SKILL_BUILDER_LIVE, solo muestra clases marcadas como visibleForSkillBuilderLive
   */
  async getAvailableClasses(userId?: string): Promise<ClassResponseDto[]> {
    const classes = await this.classSessionRepository.findAvailableClasses(userId);

    // Check if user has restricted plan - filter classes accordingly
    if (userId) {
      const activeSubscription = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      });

      this.logger.debug(`User ${userId} has plan: ${activeSubscription?.plan ?? 'NONE'}`);

      // SKILL_BUILDER has no access to live classes at all
      if (activeSubscription?.plan === 'SKILL_BUILDER') {
        this.logger.debug(`User ${userId} is SKILL_BUILDER - returning empty classes`);
        return [];
      }

      if (activeSubscription?.plan === 'SKILL_BUILDER_LIVE') {
        // Get class IDs that are visible for SB Live
        const visibleClassIds = await this.prisma.classSession.findMany({
          where: {
            visibleForSkillBuilderLive: true,
            startTime: { gt: new Date() },
          },
          select: { id: true },
        });
        const visibleIds = new Set(visibleClassIds.map(c => c.id));
        this.logger.debug(
          `SB Live filter: ${visibleIds.size} visible classes out of ${classes.length} total`,
        );
        return classes.filter(c => visibleIds.has(c.id));
      }
    }

    return classes;
  }

  /**
   * Obtener clases del usuario (My Schedule)
   */
  async getMySchedule(userId: string): Promise<ClassResponseDto[]> {
    const classes = await this.classSessionRepository.findUserSchedule(
      userId,
      EnrollmentStatus.CONFIRMED,
    );
    return classes;
  }

  /**
   * Inscribir usuario en una clase
   */
  async enrollInClass(userId: string, classSessionId: number): Promise<EnrollResponseDto> {
    // 1. Verificar que el usuario existe y está activo
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account is suspended. You cannot enroll in classes.');
    }

    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException('Your account is pending approval.');
    }

    // 2. Verificar que la clase existe
    const classSession = await this.classSessionRepository.findById(classSessionId);
    if (!classSession) {
      throw new NotFoundException('Class not found');
    }

    // 3. Verificar que el usuario no está ya inscrito
    const alreadyEnrolled = await this.classSessionRepository.isUserEnrolled(
      userId,
      classSessionId,
    );
    if (alreadyEnrolled) {
      throw new ConflictException('You are already enrolled in this class');
    }

    // 4. Verificar cupo disponible (transacción atómica)
    if (classSession.capacityMax !== null) {
      const currentCount =
        await this.classSessionRepository.getConfirmedEnrollmentCount(classSessionId);
      if (currentCount >= classSession.capacityMax) {
        throw new ConflictException('This class is full. No spots available.');
      }
    }

    // 5. Inscribir al usuario
    await this.classSessionRepository.enrollUser(userId, classSessionId);

    // 6. Crear notificación de confirmación
    await this.notificationRepository.create({
      userId,
      type: NotificationType.CLASS_CONFIRMED,
      title: 'Enrollment Confirmed',
      message: `You have successfully enrolled in the class "${classSession.title}"`,
      data: { classSessionId },
    });

    this.logger.log(`User ${userId} enrolled in class ${classSessionId}`);

    return {
      success: true,
      message: 'You have successfully enrolled in the class',
    };
  }

  /**
   * Cancelar inscripción en una clase
   */
  async cancelEnrollment(userId: string, classSessionId: number): Promise<CancelResponseDto> {
    // 1. Verificar que el usuario está inscrito
    const isEnrolled = await this.classSessionRepository.isUserEnrolled(userId, classSessionId);
    if (!isEnrolled) {
      throw new NotFoundException('You are not enrolled in this class');
    }

    // 2. Obtener la clase para verificar fecha
    const classSession = await this.classSessionRepository.findById(classSessionId);
    if (!classSession) {
      throw new NotFoundException('Class not found');
    }

    // 3. Verificar si la cancelación es tardía (< 24 horas)
    const now = new Date();
    const hoursUntilClass = (classSession.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isLateCancellation = hoursUntilClass < 24;

    let strikeApplied = false;

    // 4. Si es cancelación tardía, aplicar strike
    if (isLateCancellation) {
      await this.strikeRepository.create(userId, classSessionId, 'LATE_CANCELLATION');
      strikeApplied = true;

      // Notificar al usuario sobre el strike
      await this.notificationRepository.create({
        userId,
        type: NotificationType.STRIKE_APPLIED,
        title: 'Strike Applied',
        message: `You have received a strike for canceling the class "${classSession.title}" with less than 24 hours notice.`,
        data: { classSessionId, reason: 'LATE_CANCELLATION' },
      });

      this.logger.warn(
        `Strike applied to user ${userId} for late cancellation of class ${classSessionId}`,
      );
    }

    // 5. Cancelar la inscripción
    await this.classSessionRepository.cancelEnrollment(userId, classSessionId);

    this.logger.log(`User ${userId} cancelled enrollment in class ${classSessionId}`);

    return {
      success: true,
      message: strikeApplied
        ? 'Enrollment cancelled. A strike has been applied for late cancellation.'
        : 'Enrollment cancelled successfully',
      strikeApplied,
    };
  }
}
