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
  ) {}

  /**
   * Obtener todas las clases disponibles (futuras)
   */
  async getAvailableClasses(): Promise<ClassResponseDto[]> {
    const classes = await this.classSessionRepository.findAvailableClasses();
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
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Tu cuenta está suspendida. No puedes inscribirte en clases.');
    }

    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException('Tu cuenta está pendiente de aprobación.');
    }

    // 2. Verificar que la clase existe
    const classSession = await this.classSessionRepository.findById(classSessionId);
    if (!classSession) {
      throw new NotFoundException('Clase no encontrada');
    }

    // 3. Verificar que el usuario no está ya inscrito
    const alreadyEnrolled = await this.classSessionRepository.isUserEnrolled(
      userId,
      classSessionId,
    );
    if (alreadyEnrolled) {
      throw new ConflictException('Ya estás inscrito en esta clase');
    }

    // 4. Verificar cupo disponible (transacción atómica)
    if (classSession.capacityMax !== null) {
      const currentCount =
        await this.classSessionRepository.getConfirmedEnrollmentCount(classSessionId);
      if (currentCount >= classSession.capacityMax) {
        throw new ConflictException('Esta clase está llena. No hay cupos disponibles.');
      }
    }

    // 5. Inscribir al usuario
    await this.classSessionRepository.enrollUser(userId, classSessionId);

    // 6. Crear notificación de confirmación
    await this.notificationRepository.create({
      userId,
      type: NotificationType.CLASS_CONFIRMED,
      title: 'Inscripción confirmada',
      message: `Te has inscrito correctamente en la clase "${classSession.title}"`,
      data: { classSessionId },
    });

    this.logger.log(`Usuario ${userId} inscrito en clase ${classSessionId}`);

    return {
      success: true,
      message: 'Te has inscrito correctamente en la clase',
    };
  }

  /**
   * Cancelar inscripción en una clase
   */
  async cancelEnrollment(userId: string, classSessionId: number): Promise<CancelResponseDto> {
    // 1. Verificar que el usuario está inscrito
    const isEnrolled = await this.classSessionRepository.isUserEnrolled(userId, classSessionId);
    if (!isEnrolled) {
      throw new NotFoundException('No estás inscrito en esta clase');
    }

    // 2. Obtener la clase para verificar fecha
    const classSession = await this.classSessionRepository.findById(classSessionId);
    if (!classSession) {
      throw new NotFoundException('Clase no encontrada');
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
        title: 'Strike aplicado',
        message: `Has recibido un strike por cancelar la clase "${classSession.title}" con menos de 24 horas de anticipación.`,
        data: { classSessionId, reason: 'LATE_CANCELLATION' },
      });

      this.logger.warn(
        `Strike aplicado al usuario ${userId} por cancelación tardía de clase ${classSessionId}`,
      );
    }

    // 5. Cancelar la inscripción
    await this.classSessionRepository.cancelEnrollment(userId, classSessionId);

    this.logger.log(`Usuario ${userId} canceló inscripción en clase ${classSessionId}`);

    return {
      success: true,
      message: strikeApplied
        ? 'Inscripción cancelada. Se ha aplicado un strike por cancelación tardía.'
        : 'Inscripción cancelada correctamente',
      strikeApplied,
    };
  }
}
