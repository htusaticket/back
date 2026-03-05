// src/infrastructure/persistence/prisma/repositories/job.repository.ts
import { Injectable } from '@nestjs/common';
import { JobOffer, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  IJobRepository,
  JobFilters,
  JobWithApplicationStatus,
} from '@/core/interfaces/job.repository';

@Injectable()
export class PrismaJobRepository implements IJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(filters?: JobFilters, userId?: string): Promise<JobWithApplicationStatus[]> {
    // Calcular fecha de hace 4 meses
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    // Base where: activas Y (menos de 4 meses O el usuario ya aplicó)
    const where: Prisma.JobOfferWhereInput = {
      isActive: true,
      OR: [
        // Ofertas de menos de 4 meses de antigüedad
        { createdAt: { gte: fourMonthsAgo } },
        // O ofertas donde el usuario ya aplicó (si hay userId)
        ...(userId ? [{ applications: { some: { userId } } }] : []),
      ],
    };

    // Filtro de búsqueda por título o empresa
    if (filters?.search) {
      where.AND = [
        {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { company: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // Filtro por tipo de trabajo
    if (filters?.type) {
      where.type = filters.type;
    }

    // Determinar ordenamiento
    let orderBy:
      | Prisma.JobOfferOrderByWithRelationInput
      | Prisma.JobOfferOrderByWithRelationInput[] = { createdAt: 'desc' };

    switch (filters?.sortBy) {
      case 'newest_first':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest_first':
        orderBy = { createdAt: 'asc' };
        break;
      case 'highest_ote':
        orderBy = { oteMax: 'desc' };
        break;
      case 'lowest_ote':
        orderBy = { oteMin: 'asc' };
        break;
      case 'highest_revenue':
        orderBy = { revenue: 'desc' };
        break;
      case 'lowest_revenue':
        orderBy = { revenue: 'asc' };
        break;
      case 'best_match':
      default:
        // Best match: combina nuevos + alto OTE
        orderBy = [{ createdAt: 'desc' }, { oteMax: 'desc' }];
        break;
    }

    const jobs = await this.prisma.jobOffer.findMany({
      where,
      orderBy,
      include: {
        applications: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : false,
      },
    });

    return jobs.map(job => ({
      ...job,
      hasApplied: userId ? (job.applications as { id: string }[]).length > 0 : false,
      applications: undefined, // Removemos el campo applications de la respuesta
    })) as JobWithApplicationStatus[];
  }

  async findById(id: number): Promise<JobOffer | null> {
    return this.prisma.jobOffer.findUnique({
      where: { id },
    });
  }

  async countActive(): Promise<number> {
    // Contar solo ofertas de menos de 4 meses
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    return this.prisma.jobOffer.count({
      where: {
        isActive: true,
        createdAt: { gte: fourMonthsAgo },
      },
    });
  }

  async countNewThisWeek(): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return this.prisma.jobOffer.count({
      where: {
        isActive: true,
        createdAt: { gte: oneWeekAgo },
      },
    });
  }
}
