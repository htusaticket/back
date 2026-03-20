// src/application/jobs/services/jobs.service.ts
import { Injectable, Inject, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import {
  IJobRepository,
  JOB_REPOSITORY,
  IJobApplicationRepository,
  JOB_APPLICATION_REPOSITORY,
} from '@/core/interfaces';
import { JobFiltersDto, JobListResponseDto, JobOfferDto, ApplyResponseDto } from '../dto';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: IJobRepository,
    @Inject(JOB_APPLICATION_REPOSITORY)
    private readonly applicationRepository: IJobApplicationRepository,
  ) {}

  /**
   * Obtener listado de ofertas de trabajo con filtros y estadísticas
   */
  async getJobs(userId: string, filters?: JobFiltersDto): Promise<JobListResponseDto> {
    // Ejecutar consultas en paralelo
    const [jobs, availableOffers, newThisWeek, activeApplications] = await Promise.all([
      this.jobRepository.findAllActive(filters, userId),
      this.jobRepository.countActive(),
      this.jobRepository.countNewThisWeek(),
      this.applicationRepository.countActiveByUserId(userId),
    ]);

    const jobDtos: JobOfferDto[] = jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salaryRange: job.salaryRange,
      oteMin: job.oteMin,
      oteMax: job.oteMax,
      revenue: job.revenue,
      type: job.type,
      description: job.description,
      requirements: job.requirements,
      social: job.social ?? null,
      website: job.website ?? null,
      email: job.email ?? null,
      hasApplied: job.hasApplied,
      createdAt: job.createdAt,
    }));

    return {
      stats: {
        availableOffers,
        activeApplications,
        newThisWeek,
      },
      jobs: jobDtos,
    };
  }

  /**
   * Aplicar a una oferta de trabajo
   */
  async applyToJob(userId: string, jobId: number): Promise<ApplyResponseDto> {
    // Verificar que la oferta existe y está activa
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new NotFoundException('Oferta de trabajo no encontrada');
    }

    if (!job.isActive) {
      throw new ConflictException('Esta oferta ya no está disponible');
    }

    // Verificar si ya aplicó
    const hasApplied = await this.applicationRepository.hasApplied(userId, jobId);
    if (hasApplied) {
      throw new ConflictException('Ya has aplicado a esta oferta');
    }

    // Crear la aplicación
    await this.applicationRepository.create(userId, jobId);

    this.logger.log(`Usuario ${userId} aplicó a oferta ${jobId}`);

    return {
      success: true,
      message: 'Has aplicado exitosamente a esta oferta',
    };
  }
}
