// src/application/profile/services/profile.service.ts
import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import {
  IUserRepository,
  USER_REPOSITORY,
  IStrikeRepository,
  STRIKE_REPOSITORY,
} from '@/core/interfaces';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import {
  ProfileResponseDto,
  UpdateProfileDto,
  UpdateProfileResponseDto,
  UserProfileDto,
} from '../dto';

const MAX_STRIKES = 3;

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

    // Obtener stats y strikes en paralelo
    const [stats, strikeInfo] = await Promise.all([
      this.getProfileStats(userId),
      this.strikeRepository.getStrikeInfo(userId),
    ]);

    // Verificar si debe suspenderse por strikes
    if (strikeInfo.strikesCount >= MAX_STRIKES && user.status === UserStatus.ACTIVE) {
      await this.userRepository.updateStatus(userId, UserStatus.SUSPENDED);
      this.logger.warn(`Usuario ${userId} suspendido por alcanzar ${MAX_STRIKES} strikes`);
    }

    // Formatear fecha de membresía
    const memberSince = user.createdAt.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    // Determinar plan de suscripción basado en el campo plan del usuario o rol
    const plan =
      user.plan || (user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? 'Staff' : 'PRO');

    return {
      user: this.mapUserToDto(user),
      subscription: {
        plan,
        memberSince,
      },
      stats,
      strikes: strikeInfo,
    };
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
    const [completedClasses, completedLessons, completedChallenges] = await Promise.all([
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
      // Lecciones completadas
      this.prisma.userLessonProgress.count({
        where: {
          userId,
          completed: true,
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
      completedLessons,
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
