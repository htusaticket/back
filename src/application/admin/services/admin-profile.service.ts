import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import {
  AdminProfileDto,
  UpdateAdminProfileDto,
  ChangePasswordDto,
} from '../dto/admin-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminProfileService {
  private readonly logger = new Logger(AdminProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<AdminProfileDto> {
    this.logger.debug(`Fetching profile for admin: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        city: true,
        country: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? undefined,
      city: user.city ?? undefined,
      country: user.country ?? undefined,
      avatar: user.avatar ?? undefined,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as AdminProfileDto;
  }

  async updateProfile(userId: string, data: UpdateAdminProfileDto): Promise<AdminProfileDto> {
    this.logger.debug(`Updating profile for admin: ${userId}`);

    // Get current user to check role
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Build update data only with defined fields
    const updateData: Record<string, string | undefined> = {};

    // Only SUPERADMIN can change email
    if (data.email !== undefined && currentUser.role === 'SUPERADMIN') {
      // Check if email is already in use by another user
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('El email ya está en uso por otro usuario');
      }
      updateData.email = data.email;
    }

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        city: true,
        country: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? undefined,
      city: user.city ?? undefined,
      country: user.country ?? undefined,
      avatar: user.avatar ?? undefined,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as AdminProfileDto;
  }

  async changePassword(
    userId: string,
    data: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.debug(`Changing password for admin: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValidPassword) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Contraseña actualizada correctamente',
    };
  }
}
