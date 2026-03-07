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
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  reference?: string | null;
  avatar?: string | null;
  password?: string;
  status?: UserStatus;
  role?: UserRole;
  adminNotes?: string | null;
  isPunished?: boolean;
  punishedUntil?: Date | null;
}

export interface FindUsersOptions {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAllByRole(role: UserRole): Promise<User[]>;
  findMany(options: FindUsersOptions): Promise<PaginatedUsers>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  updatePassword(id: string, hashedPassword: string): Promise<User>;
  updateStatus(id: string, status: UserStatus): Promise<User>;
  updateNotes(id: string, notes: string): Promise<User>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
