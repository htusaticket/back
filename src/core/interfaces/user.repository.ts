// src/core/interfaces/user.repository.ts
import type { User, UserStatus, UserRole } from '@prisma/client';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  reference?: string | null;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  country?: string;
  reference?: string;
  avatar?: string;
  password?: string;
  status?: UserStatus;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  updatePassword(id: string, hashedPassword: string): Promise<User>;
  updateStatus(id: string, status: UserStatus): Promise<User>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
