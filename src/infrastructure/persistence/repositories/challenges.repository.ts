// src/infrastructure/persistence/repositories/challenges.repository.ts
import { Injectable } from '@nestjs/common';
import { SubmissionStatus, ChallengeType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  IDailyChallengeRepository,
  DailyChallenge,
  UserDailyChallengeProgress,
  ChallengeHistoryItem,
  QuizQuestion,
  QuizDetailItem,
} from '@/core/interfaces';

@Injectable()
export class ChallengesRepository implements IDailyChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTodayChallenge(): Promise<DailyChallenge | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.dailyChallenge.findFirst({
      where: {
        isActive: true,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  async findById(challengeId: number): Promise<DailyChallenge | null> {
    return this.prisma.dailyChallenge.findUnique({
      where: { id: challengeId },
    });
  }

  async findUserProgress(
    userId: string,
    challengeId: number,
  ): Promise<UserDailyChallengeProgress | null> {
    return this.prisma.userDailyChallengeProgress.findUnique({
      where: {
        userId_challengeId: { userId, challengeId },
      },
    });
  }

  async calculateStreak(userId: string): Promise<number> {
    // Obtener todos los challenges completados ordenados por fecha descendente
    const completedChallenges = await this.prisma.userDailyChallengeProgress.findMany({
      where: {
        userId,
        completed: true,
      },
      include: {
        challenge: {
          select: { date: true },
        },
      },
      orderBy: {
        challenge: { date: 'desc' },
      },
    });

    if (completedChallenges.length === 0) return 0;

    let streak = 0;
    const expectedDate = new Date();
    expectedDate.setHours(0, 0, 0, 0);

    for (const progress of completedChallenges) {
      const challengeDate = new Date(progress.challenge.date);
      challengeDate.setHours(0, 0, 0, 0);

      // Si es el día esperado, incrementar streak
      if (challengeDate.getTime() === expectedDate.getTime()) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (challengeDate.getTime() < expectedDate.getTime()) {
        // Si hay un gap, romper el streak
        break;
      }
    }

    return streak;
  }

  async completeChallenge(
    userId: string,
    challengeId: number,
    answers?: unknown,
    score?: number,
  ): Promise<UserDailyChallengeProgress> {
    const baseUpdate = {
      completed: true as const,
      completedAt: new Date(),
    };
    const baseCreate = {
      userId,
      challengeId,
      completed: true as const,
      completedAt: new Date(),
      status: SubmissionStatus.PENDING,
    };

    // Build complete data objects
    const updateData = {
      ...baseUpdate,
      ...(answers !== undefined ? { answers: answers as object } : {}),
      ...(score !== undefined ? { score } : {}),
    };
    const createData = {
      ...baseCreate,
      ...(answers !== undefined ? { answers: answers as object } : {}),
      ...(score !== undefined ? { score } : {}),
    };

    return this.prisma.userDailyChallengeProgress.upsert({
      where: {
        userId_challengeId: { userId, challengeId },
      },
      update: updateData,
      create: createData,
    });
  }

  async submitAudio(
    userId: string,
    challengeId: number,
    fileUrl: string,
  ): Promise<UserDailyChallengeProgress> {
    // Upsert: si existe, actualiza (permitiendo re-intento)
    return this.prisma.userDailyChallengeProgress.upsert({
      where: {
        userId_challengeId: { userId, challengeId },
      },
      update: {
        fileUrl,
        status: SubmissionStatus.PENDING,
        completed: true,
        completedAt: new Date(),
        // Reset feedback cuando se re-envía
        feedback: null,
      },
      create: {
        userId,
        challengeId,
        fileUrl,
        status: SubmissionStatus.PENDING,
        completed: true,
        completedAt: new Date(),
      },
    });
  }

  async submitQuiz(
    userId: string,
    challengeId: number,
    answers: number[],
    score: number,
    status: SubmissionStatus,
  ): Promise<UserDailyChallengeProgress> {
    return this.prisma.userDailyChallengeProgress.upsert({
      where: {
        userId_challengeId: { userId, challengeId },
      },
      update: {
        answers,
        score,
        status,
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        challengeId,
        answers,
        score,
        status,
        completed: true,
        completedAt: new Date(),
      },
    });
  }

  async findUserHistory(userId: string, limit = 20): Promise<ChallengeHistoryItem[]> {
    const history = await this.prisma.userDailyChallengeProgress.findMany({
      where: {
        userId,
        completed: true,
      },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: limit,
    });

    return history.map(item => ({
      id: item.id,
      challengeId: item.challenge.id,
      challengeTitle: item.challenge.title,
      challengeType: item.challenge.type,
      submittedAt: item.completedAt || item.createdAt,
      status: item.status,
      score: item.score,
      feedback: item.feedback,
      fileUrl: item.fileUrl,
    }));
  }

  async findQuizDetail(userId: string, progressId: string): Promise<QuizDetailItem | null> {
    const progress = await this.prisma.userDailyChallengeProgress.findFirst({
      where: {
        id: progressId,
        userId,
        completed: true,
      },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            type: true,
            questions: true,
          },
        },
      },
    });

    if (!progress) return null;

    // Verificar que sea un quiz
    if (progress.challenge.type !== ChallengeType.MULTIPLE_CHOICE) return null;

    const questions = progress.challenge.questions as unknown as QuizQuestion[];
    const userAnswers = (progress.answers as number[]) || [];

    return {
      id: progress.id,
      challengeId: progress.challenge.id,
      challengeTitle: progress.challenge.title,
      score: progress.score,
      status: progress.status,
      submittedAt: progress.completedAt || progress.createdAt,
      questions: questions.map((q, index) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: userAnswers[index] ?? -1,
      })),
    };
  }

  async findChallengeQuestions(
    challengeId: number,
  ): Promise<Omit<QuizQuestion, 'correctAnswer'>[]> {
    const challenge = await this.prisma.dailyChallenge.findUnique({
      where: { id: challengeId },
      select: { questions: true },
    });

    if (!challenge?.questions) return [];

    const questions = challenge.questions as unknown as QuizQuestion[];
    // Retornar sin la respuesta correcta
    return questions.map(({ correctAnswer: _correctAnswer, ...rest }) => rest);
  }

  async findChallengeQuestionsWithAnswers(challengeId: number): Promise<QuizQuestion[]> {
    const challenge = await this.prisma.dailyChallenge.findUnique({
      where: { id: challengeId },
      select: { questions: true },
    });

    if (!challenge?.questions) return [];

    return challenge.questions as unknown as QuizQuestion[];
  }
}
