// src/infrastructure/persistence/prisma/repositories/strike.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IStrikeRepository, Strike } from '@/core/interfaces';

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

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.strike.count({
      where: { userId },
    });
  }
}
