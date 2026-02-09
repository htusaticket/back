// src/infrastructure/persistence/prisma/repositories/daily-challenge.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  IDailyChallengeRepository,
  DailyChallenge,
  UserDailyChallengeProgress,
} from '@/core/interfaces';

@Injectable()
export class PrismaDailyChallengeRepository implements IDailyChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTodayChallenge(): Promise<DailyChallenge | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.dailyChallenge.findFirst({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
        isActive: true,
      },
    });
  }

  async findUserProgress(
    userId: string,
    challengeId: number,
  ): Promise<UserDailyChallengeProgress | null> {
    return this.prisma.userDailyChallengeProgress.findUnique({
      where: {
        userId_challengeId: {
          userId,
          challengeId,
        },
      },
    });
  }

  async calculateStreak(userId: string): Promise<number> {
    const completedChallenges = await this.prisma.userDailyChallengeProgress.findMany({
      where: {
        userId,
        completed: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
      include: {
        challenge: {
          select: {
            date: true,
          },
        },
      },
    });

    if (completedChallenges.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar si hay uno completado hoy
    const todayCompleted = completedChallenges.some(progress => {
      const challengeDate = new Date(progress.challenge.date);
      challengeDate.setHours(0, 0, 0, 0);
      return challengeDate.getTime() === today.getTime();
    });

    // Si no hay uno hoy, verificar si hay uno ayer para continuar el streak
    if (!todayCompleted) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayCompleted = completedChallenges.some(progress => {
        const challengeDate = new Date(progress.challenge.date);
        challengeDate.setHours(0, 0, 0, 0);
        return challengeDate.getTime() === yesterday.getTime();
      });

      // Si no hay ni hoy ni ayer, el streak es 0
      if (!yesterdayCompleted) return 0;
    }

    // Contar días consecutivos desde hoy o ayer
    const currentDate = todayCompleted ? today : new Date(today.setDate(today.getDate() - 1));

    for (const progress of completedChallenges) {
      const challengeDate = new Date(progress.challenge.date);
      challengeDate.setHours(0, 0, 0, 0);

      if (challengeDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (challengeDate < currentDate) {
        // Si hay un gap, el streak se rompe
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
    return this.prisma.userDailyChallengeProgress.upsert({
      where: {
        userId_challengeId: {
          userId,
          challengeId,
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
        answers: answers as Prisma.InputJsonValue,
        score: score || null,
      },
      create: {
        userId,
        challengeId,
        completed: true,
        completedAt: new Date(),
        answers: answers as Prisma.InputJsonValue,
        score: score || null,
      },
    });
  }
}
