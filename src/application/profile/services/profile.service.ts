// src/application/profile/services/profile.service.ts
import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { SubscriptionStatus, UserPlan } from '@prisma/client';
import {
  IUserRepository,
  USER_REPOSITORY,
  IStrikeRepository,
  STRIKE_REPOSITORY,
} from '@/core/interfaces';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { getPlanFeatures, PlanFeatures } from '@/config/plans.config';
import {
  ProfileResponseDto,
  UpdateProfileDto,
  UpdateProfileResponseDto,
  UserProfileDto,
} from '../dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(STRIKE_REPOSITORY)
    private readonly strikeRepository: IStrikeRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Obtener perfil completo del usuario con stats y strikes
   */
  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Obtener subscripción activa
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Obtener stats, strikes y config del sistema en paralelo
    const [stats, strikeInfo, systemConfig] = await Promise.all([
      this.getProfileStats(userId),
      this.strikeRepository.getStrikeInfo(userId),
      this.getSystemConfig(),
    ]);

    // Formatear fecha de membresía
    const memberSince = user.createdAt.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    // Determinar plan de suscripción basado en subscripción activa o rol
    const plan =
      activeSubscription?.plan ||
      (user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? 'Staff' : null);

    // Obtener features del plan
    const planFeatures = this.getPlanFeaturesForUser(plan);

    return {
      user: this.mapUserToDto(user),
      subscription: {
        plan,
        memberSince,
        hasActiveSubscription: !!activeSubscription,
        startDate: activeSubscription?.startDate || null,
        endDate: activeSubscription?.endDate || null,
      },
      stats,
      strikes: strikeInfo,
      isPunished: user.isPunished,
      punishedUntil: user.punishedUntil,
      planFeatures,
      systemSettings: {
        strikesEnabled: systemConfig.strikesEnabled,
        jobBoardEnabled: systemConfig.jobBoardEnabled,
        academyEnabled: systemConfig.academyEnabled,
      },
    };
  }

  /**
   * Obtener configuración del sistema
   */
  private async getSystemConfig() {
    const config = await this.prisma.systemConfig.findUnique({
      where: { id: 'default' },
    });

    // Si no existe, devolver valores por defecto
    if (!config) {
      return {
        strikesEnabled: false,
        jobBoardEnabled: true,
        academyEnabled: true,
      };
    }

    return config;
  }

  /**
   * Obtener features del plan para el usuario
   */
  private getPlanFeaturesForUser(plan: UserPlan | 'Staff' | null): PlanFeatures {
    // Staff (admin/superadmin) tiene acceso completo
    if (plan === 'Staff') {
      return {
        academy: true,
        challenges: true,
        liveClasses: true,
        jobBoard: true,
      };
    }

    // Sin plan = sin acceso
    if (!plan) {
      return {
        academy: false,
        challenges: false,
        liveClasses: false,
        jobBoard: false,
      };
    }

    return getPlanFeatures(plan);
  }

  /**
   * Actualizar perfil del usuario
   * Solo permite actualizar: firstName, lastName, phone, city, country
   * NO permite: email, reference, role, status
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UpdateProfileResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Solo actualizar campos permitidos
    const updateData: Record<string, string | undefined> = {};

    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.country !== undefined) updateData.country = dto.country;

    const updatedUser = await this.userRepository.update(userId, updateData);

    this.logger.log(`Usuario ${userId} actualizó su perfil`);

    return {
      success: true,
      message: 'Perfil actualizado correctamente',
      user: this.mapUserToDto(updatedUser),
    };
  }

  /**
   * Obtener estadísticas del perfil
   */
  private async getProfileStats(userId: string) {
    const [completedClasses, jobApplications, completedChallenges] = await Promise.all([
      // Clases completadas: clases pasadas donde el usuario estuvo inscrito (CONFIRMED)
      this.prisma.classEnrollment.count({
        where: {
          userId,
          status: 'CONFIRMED',
          classSession: {
            endTime: { lt: new Date() },
          },
        },
      }),
      // Cantidad de job applications del usuario
      this.prisma.jobApplication.count({
        where: {
          userId,
        },
      }),
      // Challenges completados (completed = true)
      this.prisma.userDailyChallengeProgress.count({
        where: {
          userId,
          completed: true,
        },
      }),
    ]);

    return {
      completedClasses,
      jobApplications,
      completedChallenges,
    };
  }

  /**
   * Mapear usuario a DTO
   */
  private mapUserToDto(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    city: string | null;
    country: string | null;
    reference: string | null;
    avatar: string | null;
    role: string;
    status: string;
    createdAt: Date;
  }): UserProfileDto {
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
      createdAt: user.createdAt,
    };
  }
}
