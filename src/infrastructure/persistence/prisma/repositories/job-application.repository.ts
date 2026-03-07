// src/infrastructure/persistence/prisma/repositories/job-application.repository.ts
import { Injectable } from '@nestjs/common';
import { JobApplication, ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  IJobApplicationRepository,
  JobApplicationWithJob,
  ApplicationsByStatus,
} from '@/core/interfaces/job-application.repository';

@Injectable()
export class PrismaJobApplicationRepository implements IJobApplicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, jobOfferId: number): Promise<JobApplication> {
    return this.prisma.jobApplication.create({
      data: {
        userId,
        jobOfferId,
        status: ApplicationStatus.APPLIED,
      },
    });
  }

  async hasApplied(userId: string, jobOfferId: number): Promise<boolean> {
    const application = await this.prisma.jobApplication.findUnique({
      where: {
        userId_jobOfferId: {
          userId,
          jobOfferId,
        },
      },
      select: { id: true },
    });
    return !!application;
  }

  async findByUserIdGroupedByStatus(userId: string): Promise<ApplicationsByStatus> {
    const applications = await this.prisma.jobApplication.findMany({
      where: { userId },
      include: {
        jobOffer: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    const result: ApplicationsByStatus = {
      applied: [],
      pending: [],
      interview: [],
      rejected: [],
    };

    for (const app of applications) {
      // Using string comparison to support both old (OFFER) and new (PENDING) enum values
      const status = app.status as string;
      switch (status) {
        case 'APPLIED':
          result.applied.push(app);
          break;
        case 'PENDING':
        case 'OFFER': // Backwards compatibility until migration is run
          result.pending.push(app);
          break;
        case 'INTERVIEW':
          result.interview.push(app);
          break;
        case 'REJECTED':
          result.rejected.push(app);
          break;
      }
    }

    return result;
  }

  async findById(id: string): Promise<JobApplicationWithJob | null> {
    return this.prisma.jobApplication.findUnique({
      where: { id },
      include: { jobOffer: true },
    });
  }

  async updateStatus(id: string, status: ApplicationStatus): Promise<JobApplication> {
    return this.prisma.jobApplication.update({
      where: { id },
      data: { status },
    });
  }

  async updateNotes(id: string, notes: string): Promise<JobApplication> {
    return this.prisma.jobApplication.update({
      where: { id },
      data: { notes },
    });
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return this.prisma.jobApplication.count({
      where: {
        userId,
        status: { not: ApplicationStatus.REJECTED },
      },
    });
  }
}
