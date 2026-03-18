// src/infrastructure/http/controllers/admin/admin-classes.controller.ts
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
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { AdminClassesService } from '@/application/admin/services/admin-classes.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/application/auth/guards/roles.guard';
import { Roles } from '@/application/auth/decorators/roles.decorator';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';

import {
  GetClassesQueryDto,
  CreateClassDto,
  SaveAttendanceDto,
  UpdateClassDto,
  PaginatedClassesResponseDto,
  ClassAttendeesResponseDto,
  CreateClassResponseDto,
  SaveAttendanceResponseDto,
  UpdateClassResponseDto,
  DeleteClassResponseDto,
} from '@/application/admin/dto/classes';

@ApiTags('Admin - Classes')
@Controller('api/admin/classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminClassesController {
  constructor(private readonly adminClassesService: AdminClassesService) {}

  /**
   * GET /api/admin/classes
   * Listar clases con calendario
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Listar clases',
    description: 'Obtiene lista de clases con filtros por fecha y tipo',
  })
  @ApiResponse({ status: 200, description: 'Lista de clases' })
  async getClasses(@Query() query: GetClassesQueryDto): Promise<PaginatedClassesResponseDto> {
    return this.adminClassesService.getClasses(query);
  }

  /**
   * POST /api/admin/classes
   * Crear nueva clase
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear clase',
    description: 'Crea una nueva sesión de clase',
  })
  @ApiResponse({ status: 201, description: 'Clase creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async createClass(
    @Body() dto: CreateClassDto,
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ): Promise<CreateClassResponseDto> {
    const adminInfo = { adminId: admin.userId, adminEmail: admin.email, adminName: admin.email, ip: req.ip ?? 'unknown' };
    return this.adminClassesService.createClass(dto, adminInfo);
  }

  /**
   * GET /api/admin/classes/:id/attendees
   * Obtener lista de inscritos en una clase
   */
  @Get(':id/attendees')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Obtener asistentes',
    description: 'Lista de usuarios inscritos en la clase con su estado de asistencia',
  })
  @ApiParam({ name: 'id', description: 'ID de la clase' })
  @ApiResponse({ status: 200, description: 'Lista de asistentes' })
  @ApiResponse({ status: 404, description: 'Clase no encontrada' })
  async getClassAttendees(
    @Param('id', ParseIntPipe) classId: number,
  ): Promise<ClassAttendeesResponseDto> {
    return this.adminClassesService.getClassAttendees(classId);
  }

  /**
   * POST /api/admin/classes/:id/attendance
   * Guardar asistencia de una clase
   */
  @Post(':id/attendance')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Guardar asistencia',
    description:
      'Registra la asistencia de los usuarios. Opcionalmente genera strikes por ausencias.',
  })
  @ApiParam({ name: 'id', description: 'ID de la clase' })
  @ApiResponse({ status: 200, description: 'Asistencia guardada' })
  @ApiResponse({ status: 404, description: 'Clase no encontrada' })
  async saveAttendance(
    @Param('id', ParseIntPipe) classId: number,
    @Body() dto: SaveAttendanceDto,
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ): Promise<SaveAttendanceResponseDto> {
    const adminInfo = { adminId: admin.userId, adminEmail: admin.email, adminName: admin.email, ip: req.ip ?? 'unknown' };
    return this.adminClassesService.saveAttendance(classId, dto, adminInfo);
  }

  /**
   * PATCH /api/admin/classes/:id
   * Actualizar una clase existente
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Actualizar clase',
    description: 'Actualiza una sesión de clase existente',
  })
  @ApiParam({ name: 'id', description: 'ID de la clase' })
  @ApiResponse({ status: 200, description: 'Clase actualizada' })
  @ApiResponse({ status: 404, description: 'Clase no encontrada' })
  async updateClass(
    @Param('id', ParseIntPipe) classId: number,
    @Body() dto: UpdateClassDto,
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ): Promise<UpdateClassResponseDto> {
    const adminInfo = { adminId: admin.userId, adminEmail: admin.email, adminName: admin.email, ip: req.ip ?? 'unknown' };
    return this.adminClassesService.updateClass(classId, dto, adminInfo);
  }

  /**
   * DELETE /api/admin/classes/:id
   * Eliminar una clase
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar clase',
    description: 'Elimina una sesión de clase y sus inscripciones',
  })
  @ApiParam({ name: 'id', description: 'ID de la clase' })
  @ApiResponse({ status: 200, description: 'Clase eliminada' })
  @ApiResponse({ status: 404, description: 'Clase no encontrada' })
  async deleteClass(
    @Param('id', ParseIntPipe) classId: number,
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ): Promise<DeleteClassResponseDto> {
    const adminInfo = { adminId: admin.userId, adminEmail: admin.email, adminName: admin.email, ip: req.ip ?? 'unknown' };
    return this.adminClassesService.deleteClass(classId, adminInfo);
  }
}
