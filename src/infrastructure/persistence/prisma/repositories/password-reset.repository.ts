// src/infrastructure/persistence/prisma/repositories/password-reset.repository.ts
import { Injectable } from '@nestjs/common';
import { PasswordReset } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  IPasswordResetRepository,
  CreatePasswordResetData,
} from '@/core/interfaces/password-reset.repository';

@Injectable()
export class PrismaPasswordResetRepository implements IPasswordResetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePasswordResetData): Promise<PasswordReset> {
    return this.prisma.passwordReset.create({
      data,
    });
  }

  async findByToken(token: string): Promise<PasswordReset | null> {
    return this.prisma.passwordReset.findUnique({
      where: { token },
    });
  }

  async findValidByToken(token: string): Promise<PasswordReset | null> {
    return this.prisma.passwordReset.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async markAsUsed(id: string): Promise<PasswordReset> {
    return this.prisma.passwordReset.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.passwordReset.deleteMany({
      where: { userId },
    });
  }
}
