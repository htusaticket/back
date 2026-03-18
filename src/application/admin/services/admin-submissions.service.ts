// src/application/admin/services/admin-submissions.service.ts
import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChallengeType, NotificationType, SubmissionStatus } from '@prisma/client';

import { INotificationRepository, NOTIFICATION_REPOSITORY } from '@/core/interfaces';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

import {
  GetSubmissionsQueryDto,
  ReviewSubmissionDto,
  PaginatedSubmissionsResponseDto,
  ReviewSubmissionResponseDto,
  SubmissionListItemDto,
  SubmissionStatsDto,
} from '../dto/submissions';

@Injectable()
export class AdminSubmissionsService {
  private readonly logger = new Logger(AdminSubmissionsService.name);
  private readonly r2PublicUrl: string;

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditLogService,
  ) {
    this.r2PublicUrl = this.configService.get<string>('CLOUDFLARE_R2_PUBLIC_URL') || '';
  }

  /**
   * Normaliza una URL de archivo R2, reemplazando el patrón incorrecto
   * bucket-name.r2.dev por la URL pública correcta configurada en el env.
   */
  private normalizeFileUrl(fileUrl: string | null): string | null {
    if (!fileUrl) return null;
    if (!this.r2PublicUrl) return fileUrl;

    // Reemplazar URLs con patrón incorrecto: https://{bucket}.r2.dev/...
    // por la URL pública correcta: https://pub-xxx.r2.dev/...
    const incorrectPattern = /^https:\/\/[a-z0-9-]+\.r2\.dev\//;
    if (incorrectPattern.test(fileUrl) && !fileUrl.startsWith(this.r2PublicUrl)) {
      const path = fileUrl.replace(incorrectPattern, '');
      return `${this.r2PublicUrl}/${path}`;
    }

    return fileUrl;
  }

  /**
   * Obtener lista de submissions de audio pendientes/historial
   */
  async getSubmissions(query: GetSubmissionsQueryDto): Promise<PaginatedSubmissionsResponseDto> {
    this.logger.debug(`Fetching submissions with query: ${JSON.stringify(query)}`);

    const { status, search, page = 1, limit = 10 } = query;

    const where: Record<string, unknown> = {
      challenge: {
        type: ChallengeType.AUDIO,
      },
      completed: true,
      fileUrl: { not: null },
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [submissions, total, stats] = await Promise.all([
      this.prisma.userDailyChallengeProgress.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          challenge: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
      }),
      this.prisma.userDailyChallengeProgress.count({ where }),
      this.getStats(),
    ]);

    return {
      submissions: submissions.map(
        (s): SubmissionListItemDto => ({
          id: s.id,
          challengeId: s.challengeId,
          challengeTitle: s.challenge.title,
          challengeType: s.challenge.type,
          studentId: s.userId,
          studentName: `${s.user.firstName} ${s.user.lastName}`,
          studentEmail: s.user.email,
          studentAvatar: s.user.avatar,
          status: s.status,
          fileUrl: this.normalizeFileUrl(s.fileUrl),
          submittedAt: s.createdAt,
          feedback: s.feedback,
          score: s.score,
        }),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
    };
  }

  /**
   * Revisar/calificar una submission
   */
  async reviewSubmission(
    submissionId: string,
    dto: ReviewSubmissionDto,
    adminInfo?: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<ReviewSubmissionResponseDto> {
    this.logger.log(`Reviewing submission: ${submissionId}`);

    const submission = await this.prisma.userDailyChallengeProgress.findUnique({
      where: { id: submissionId },
      include: {
        challenge: true,
        user: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission no encontrada');
    }

    const updateData: { status: SubmissionStatus; feedback: string; score?: number } = {
      status: dto.status,
      feedback: dto.feedback,
    };

    if (dto.score !== undefined) {
      updateData.score = dto.score;
    }

    await this.prisma.userDailyChallengeProgress.update({
      where: { id: submissionId },
      data: updateData,
    });

    await this.notificationRepository.create({
      userId: submission.userId,
      type: NotificationType.CHALLENGE_FEEDBACK,
      title: 'Feedback Recibido',
      message: `Tu audio para "${submission.challenge.title}" ha sido revisado.`,
      data: {
        challengeId: submission.challengeId,
        status: dto.status,
      },
    });

    this.logger.log(`Submission ${submissionId} reviewed with status: ${dto.status}`);

    if (adminInfo) {
      await this.auditService.createLog({
        adminId: adminInfo.adminId,
        adminEmail: adminInfo.adminEmail,
        adminName: adminInfo.adminName,
        action: 'SUBMISSION_REVIEWED',
        targetType: 'SUBMISSION',
        targetId: submissionId,
        targetName: `${submission.user.firstName} ${submission.user.lastName} - ${submission.challenge.title}`,
        details: { status: dto.status, challengeTitle: submission.challenge.title },
        ipAddress: adminInfo.ip,
      });
    }

    return {
      success: true,
      message: 'Feedback enviado exitosamente',
    };
  }

  /**
   * Obtener estadísticas de submissions
   */
  private async getStats(): Promise<SubmissionStatsDto> {
    const baseWhere = {
      challenge: {
        type: ChallengeType.AUDIO,
      },
      completed: true,
      fileUrl: { not: null },
    };

    const [pending, approved, needsImprovement] = await Promise.all([
      this.prisma.userDailyChallengeProgress.count({
        where: { ...baseWhere, status: SubmissionStatus.PENDING },
      }),
      this.prisma.userDailyChallengeProgress.count({
        where: { ...baseWhere, status: SubmissionStatus.APPROVED },
      }),
      this.prisma.userDailyChallengeProgress.count({
        where: { ...baseWhere, status: SubmissionStatus.NEEDS_IMPROVEMENT },
      }),
    ]);

    return {
      pending,
      approved,
      needsImprovement,
    };
  }
}
