// src/infrastructure/persistence/prisma/repositories/strike.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IStrikeRepository, Strike, StrikeInfo, StrikeWithDetails } from '@/core/interfaces';

const MAX_STRIKES = 3;
const STRIKE_RESET_DAYS = 14;

@Injectable()
export class PrismaStrikeRepository implements IStrikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    classSessionId: number,
    reason = 'LATE_CANCELLATION',
  ): Promise<Strike> {
    return this.prisma.strike.create({
      data: {
        userId,
        classSessionId,
        reason,
        isManual: false,
      },
    });
  }

  async createManual(userId: string, reason: string, classSessionId?: number): Promise<Strike> {
    return this.prisma.strike.create({
      data: {
        userId,
        classSessionId: classSessionId ?? null,
        reason,
        isManual: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Strike[]> {
    return this.prisma.strike.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUserIdWithDetails(userId: string): Promise<StrikeWithDetails[]> {
    const strikes = await this.prisma.strike.findMany({
      where: { userId },
      include: {
        classSession: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return strikes as StrikeWithDetails[];
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.strike.count({
      where: { userId },
    });
  }

  async findLastByUserId(userId: string): Promise<Strike | null> {
    return this.prisma.strike.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStrikeInfo(userId: string): Promise<StrikeInfo> {
    // Obtener la configuración del sistema (o usar valores por defecto)
    const config = await this.prisma.systemConfig.findFirst();
    const maxStrikes = config?.maxStrikesForSuspension ?? MAX_STRIKES;

    // Obtener el último strike
    const lastStrike = await this.findLastByUserId(userId);

    if (!lastStrike) {
      return {
        strikesCount: 0,
        maxStrikes,
        resetDate: null,
      };
    }

    // Calcular fecha de reseteo (14 días desde el último strike)
    const resetDate = new Date(lastStrike.createdAt);
    resetDate.setDate(resetDate.getDate() + STRIKE_RESET_DAYS);

    const now = new Date();

    // Si ya pasó la fecha de reseteo, no hay strikes activos
    if (now > resetDate) {
      return {
        strikesCount: 0,
        maxStrikes,
        resetDate: null,
      };
    }

    // Contar strikes dentro del período de 14 días desde el último
    const periodStart = new Date(lastStrike.createdAt);
    periodStart.setDate(periodStart.getDate() - STRIKE_RESET_DAYS);

    const strikesCount = await this.prisma.strike.count({
      where: {
        userId,
        createdAt: {
          gte: periodStart,
        },
      },
    });

    return {
      strikesCount: Math.min(strikesCount, maxStrikes),
      maxStrikes,
      resetDate: resetDate.toISOString(),
    };
  }
}
