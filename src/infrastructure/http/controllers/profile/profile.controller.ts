// src/infrastructure/http/controllers/profile/profile.controller.ts
import { Controller, Get, Put, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { ProfileService } from '@/application/profile/services/profile.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';
import {
  ProfileResponseDto,
  UpdateProfileDto,
  UpdateProfileResponseDto,
} from '@/application/profile/dto';

@ApiTags('Profile')
@Controller('api/profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * GET /api/profile/me
   * Obtener perfil completo del usuario
   */
  @Get('me')
  @ApiOperation({
    summary: 'Obtener mi perfil',
    description:
      'Retorna datos personales, información de suscripción, estadísticas (clases, lecciones, challenges) y estado de strikes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil completo del usuario',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async getProfile(@CurrentUser() user: JwtPayload): Promise<ProfileResponseDto> {
    return this.profileService.getProfile(user.userId);
  }

  /**
   * PUT /api/profile/me
   * Actualizar perfil del usuario
   */
  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar mi perfil',
    description:
      'Permite actualizar: nombre, apellido, teléfono, ciudad, país. NO permite cambiar: email, reference, role, status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado correctamente',
    type: UpdateProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    return this.profileService.updateProfile(user.userId, dto);
  }
}
