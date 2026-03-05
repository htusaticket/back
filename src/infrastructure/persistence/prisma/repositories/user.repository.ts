// src/infrastructure/persistence/prisma/repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import { User, UserStatus, UserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
  FindUsersOptions,
  PaginatedUsers,
} from '@/core/interfaces/user.repository';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findAllByRole(role: UserRole): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role, status: 'ACTIVE' },
    });
  }

  async findMany(options: FindUsersOptions): Promise<PaginatedUsers> {
    const { search, role, status, page = 1, limit = 10 } = options;

    const where: Prisma.UserWhereInput = {};

    // Filtro de búsqueda por nombre o email
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtros adicionales
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
      },
    });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async updateNotes(id: string, notes: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { adminNotes: notes },
    });
  }
}
