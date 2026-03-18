// src/infrastructure/http/controllers/admin/admin-subscriptions.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { AdminSubscriptionsService } from '@/application/admin/services/admin-subscriptions.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/application/auth/guards/roles.guard';
import { Roles } from '@/application/auth/decorators/roles.decorator';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';

import {
  GetSubscriptionsQueryDto,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionDto,
  PaginatedSubscriptionsResponseDto,
  DeleteSubscriptionResponseDto,
  CreateSubscriptionResponseDto,
  UpdateSubscriptionResponseDto,
  UserActiveSubscriptionDto,
} from '@/application/admin/dto/subscriptions';

@ApiTags('Admin - Subscriptions')
@Controller('api/admin/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: AdminSubscriptionsService) {}

  /**
   * GET /api/admin/subscriptions
   * Listar subscripciones con paginación y filtros
   */
  @Get()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Listar subscripciones',
    description: 'Obtiene lista paginada de subscripciones. Solo SUPERADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Lista de subscripciones' })
  @ApiResponse({ status: 403, description: 'Solo SUPERADMIN puede ver subscripciones' })
  async getSubscriptions(
    @Query() query: GetSubscriptionsQueryDto,
  ): Promise<PaginatedSubscriptionsResponseDto> {
    return this.subscriptionsService.getSubscriptions(query);
  }

  /**
   * GET /api/admin/subscriptions/:id
   * Obtener una subscripción por ID
   */
  @Get(':id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Obtener subscripción',
    description: 'Obtiene los detalles de una subscripción. Solo SUPERADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID de la subscripción' })
  @ApiResponse({ status: 200, description: 'Detalles de la subscripción' })
  @ApiResponse({ status: 404, description: 'Subscripción no encontrada' })
  async getSubscription(@Param('id') id: string): Promise<SubscriptionDto> {
    return this.subscriptionsService.getSubscriptionById(id);
  }

  /**
   * GET /api/admin/subscriptions/user/:userId/active
   * Obtener subscripción activa de un usuario
   */
  @Get('user/:userId/active')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Obtener subscripción activa de usuario',
    description: 'Obtiene la subscripción activa de un usuario específico. Solo SUPERADMIN.',
  })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Subscripción activa del usuario' })
  @ApiResponse({ status: 404, description: 'No se encontró subscripción activa' })
  async getUserActiveSubscription(
    @Param('userId') userId: string,
  ): Promise<UserActiveSubscriptionDto> {
    return this.subscriptionsService.getUserActiveSubscription(userId);
  }

  /**
   * POST /api/admin/subscriptions
   * Crear una nueva subscripción para un usuario
   */
  @Post()
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear subscripción',
    description: 'Crea una nueva subscripción para un usuario. Solo SUPERADMIN.',
  })
  @ApiResponse({ status: 201, description: 'Subscripción creada' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'El usuario ya tiene una subscripción activa' })
  async createSubscription(
    @Body() dto: CreateSubscriptionDto,
    @CurrentUser() currentUser: JwtPayload,
    @Req() req: Request,
  ): Promise<CreateSubscriptionResponseDto> {
    const adminInfo = {
      adminId: currentUser.userId,
      adminEmail: currentUser.email,
      adminName: currentUser.email,
      ip: req.ip ?? 'unknown',
    };
    return this.subscriptionsService.createSubscription(dto, currentUser.userId, adminInfo);
  }

  /**
   * PATCH /api/admin/subscriptions/:id
   * Actualizar una subscripción
   */
  @Patch(':id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Actualizar subscripción',
    description: 'Actualiza los datos de una subscripción. Solo SUPERADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID de la subscripción' })
  @ApiResponse({ status: 200, description: 'Subscripción actualizada' })
  @ApiResponse({ status: 404, description: 'Subscripción no encontrada' })
  async updateSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
    @CurrentUser() currentUser: JwtPayload,
    @Req() req: Request,
  ): Promise<UpdateSubscriptionResponseDto> {
    const adminInfo = {
      adminId: currentUser.userId,
      adminEmail: currentUser.email,
      adminName: currentUser.email,
      ip: req.ip ?? 'unknown',
    };
    return this.subscriptionsService.updateSubscription(id, dto, adminInfo);
  }

  /**
   * DELETE /api/admin/subscriptions/:id
   * Eliminar una subscripción
   */
  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar subscripción',
    description: 'Elimina una subscripción. Solo SUPERADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID de la subscripción' })
  @ApiResponse({ status: 200, description: 'Subscripción eliminada' })
  @ApiResponse({ status: 404, description: 'Subscripción no encontrada' })
  async deleteSubscription(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @Req() req: Request,
  ): Promise<DeleteSubscriptionResponseDto> {
    const adminInfo = {
      adminId: currentUser.userId,
      adminEmail: currentUser.email,
      adminName: currentUser.email,
      ip: req.ip ?? 'unknown',
    };
    return this.subscriptionsService.deleteSubscription(id, adminInfo);
  }

  /**
   * POST /api/admin/subscriptions/:id/cancel
   * Cancelar una subscripción
   */
  @Post(':id/cancel')
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar subscripción',
    description: 'Cancela una subscripción activa. Solo SUPERADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID de la subscripción' })
  @ApiResponse({ status: 200, description: 'Subscripción cancelada' })
  @ApiResponse({ status: 404, description: 'Subscripción no encontrada' })
  @ApiResponse({ status: 409, description: 'La subscripción ya está cancelada' })
  async cancelSubscription(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @Req() req: Request,
  ): Promise<UpdateSubscriptionResponseDto> {
    const adminInfo = {
      adminId: currentUser.userId,
      adminEmail: currentUser.email,
      adminName: currentUser.email,
      ip: req.ip ?? 'unknown',
    };
    return this.subscriptionsService.cancelSubscription(id, adminInfo);
  }
}
