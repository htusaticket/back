// src/core/interfaces/class-session.repository.ts
import type {
  ClassSession,
  ClassSessionWithEnrollmentCount,
} from '../entities/class-session.entity';
import type { EnrollmentStatus } from '@prisma/client';
import type { ClassResponseDto } from '@/application/classes/dto';

export const CLASS_SESSION_REPOSITORY = 'CLASS_SESSION_REPOSITORY';

export interface IClassSessionRepository {
  /**
   * Obtener clases disponibles (futuras) - con formato para frontend
   * @param userId - Optional user ID to check enrollment status
   */
  findAvailableClasses(userId?: string): Promise<ClassResponseDto[]>;

  /**
   * Obtener clases donde el usuario está inscrito - con formato para frontend
   */
  findUserSchedule(userId: string, status?: EnrollmentStatus): Promise<ClassResponseDto[]>;

  /**
   * Obtener próxima clase confirmada del usuario - con datos raw para operaciones internas
   */
  findNextConfirmedClass(userId: string): Promise<ClassSessionWithEnrollmentCount | null>;

  /**
   * Obtener clase por ID
   */
  findById(id: number): Promise<ClassSession | null>;

  /**
   * Inscribir usuario en una clase
   */
  enrollUser(userId: string, classSessionId: number): Promise<void>;

  /**
   * Cancelar inscripción del usuario
   */
  cancelEnrollment(userId: string, classSessionId: number): Promise<void>;

  /**
   * Verificar si el usuario ya está inscrito
   */
  isUserEnrolled(userId: string, classSessionId: number): Promise<boolean>;

  /**
   * Obtener cantidad de inscripciones confirmadas para una clase
   */
  getConfirmedEnrollmentCount(classSessionId: number): Promise<number>;
}
