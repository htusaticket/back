// src/infrastructure/http/controllers/admin/admin-users.controller.ts
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

import { AdminUsersService } from '@/application/admin/services/admin-users.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/application/auth/guards/roles.guard';
import { Roles } from '@/application/auth/decorators/roles.decorator';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';

import {
  GetUsersQueryDto,
  CreateUserDto,
  UpdateUserStatusDto,
  UpdateUserNotesDto,
  IssueStrikeDto,
  UpdateUserDto,
  RejectRegistrationDto,
  ApproveRegistrationDto,
  PaginatedUsersResponseDto,
  UserDetailDto,
  CreateUserResponseDto,
  UpdateStatusResponseDto,
  IssueStrikeResponseDto,
  ApproveRegistrationResponseDto,
  RejectRegistrationResponseDto,
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
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ): Promise<CreateUserResponseDto> {
    const adminInfo = { adminId: admin.userId, adminEmail: admin.email, adminName: admin.email, ip: req.ip ?? 'unknown' };
    return this.adminUsersService.createUser(dto, adminInfo);
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
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ): Promise<UpdateStatusResponseDto> {
    const adminInfo = { adminId: admin.userId, adminEmail: admin.email, adminName: admin.email, ip: req.ip ?? 'unknown' };
    return this.adminUsersService.updateUserStatus(userId, dto, adminInfo);
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
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ): Promise<UpdateStatusResponseDto> {
    const adminInfo = { adminId: admin.userId, adminEmail: admin.email, adminName: admin.email, ip: req.ip ?? 'unknown' };
    return this.adminUsersService.updateUser(userId, dto, adminInfo);
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
    @CurrentUser() admin: JwtPayload,
  ): Promise<UpdateStatusResponseDto> {
    return this.adminUsersService.updateUserNotes(userId, dto, admin.userId);
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
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ): Promise<IssueStrikeResponseDto> {
    const adminInfo = { adminId: admin.userId, adminEmail: admin.email, adminName: admin.email, ip: req.ip ?? 'unknown' };
    return this.adminUsersService.issueStrike(userId, dto, adminInfo);
  }

  /**
   * POST /api/admin/users/:id/approve
   * Aprobar un registro pendiente con plan obligatorio (PENDING → ACTIVE)
   * Solo SUPERADMIN puede aprobar usuarios
   */
  @Post(':id/approve')
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprobar registro con plan',
    description:
      'Aprueba un registro pendiente asignando un plan obligatorio. El usuario pasa a ACTIVE con acceso según su plan.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Registro aprobado con plan asignado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'El usuario no está en estado PENDING' })
  async approveRegistration(
    @Param('id') userId: string,
    @Body() dto: ApproveRegistrationDto,
    @CurrentUser() admin: JwtPayload,
  ): Promise<ApproveRegistrationResponseDto> {
    return this.adminUsersService.approveRegistration(userId, dto, admin.userId);
  }

  /**
   * DELETE /api/admin/users/:id/reject
   * Rechazar un registro pendiente (elimina de la BD)
   */
  @Delete(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rechazar registro',
    description:
      'Rechaza un registro pendiente. Se envía email con el motivo y se elimina el usuario de la BD.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Registro rechazado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'El usuario no está en estado PENDING' })
  async rejectRegistration(
    @Param('id') userId: string,
    @Body() dto: RejectRegistrationDto,
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ): Promise<RejectRegistrationResponseDto> {
    const adminInfo = { adminId: admin.userId, adminEmail: admin.email, adminName: admin.email, ip: req.ip ?? 'unknown' };
    return this.adminUsersService.rejectRegistration(userId, dto, adminInfo);
  }

  /**
   * POST /api/admin/users/:id/suspend
   * Suspender (banear) un usuario - Solo SUPERADMIN
   */
  @Post(':id/suspend')
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspender usuario (ban)',
    description:
      'Suspende (banea) un usuario. Solo SUPERADMIN. El usuario no podrá acceder a la plataforma.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario suspendido' })
  @ApiResponse({ status: 403, description: 'Solo SUPERADMIN puede suspender usuarios' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'El usuario ya está suspendido' })
  async suspendUser(
    @Param('id') userId: string,
    @Body() dto: { reason?: string },
    @CurrentUser() currentUser: JwtPayload,
    @Req() req: Request,
  ): Promise<UpdateStatusResponseDto> {
    const adminInfo = { adminId: currentUser.userId, adminEmail: currentUser.email, adminName: currentUser.email, ip: req.ip ?? 'unknown' };
    return this.adminUsersService.suspendUser(userId, currentUser.role as UserRole, dto?.reason, adminInfo);
  }

  /**
   * POST /api/admin/users/:id/unsuspend
   * Quitar suspensión a un usuario - Solo SUPERADMIN
   */
  @Post(':id/unsuspend')
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quitar suspensión (unban)',
    description:
      'Quita la suspensión a un usuario. Solo SUPERADMIN. El usuario podrá volver a acceder.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Suspensión removida' })
  @ApiResponse({ status: 403, description: 'Solo SUPERADMIN puede quitar suspensiones' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'El usuario no está suspendido' })
  async unsuspendUser(
    @Param('id') userId: string,
    @CurrentUser() currentUser: JwtPayload,
    @Req() req: Request,
  ): Promise<UpdateStatusResponseDto> {
    const adminInfo = { adminId: currentUser.userId, adminEmail: currentUser.email, adminName: currentUser.email, ip: req.ip ?? 'unknown' };
    return this.adminUsersService.unsuspendUser(userId, currentUser.role as UserRole, adminInfo);
  }

  /**
   * DELETE /api/admin/users/:id
   * Eliminar permanentemente un usuario/admin y todas sus relaciones - Solo SUPERADMIN
   */
  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar usuario permanentemente',
    description:
      'Elimina un usuario/admin completamente de la BD junto con todas sus relaciones. Solo SUPERADMIN. Esta acción es irreversible.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado permanentemente' })
  @ApiResponse({
    status: 403,
    description: 'No se puede eliminar al propio usuario o a otro SUPERADMIN',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async deleteUser(
    @Param('id') userId: string,
    @CurrentUser() currentUser: JwtPayload,
    @Req() req: Request,
  ): Promise<UpdateStatusResponseDto> {
    const adminInfo = { adminId: currentUser.userId, adminEmail: currentUser.email, adminName: currentUser.email, ip: req.ip ?? 'unknown' };
    return this.adminUsersService.deleteUser(
      userId,
      currentUser.userId,
      currentUser.role as UserRole,
      adminInfo,
    );
  }

  /**
   * POST /api/admin/users/:id/remove-punishment
   * Quitar castigo a un usuario - Solo SUPERADMIN
   */
  @Post(':id/remove-punishment')
  @Roles(UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quitar castigo',
    description: 'Quita el castigo a un usuario y resetea sus strikes. Solo SUPERADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Castigo removido y strikes reseteados' })
  @ApiResponse({ status: 403, description: 'Solo SUPERADMIN puede quitar castigos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async removePunishment(
    @Param('id') userId: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<UpdateStatusResponseDto> {
    return this.adminUsersService.removePunishment(userId, currentUser.role as UserRole);
  }
}
