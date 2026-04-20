// src/application/jobs/services/applications.service.ts
import { Injectable, Inject, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { IJobApplicationRepository, JOB_APPLICATION_REPOSITORY } from '@/core/interfaces';
import {
  MyApplicationsResponseDto,
  ApplicationDto,
  UpdateStatusResponseDto,
  ApplicationStatusEnum,
} from '../dto';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @Inject(JOB_APPLICATION_REPOSITORY)
    private readonly applicationRepository: IJobApplicationRepository,
  ) {}

  /**
   * Obtener todas las aplicaciones del usuario agrupadas por estado
   */
  async getMyApplications(userId: string): Promise<MyApplicationsResponseDto> {
    const grouped = await this.applicationRepository.findByUserIdGroupedByStatus(userId);

    // Formatear fecha
    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    // Transformar a DTOs
    const mapApplications = (apps: typeof grouped.applied): ApplicationDto[] => {
      return apps.map(app => ({
        id: app.id,
        job: {
          id: app.jobOffer.id,
          title: app.jobOffer.title,
          company: app.jobOffer.company,
        },
        appliedDate: formatDate(app.appliedAt),
        notes: app.notes,
      }));
    };

    return {
      stats: {
        applied: grouped.applied.length,
        pending: grouped.pending.length,
        interview: grouped.interview.length,
        rejected: grouped.rejected.length,
      },
      applications: {
        applied: mapApplications(grouped.applied),
        pending: mapApplications(grouped.pending),
        interview: mapApplications(grouped.interview),
        rejected: mapApplications(grouped.rejected),
      },
    };
  }

  /**
   * Actualizar el estado de una aplicación
   */
  async updateStatus(
    userId: string,
    applicationId: string,
    newStatus: ApplicationStatusEnum,
  ): Promise<UpdateStatusResponseDto> {
    // Verificar que la aplicación existe
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Aplicación no encontrada');
    }

    // Verificar que la aplicación pertenece al usuario
    if (application.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar esta aplicación');
    }

    // Actualizar estado
    await this.applicationRepository.updateStatus(
      applicationId,
      newStatus as unknown as ApplicationStatus,
    );

    this.logger.log(
      `Usuario ${userId} actualizó aplicación ${applicationId} a estado ${newStatus}`,
    );

    return {
      success: true,
      message: 'Estado actualizado correctamente',
      newStatus,
    };
  }

  /**
   * Reordenar aplicaciones del usuario dentro de una columna del kanban
   */
  async reorder(
    userId: string,
    status: ApplicationStatusEnum,
    orderedIds: string[],
  ): Promise<{ success: boolean; message: string }> {
    await this.applicationRepository.reorder(
      userId,
      status as unknown as ApplicationStatus,
      orderedIds,
    );

    this.logger.log(
      `Usuario ${userId} reordenó ${orderedIds.length} aplicaciones en columna ${status}`,
    );

    return {
      success: true,
      message: 'Orden actualizado correctamente',
    };
  }

  /**
   * Actualizar las notas de una aplicación
   */
  async updateNotes(
    userId: string,
    applicationId: string,
    notes: string,
  ): Promise<{ success: boolean; message: string }> {
    // Verificar que la aplicación existe
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Aplicación no encontrada');
    }

    // Verificar que la aplicación pertenece al usuario
    if (application.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar esta aplicación');
    }

    await this.applicationRepository.updateNotes(applicationId, notes);

    this.logger.log(`Usuario ${userId} actualizó notas de aplicación ${applicationId}`);

    return {
      success: true,
      message: 'Notas actualizadas correctamente',
    };
  }
}
