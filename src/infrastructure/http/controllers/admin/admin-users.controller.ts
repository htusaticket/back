// src/infrastructure/http/controllers/admin/admin-users.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { AdminUsersService } from '@/application/admin/services/admin-users.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/application/auth/guards/roles.guard';
import { Roles } from '@/application/auth/decorators/roles.decorator';

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
} from '@/application/admin/dto/users';

@ApiTags('Admin - Users')
@Controller('api/admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  /**
   * GET /api/admin/users
   * Listar usuarios con paginación, búsqueda y filtros
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Listar usuarios',
    description: 'Obtiene lista paginada de usuarios con filtros por nombre/email, rol y estado',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  async getUsers(@Query() query: GetUsersQueryDto): Promise<PaginatedUsersResponseDto> {
    return this.adminUsersService.getUsers(query);
  }

  /**
   * GET /api/admin/users/:id/details
   * Obtener detalles completos de un usuario
   */
  @Get(':id/details')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Obtener detalles de usuario',
    description:
      'Obtiene información detallada incluyendo asistencia %, strikes activos, progreso de cursos',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Detalles del usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getUserDetails(@Param('id') userId: string): Promise<UserDetailDto> {
    return this.adminUsersService.getUserDetails(userId);
  }

  /**
   * POST /api/admin/users
   * Crear nuevo usuario manualmente
   */
  @Post()
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear usuario',
    description: 'Crea un nuevo usuario manualmente (invitación). Solo SUPERADMIN.',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  async createUser(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    return this.adminUsersService.createUser(dto);
  }

  /**
   * PATCH /api/admin/users/:id/status
   * Cambiar estado de usuario (Active/Inactive/Suspended)
   */
  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Cambiar estado de usuario',
    description: 'Actualiza el estado del usuario (PENDING, ACTIVE, SUSPENDED)',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<UpdateStatusResponseDto> {
    return this.adminUsersService.updateUserStatus(userId, dto);
  }

  /**
   * PATCH /api/admin/users/:id
   * Actualizar datos de usuario
   */
  @Patch(':id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Actualizar usuario',
    description: 'Actualiza los datos del usuario incluyendo email (solo SUPERADMIN)',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateUser(
    @Param('id') userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UpdateStatusResponseDto> {
    return this.adminUsersService.updateUser(userId, dto);
  }

  /**
   * POST /api/admin/users/:id/notes
   * Agregar/actualizar notas del administrador
   */
  @Post(':id/notes')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar notas',
    description: 'Agrega o actualiza notas internas sobre el alumno',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Notas actualizadas' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateUserNotes(
    @Param('id') userId: string,
    @Body() dto: UpdateUserNotesDto,
  ): Promise<UpdateStatusResponseDto> {
    return this.adminUsersService.updateUserNotes(userId, dto);
  }

  /**
   * POST /api/admin/users/:id/strike
   * Emitir strike manual a un usuario
   */
  @Post(':id/strike')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Emitir strike',
    description:
      'Emite un strike manual al usuario. Si alcanza el máximo, se suspende automáticamente.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Strike emitido' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async issueStrike(
    @Param('id') userId: string,
    @Body() dto: IssueStrikeDto,
  ): Promise<IssueStrikeResponseDto> {
    return this.adminUsersService.issueStrike(userId, dto);
  }
}
