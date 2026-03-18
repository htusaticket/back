import { Controller, Get, Put, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/application/auth/guards/roles.guard';
import { Roles } from '@/application/auth/decorators/roles.decorator';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';
import { AdminProfileService } from '@/application/admin/services/admin-profile.service';
import {
  AdminProfileDto,
  UpdateAdminProfileDto,
  ChangePasswordDto,
} from '@/application/admin/dto/admin-profile.dto';

@ApiTags('Admin Profile')
@Controller('api/admin/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminProfileController {
  private readonly logger = new Logger(AdminProfileController.name);

  constructor(private readonly profileService: AdminProfileService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.JOB_UPLOADER)
  @ApiOperation({ summary: 'Get current admin profile' })
  @ApiResponse({ status: 200, type: AdminProfileDto })
  async getProfile(@CurrentUser() user: JwtPayload): Promise<AdminProfileDto> {
    this.logger.debug(`Getting profile for admin: ${user.email}`);
    return this.profileService.getProfile(user.userId);
  }

  @Put()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.JOB_UPLOADER)
  @ApiOperation({ summary: 'Update admin profile' })
  @ApiResponse({ status: 200, type: AdminProfileDto })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() data: UpdateAdminProfileDto,
  ): Promise<AdminProfileDto> {
    this.logger.debug(`Updating profile for admin: ${user.email}`);
    return this.profileService.updateProfile(user.userId, data);
  }

  @Put('password')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.JOB_UPLOADER)
  @ApiOperation({ summary: 'Change admin password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() data: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.debug(`Changing password for admin: ${user.email}`);
    return this.profileService.changePassword(user.userId, data);
  }
}
