// src/application/admin/services/admin-users.service.ts
import { Injectable, Inject, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { UserStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import {
  IUserRepository,
  USER_REPOSITORY,
  IStrikeRepository,
  STRIKE_REPOSITORY,
  UpdateUserData,
} from '@/core/interfaces';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { getEnvConfig } from '@/config/env.config';

import {
  GetUsersQueryDto,
  CreateUserDto,
  UpdateUserStatusDto,
  UpdateUserNotesDto,
  IssueStrikeDto,
  UpdateUserDto,
  PaginatedUsersResponseDto,
  UserDetailDto,
  CreateUserResponseDto,
  UpdateStatusResponseDto,
  IssueStrikeResponseDto,
  UserStatsDto,
  ModuleProgressDto,
  StrikeDetailDto,
} from '../dto/users';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);
  private readonly env = getEnvConfig();

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(STRIKE_REPOSITORY)
    private readonly strikeRepository: IStrikeRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Obtener lista paginada de usuarios con filtros
   */
  async getUsers(query: GetUsersQueryDto): Promise<PaginatedUsersResponseDto> {
    this.logger.debug(`Fetching users with query: ${JSON.stringify(query)}`);

    const result = await this.userRepository.findMany({
      ...(query.search && { search: query.search }),
      ...(query.role && { role: query.role }),
      ...(query.status && { status: query.status }),
      ...(query.plan && { plan: query.plan }),
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    });

    return {
      users: result.users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        plan: user.plan,
        createdAt: user.createdAt,
        lastLogin: null,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Obtener detalles completos de un usuario
   */
  async getUserDetails(userId: string): Promise<UserDetailDto> {
    this.logger.debug(`Fetching details for user: ${userId}`);

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Obtener estadísticas
    const stats = await this.getUserStats(userId);

    // Obtener strikes
    const strikeInfo = await this.strikeRepository.getStrikeInfo(userId);
    const strikesHistory = await this.strikeRepository.findByUserIdWithDetails(userId);

    // Obtener progreso de módulos
    const moduleProgress = await this.getModuleProgress(userId);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      city: user.city,
      country: user.country,
      reference: user.reference,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      plan: user.plan,
      startDate: user.startDate,
      endDate: user.endDate,
      adminNotes: user.adminNotes,
      createdAt: user.createdAt,
      stats,
      strikes: {
        count: strikeInfo.strikesCount,
        maxStrikes: strikeInfo.maxStrikes,
        resetDate: strikeInfo.resetDate,
        history: strikesHistory.map(
          (s): StrikeDetailDto => ({
            id: s.id,
            reason: s.reason,
            isManual: s.isManual,
            classTitle: s.classSession?.title ?? null,
            createdAt: s.createdAt,
          }),
        ),
      },
      moduleProgress,
    };
  }

  /**
   * Crear un nuevo usuario (invitación manual)
   */
  async createUser(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    this.logger.log(`Creating user with email: ${dto.email}`);

    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hashear password
    const hashedPassword = await bcrypt.hash(dto.password, this.env.BCRYPT_SALT_ROUNDS);

    // Crear usuario
    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      role: dto.role ?? UserRole.USER,
      status: UserStatus.ACTIVE,
      ...(dto.plan && { plan: dto.plan }),
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    });

    this.logger.log(`User created successfully: ${user.id}`);

    return {
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        plan: user.plan,
        createdAt: user.createdAt,
        lastLogin: null,
      },
    };
  }

  /**
   * Actualizar el estado de un usuario
   */
  async updateUserStatus(
    userId: string,
    dto: UpdateUserStatusDto,
  ): Promise<UpdateStatusResponseDto> {
    this.logger.log(`Updating status for user ${userId} to ${dto.status}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.updateStatus(userId, dto.status);

    return {
      success: true,
      message: `Estado del usuario actualizado a ${dto.status}`,
    };
  }

  /**
   * Actualizar datos de un usuario
   */
  async updateUser(userId: string, dto: UpdateUserDto): Promise<UpdateStatusResponseDto> {
    this.logger.log(`Updating user ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Check if email is being changed and if it's already in use
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException('El email ya está en uso por otro usuario');
      }
    }

    const updateData: UpdateUserData = {};
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.plan !== undefined) updateData.plan = dto.plan;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);

    await this.userRepository.update(userId, updateData);

    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
    };
  }

  /**
   * Actualizar notas del administrador
   */
  async updateUserNotes(userId: string, dto: UpdateUserNotesDto): Promise<UpdateStatusResponseDto> {
    this.logger.log(`Updating notes for user ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.updateNotes(userId, dto.notes);

    return {
      success: true,
      message: 'Notas actualizadas exitosamente',
    };
  }

  /**
   * Emitir un strike manual
   */
  async issueStrike(userId: string, dto: IssueStrikeDto): Promise<IssueStrikeResponseDto> {
    this.logger.log(`Issuing manual strike to user ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Crear el strike
    const strike = await this.strikeRepository.createManual(userId, dto.reason, dto.classSessionId);

    // Verificar si el usuario debe ser suspendido
    const strikeInfo = await this.strikeRepository.getStrikeInfo(userId);
    let userSuspended = false;

    if (strikeInfo.strikesCount >= strikeInfo.maxStrikes) {
      await this.userRepository.updateStatus(userId, UserStatus.SUSPENDED);
      userSuspended = true;
      this.logger.warn(`User ${userId} has been suspended due to reaching max strikes`);
    }

    return {
      success: true,
      message: userSuspended
        ? `Strike emitido. El usuario ha sido suspendido por alcanzar ${strikeInfo.maxStrikes} strikes.`
        : 'Strike emitido exitosamente',
      strikeId: strike.id,
      totalStrikes: strikeInfo.strikesCount,
      userSuspended,
    };
  }

  /**
   * Obtener estadísticas de un usuario
   */
  private async getUserStats(userId: string): Promise<UserStatsDto> {
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
      },
      select: {
        attendanceStatus: true,
      },
    });

    const totalClassesEnrolled = enrollments.length;
    const totalClassesAttended = enrollments.filter(
      e => e.attendanceStatus === 'PRESENT' || e.attendanceStatus === 'LATE',
    ).length;

    const attendancePercentage =
      totalClassesEnrolled > 0
        ? Math.round((totalClassesAttended / totalClassesEnrolled) * 100)
        : 0;

    const moduleProgress = await this.prisma.userModuleProgress.findMany({
      where: { userId },
    });

    const totalModules = await this.prisma.module.count();
    const modulesCompleted = moduleProgress.filter(m => m.progress === 100).length;

    const challengesCompleted = await this.prisma.userDailyChallengeProgress.count({
      where: {
        userId,
        completed: true,
      },
    });

    return {
      attendancePercentage,
      totalClassesEnrolled,
      totalClassesAttended,
      modulesCompleted,
      totalModules,
      challengesCompleted,
    };
  }

  /**
   * Obtener progreso de módulos de un usuario
   */
  private async getModuleProgress(userId: string): Promise<ModuleProgressDto[]> {
    const modules = await this.prisma.module.findMany({
      orderBy: { order: 'asc' },
      include: {
        userProgress: {
          where: { userId },
          take: 1,
        },
      },
    });

    return modules.map(module => {
      const progress = module.userProgress[0]?.progress ?? 0;
      let status: 'Completed' | 'In Progress' | 'Not Started' = 'Not Started';

      if (progress === 100) {
        status = 'Completed';
      } else if (progress > 0) {
        status = 'In Progress';
      }

      return {
        moduleId: module.id,
        moduleTitle: module.title,
        progress,
        status,
      };
    });
  }
}
