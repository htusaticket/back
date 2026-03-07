// Admin Challenges Service
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import { ChallengeType, Prisma, SubmissionStatus } from '@prisma/client';
import {
  CreateChallengeDto,
  UpdateChallengeDto,
  ChallengeResponseDto,
  ChallengesListResponseDto,
  GetChallengesQueryDto,
  BulkCreateChallengeDto,
  BulkCreateChallengesResponseDto,
  QuizQuestionDto,
} from '../dto/challenges';

@Injectable()
export class AdminChallengesService {
  private readonly logger = new Logger(AdminChallengesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditLogService,
  ) {}

  async getChallenges(query: GetChallengesQueryDto): Promise<ChallengesListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.DailyChallengeWhereInput = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    const [challenges, total] = await Promise.all([
      this.prisma.dailyChallenge.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { userProgress: true },
          },
          userProgress: {
            where: { status: SubmissionStatus.PENDING },
            select: { id: true },
          },
        },
      }),
      this.prisma.dailyChallenge.count({ where }),
    ]);

    return {
      challenges: challenges.map(c => ({
        id: c.id,
        title: c.title,
        type: c.type,
        instructions: c.instructions,
        date: c.date,
        questions: (c.questions as unknown as QuizQuestionDto[]) ?? undefined,
        audioUrl: c.audioUrl ?? undefined,
        points: c.points,
        isActive: c.isActive,
        visibleForSkillBuilder: c.visibleForSkillBuilder,
        submissionsCount: c._count.userProgress,
        pendingSubmissions: c.userProgress.length,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getChallengeById(id: number): Promise<ChallengeResponseDto> {
    const challenge = await this.prisma.dailyChallenge.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userProgress: true },
        },
        userProgress: {
          where: { status: SubmissionStatus.PENDING },
          select: { id: true },
        },
      },
    });

    if (!challenge) {
      throw new NotFoundException(`Challenge con ID ${id} no encontrado`);
    }

    return {
      id: challenge.id,
      title: challenge.title,
      type: challenge.type,
      instructions: challenge.instructions,
      date: challenge.date,
      questions: (challenge.questions as unknown as QuizQuestionDto[]) ?? undefined,
      audioUrl: challenge.audioUrl ?? undefined,
      points: challenge.points,
      isActive: challenge.isActive,
      visibleForSkillBuilder: challenge.visibleForSkillBuilder,
      submissionsCount: challenge._count.userProgress,
      pendingSubmissions: challenge.userProgress.length,
      createdAt: challenge.createdAt,
      updatedAt: challenge.updatedAt,
    };
  }

  async createChallenge(
    data: CreateChallengeDto,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<ChallengeResponseDto> {
    // Validate type-specific requirements
    if (
      data.type === ChallengeType.MULTIPLE_CHOICE &&
      (!data.questions || data.questions.length === 0)
    ) {
      throw new BadRequestException(
        'Los challenges de tipo MULTIPLE_CHOICE requieren al menos una pregunta',
      );
    }

    // Check if there's already a challenge for that date
    const existingChallenge = await this.prisma.dailyChallenge.findFirst({
      where: {
        date: new Date(data.date),
        isActive: true,
      },
    });

    if (existingChallenge) {
      throw new BadRequestException(`Ya existe un challenge activo para la fecha ${data.date}`);
    }

    const challenge = await this.prisma.dailyChallenge.create({
      data: {
        title: data.title,
        type: data.type,
        instructions: data.instructions,
        date: new Date(data.date),
        questions: (data.questions as unknown as Prisma.JsonArray) ?? Prisma.JsonNull,
        audioUrl: data.audioUrl ?? null,
        points: data.points ?? 10,
        visibleForSkillBuilder: data.visibleForSkillBuilder ?? false,
      },
      include: {
        _count: {
          select: { userProgress: true },
        },
      },
    });

    // Log audit
    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'CHALLENGE_CREATED',
      targetType: 'CHALLENGE',
      targetId: challenge.id.toString(),
      targetName: challenge.title,
      details: { title: challenge.title, type: challenge.type, date: data.date },
      ipAddress: adminInfo.ip,
    });

    return {
      id: challenge.id,
      title: challenge.title,
      type: challenge.type,
      instructions: challenge.instructions,
      date: challenge.date,
      questions: (challenge.questions as unknown as QuizQuestionDto[]) ?? undefined,
      audioUrl: challenge.audioUrl ?? undefined,
      points: challenge.points,
      isActive: challenge.isActive,
      visibleForSkillBuilder: challenge.visibleForSkillBuilder,
      submissionsCount: challenge._count.userProgress,
      pendingSubmissions: 0,
      createdAt: challenge.createdAt,
      updatedAt: challenge.updatedAt,
    };
  }

  async updateChallenge(
    id: number,
    data: UpdateChallengeDto,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<ChallengeResponseDto> {
    const existing = await this.prisma.dailyChallenge.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Challenge con ID ${id} no encontrado`);
    }

    // Check date conflict if changing date
    if (data.date) {
      const conflicting = await this.prisma.dailyChallenge.findFirst({
        where: {
          date: new Date(data.date),
          isActive: true,
          id: { not: id },
        },
      });

      if (conflicting) {
        throw new BadRequestException(`Ya existe un challenge activo para la fecha ${data.date}`);
      }
    }

    const updateData: Prisma.DailyChallengeUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.instructions !== undefined) updateData.instructions = data.instructions;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.questions !== undefined)
      updateData.questions = (data.questions as unknown as Prisma.JsonArray) ?? Prisma.JsonNull;
    if (data.audioUrl !== undefined) updateData.audioUrl = data.audioUrl ?? null;
    if (data.points !== undefined) updateData.points = data.points;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.visibleForSkillBuilder !== undefined)
      updateData.visibleForSkillBuilder = data.visibleForSkillBuilder;

    const challenge = await this.prisma.dailyChallenge.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { userProgress: true },
        },
        userProgress: {
          where: { status: SubmissionStatus.PENDING },
          select: { id: true },
        },
      },
    });

    // Log audit
    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'CHALLENGE_UPDATED',
      targetType: 'CHALLENGE',
      targetId: challenge.id.toString(),
      targetName: challenge.title,
      details: { changes: data },
      ipAddress: adminInfo.ip,
    });

    return {
      id: challenge.id,
      title: challenge.title,
      type: challenge.type,
      instructions: challenge.instructions,
      date: challenge.date,
      questions: (challenge.questions as unknown as QuizQuestionDto[]) ?? undefined,
      audioUrl: challenge.audioUrl ?? undefined,
      points: challenge.points,
      isActive: challenge.isActive,
      visibleForSkillBuilder: challenge.visibleForSkillBuilder,
      submissionsCount: challenge._count.userProgress,
      pendingSubmissions: challenge.userProgress.length,
      createdAt: challenge.createdAt,
      updatedAt: challenge.updatedAt,
    };
  }

  async deleteChallenge(
    id: number,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<{ success: boolean; message: string }> {
    const challenge = await this.prisma.dailyChallenge.findUnique({ where: { id } });
    if (!challenge) {
      throw new NotFoundException(`Challenge con ID ${id} no encontrado`);
    }

    await this.prisma.dailyChallenge.delete({ where: { id } });

    // Log audit
    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'CHALLENGE_DELETED',
      targetType: 'CHALLENGE',
      targetId: id.toString(),
      targetName: challenge.title,
      ipAddress: adminInfo.ip,
    });

    return { success: true, message: 'Challenge eliminado correctamente' };
  }

  async bulkCreateChallenges(
    data: BulkCreateChallengeDto,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<BulkCreateChallengesResponseDto> {
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const challengeData of data.challenges) {
      try {
        // Check for existing challenge on that date
        const existing = await this.prisma.dailyChallenge.findFirst({
          where: {
            date: new Date(challengeData.date),
            isActive: true,
          },
        });

        if (existing) {
          throw new Error(`Ya existe un challenge para la fecha ${challengeData.date}`);
        }

        // Validate type-specific requirements
        if (
          challengeData.type === ChallengeType.MULTIPLE_CHOICE &&
          (!challengeData.questions || challengeData.questions.length === 0)
        ) {
          throw new Error('Los challenges MULTIPLE_CHOICE requieren preguntas');
        }

        await this.prisma.dailyChallenge.create({
          data: {
            title: challengeData.title,
            type: challengeData.type,
            instructions: challengeData.instructions,
            date: new Date(challengeData.date),
            questions: (challengeData.questions as unknown as Prisma.JsonArray) ?? Prisma.JsonNull,
            audioUrl: challengeData.audioUrl ?? null,
            points: challengeData.points ?? 10,
            visibleForSkillBuilder: challengeData.visibleForSkillBuilder ?? false,
          },
        });
        created++;
      } catch (error) {
        failed++;
        errors.push(
          `Error creating challenge "${challengeData.title}": ${(error as Error).message}`,
        );
      }
    }

    // Log audit for bulk creation
    if (created > 0) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'CHALLENGE_CREATED',
        targetType: 'CHALLENGE',
        targetName: `Bulk upload: ${created} challenges`,
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
