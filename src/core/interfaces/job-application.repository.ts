// src/core/interfaces/job-application.repository.ts
import type { JobApplication, ApplicationStatus, JobOffer } from '@prisma/client';

export interface JobApplicationWithJob extends JobApplication {
  jobOffer: JobOffer;
}

export interface ApplicationsByStatus {
  applied: JobApplicationWithJob[];
  pending: JobApplicationWithJob[];
  interview: JobApplicationWithJob[];
  rejected: JobApplicationWithJob[];
}

export interface IJobApplicationRepository {
  /**
   * Crear una nueva aplicación a una oferta de trabajo
   */
  create(userId: string, jobOfferId: number): Promise<JobApplication>;

  /**
   * Verificar si el usuario ya aplicó a una oferta
   */
  hasApplied(userId: string, jobOfferId: number): Promise<boolean>;

  /**
   * Obtener todas las aplicaciones de un usuario agrupadas por estado
   */
  findByUserIdGroupedByStatus(userId: string): Promise<ApplicationsByStatus>;

  /**
   * Obtener una aplicación por ID
   */
  findById(id: string): Promise<JobApplicationWithJob | null>;

  /**
   * Actualizar el estado de una aplicación
   */
  updateStatus(id: string, status: ApplicationStatus): Promise<JobApplication>;

  /**
   * Reordenar aplicaciones de un usuario dentro de una misma columna (estado)
   */
  reorder(userId: string, status: ApplicationStatus, orderedIds: string[]): Promise<void>;

  /**
   * Actualizar las notas de una aplicación
   */
  updateNotes(id: string, notes: string): Promise<JobApplication>;

  /**
   * Contar aplicaciones activas de un usuario (no rechazadas)
   */
  countActiveByUserId(userId: string): Promise<number>;
}

export const JOB_APPLICATION_REPOSITORY = Symbol('JOB_APPLICATION_REPOSITORY');
