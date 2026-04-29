// Admin Jobs Service
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import { extractJobCode } from './extract-job-code';
import { Prisma } from '@prisma/client';
import {
  CreateJobOfferDto,
  UpdateJobOfferDto,
  JobOfferResponseDto,
  JobOfferWithApplicationsDto,
  JobOffersListResponseDto,
  GetJobOffersQueryDto,
  BulkCreateJobOfferDto,
  BulkCreateResponseDto,
} from '../dto/jobs';

@Injectable()
export class AdminJobsService {
  private readonly logger = new Logger(AdminJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditLogService,
  ) {}

  async getJobs(query: GetJobOffersQueryDto): Promise<JobOffersListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.JobOfferWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.type) {
      where.type = query.type;
    }

    const startOfWeek = new Date();
    const daysSinceMonday = (startOfWeek.getDay() + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const [jobs, total, activeJobs, applicationsAgg, newThisWeek] = await Promise.all([
      this.prisma.jobOffer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { applications: true },
          },
        },
      }),
      this.prisma.jobOffer.count({ where }),
      this.prisma.jobOffer.count({ where: { isActive: true } }),
      this.prisma.jobApplication.count(),
      this.prisma.jobOffer.count({ where: { createdAt: { gte: startOfWeek } } }),
    ]);

    return {
      jobs: jobs.map(job => ({
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
        isActive: job.isActive,
        applicationsCount: job._count.applications,
        social: job.social,
        recruiterSocial: job.recruiterSocial,
        website: job.website,
        email: job.email,
        code: job.code,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      activeJobs,
      totalApplicants: applicationsAgg,
      newThisWeek,
    };
  }

  async getJobById(id: number): Promise<JobOfferWithApplicationsDto> {
    const job = await this.prisma.jobOffer.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { appliedAt: 'desc' },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Oferta con ID ${id} no encontrada`);
    }

    return {
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
      isActive: job.isActive,
      applicationsCount: job._count.applications,
      social: job.social,
      recruiterSocial: job.recruiterSocial,
      website: job.website,
      email: job.email,
      code: job.code,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      applications: job.applications.map(app => ({
        id: app.id,
        userId: app.userId,
        userEmail: app.user.email,
        userName: `${app.user.firstName} ${app.user.lastName}`,
        status: app.status,
        notes: app.notes ?? undefined,
        appliedAt: app.appliedAt,
      })),
    };
  }

  async createJob(
    data: CreateJobOfferDto,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<JobOfferResponseDto> {
    const description = data.description ?? '';
    const job = await this.prisma.jobOffer.create({
      data: {
        title: data.title,
        company: data.company,
        location: data.location ?? '',
        salaryRange: data.salaryRange ?? '',
        oteMin: data.oteMin ?? 0,
        oteMax: data.oteMax ?? 0,
        revenue: data.revenue ?? 0,
        type: data.type ?? 'Setter',
        description,
        requirements: data.requirements ?? [],
        isActive: data.isActive ?? true,
        social: data.social ?? null,
        recruiterSocial: data.recruiterSocial ?? null,
        website: data.website ?? null,
        email: data.email ?? null,
        code: data.code ?? extractJobCode(description),
      },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    // Log audit
    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'JOB_CREATED',
      targetType: 'JOB',
      targetId: job.id.toString(),
      targetName: `${job.title} at ${job.company}`,
      details: { title: job.title, company: job.company },
      ipAddress: adminInfo.ip,
    });

    return {
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
      isActive: job.isActive,
      applicationsCount: job._count.applications,
      social: job.social,
      recruiterSocial: job.recruiterSocial,
      website: job.website,
      email: job.email,
      code: job.code,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  async updateJob(
    id: number,
    data: UpdateJobOfferDto,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<JobOfferResponseDto> {
    const existing = await this.prisma.jobOffer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Oferta con ID ${id} no encontrada`);
    }

    const updateData: Prisma.JobOfferUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.salaryRange !== undefined) updateData.salaryRange = data.salaryRange;
    if (data.oteMin !== undefined) updateData.oteMin = data.oteMin;
    if (data.oteMax !== undefined) updateData.oteMax = data.oteMax;
    if (data.revenue !== undefined) updateData.revenue = data.revenue;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.requirements !== undefined) updateData.requirements = data.requirements;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.social !== undefined) updateData.social = data.social || null;
    if (data.recruiterSocial !== undefined)
      updateData.recruiterSocial = data.recruiterSocial || null;
    if (data.website !== undefined) updateData.website = data.website || null;
    if (data.email !== undefined) updateData.email = data.email || null;

    if (data.code !== undefined) {
      updateData.code = data.code || null;
    } else if (data.description !== undefined) {
      updateData.code = extractJobCode(data.description) ?? existing.code;
    }

    const job = await this.prisma.jobOffer.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    // Log audit
    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'JOB_UPDATED',
      targetType: 'JOB',
      targetId: job.id.toString(),
      targetName: `${job.title} at ${job.company}`,
      details: { changes: data },
      ipAddress: adminInfo.ip,
    });

    return {
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
      isActive: job.isActive,
      applicationsCount: job._count.applications,
      social: job.social,
      recruiterSocial: job.recruiterSocial,
      website: job.website,
      email: job.email,
      code: job.code,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  async deleteJob(
    id: number,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<{ success: boolean; message: string }> {
    const job = await this.prisma.jobOffer.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Oferta con ID ${id} no encontrada`);
    }

    await this.prisma.jobOffer.delete({ where: { id } });

    // Log audit
    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'JOB_DELETED',
      targetType: 'JOB',
      targetId: id.toString(),
      targetName: `${job.title} at ${job.company}`,
      ipAddress: adminInfo.ip,
    });

    return { success: true, message: 'Oferta eliminada correctamente' };
  }

  async bulkCreateJobs(
    data: BulkCreateJobOfferDto,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<BulkCreateResponseDto> {
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const jobData of data.jobs) {
      try {
        const description = jobData.description ?? '';
        await this.prisma.jobOffer.create({
          data: {
            title: jobData.title,
            company: jobData.company,
            location: jobData.location ?? '',
            salaryRange: jobData.salaryRange ?? '',
            oteMin: jobData.oteMin ?? 0,
            oteMax: jobData.oteMax ?? 0,
            revenue: jobData.revenue ?? 0,
            type: jobData.type ?? 'Setter',
            description,
            requirements: jobData.requirements ?? [],
            isActive: jobData.isActive ?? true,
            social: jobData.social ?? null,
            recruiterSocial: jobData.recruiterSocial ?? null,
            website: jobData.website ?? null,
            email: jobData.email ?? null,
            code: jobData.code ?? extractJobCode(description),
          },
        });
        created++;
      } catch (error) {
        failed++;
        errors.push(`Error creating job "${jobData.title}": ${(error as Error).message}`);
      }
    }

    // Log audit for bulk creation
    if (created > 0) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'JOB_CREATED',
        targetType: 'JOB',
        targetName: `Bulk upload: ${created} jobs`,
        details: { created, failed },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      created,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
