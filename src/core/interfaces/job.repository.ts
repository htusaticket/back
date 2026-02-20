// src/core/interfaces/job.repository.ts
import type { JobOffer } from '@prisma/client';

export interface JobFilters {
  search?: string; // Buscar por título o empresa
  type?: string; // Full-time, Part-time
  sortBy?: string; // Ordenamiento
}

export interface JobWithApplicationStatus extends JobOffer {
  hasApplied: boolean;
}

export interface IJobRepository {
  /**
   * Obtener todas las ofertas de trabajo activas con filtros
   */
  findAllActive(filters?: JobFilters, userId?: string): Promise<JobWithApplicationStatus[]>;

  /**
   * Obtener una oferta de trabajo por ID
   */
  findById(id: number): Promise<JobOffer | null>;

  /**
   * Contar ofertas activas
   */
  countActive(): Promise<number>;

  /**
   * Contar ofertas nuevas de la semana
   */
  countNewThisWeek(): Promise<number>;
}

export const JOB_REPOSITORY = Symbol('JOB_REPOSITORY');
