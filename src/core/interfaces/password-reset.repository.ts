// src/core/interfaces/password-reset.repository.ts
import type { PasswordReset } from '@prisma/client';

export interface CreatePasswordResetData {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface IPasswordResetRepository {
  create(data: CreatePasswordResetData): Promise<PasswordReset>;
  findByToken(token: string): Promise<PasswordReset | null>;
  findValidByToken(token: string): Promise<PasswordReset | null>;
  markAsUsed(id: string): Promise<PasswordReset>;
  deleteByUserId(userId: string): Promise<void>;
}

export const PASSWORD_RESET_REPOSITORY = Symbol('PASSWORD_RESET_REPOSITORY');
