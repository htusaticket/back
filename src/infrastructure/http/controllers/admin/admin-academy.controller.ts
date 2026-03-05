// Admin Academy Controller
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/application/auth/guards/roles.guard';
import { Roles } from '@/application/auth/decorators/roles.decorator';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';
import { AdminAcademyService } from '@/application/admin/services/admin-academy.service';
import {
  CreateModuleDto,
  UpdateModuleDto,
  ModuleResponseDto,
  ModuleWithLessonsDto,
  ModulesListResponseDto,
  GetModulesQueryDto,
  CreateLessonDto,
  UpdateLessonDto,
  LessonResponseDto,
  CreateLessonResourceDto,
  LessonResourceDto,
} from '@/application/admin/dto/academy';

@ApiTags('Admin Academy')
@Controller('api/admin/academy')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminAcademyController {
  constructor(private readonly academyService: AdminAcademyService) {}

  // ==================== MODULES ====================

  @Get('modules')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all modules with pagination' })
  @ApiResponse({ status: 200, type: ModulesListResponseDto })
  async getModules(@Query() query: GetModulesQueryDto): Promise<ModulesListResponseDto> {
    return this.academyService.getModules(query);
  }

  @Get('modules/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get module by ID with lessons' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: ModuleWithLessonsDto })
  async getModuleById(@Param('id', ParseIntPipe) id: number): Promise<ModuleWithLessonsDto> {
    return this.academyService.getModuleById(id);
  }

  @Post('modules')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new module' })
  @ApiResponse({ status: 201, type: ModuleResponseDto })
  async createModule(
    @Body() data: CreateModuleDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<ModuleResponseDto> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.createModule(data, adminInfo);
  }

  @Put('modules/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a module' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: ModuleResponseDto })
  async updateModule(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateModuleDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<ModuleResponseDto> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.updateModule(id, data, adminInfo);
  }

  @Delete('modules/:id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a module (SUPERADMIN only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200 })
  async deleteModule(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.deleteModule(id, adminInfo);
  }

  // ==================== LESSONS ====================

  @Post('modules/:moduleId/lessons')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new lesson in a module' })
  @ApiParam({ name: 'moduleId', type: Number })
  @ApiResponse({ status: 201, type: LessonResponseDto })
  async createLesson(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() data: CreateLessonDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<LessonResponseDto> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.createLesson(moduleId, data, adminInfo);
  }

  @Put('lessons/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a lesson' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: LessonResponseDto })
  async updateLesson(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateLessonDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<LessonResponseDto> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.updateLesson(id, data, adminInfo);
  }

  @Delete('lessons/:id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a lesson (SUPERADMIN only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200 })
  async deleteLesson(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.deleteLesson(id, adminInfo);
  }

  // ==================== LESSON RESOURCES ====================

  @Post('lessons/:lessonId/resources')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Add a resource to a lesson' })
  @ApiParam({ name: 'lessonId', type: Number })
  @ApiResponse({ status: 201, type: LessonResourceDto })
  async addLessonResource(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() data: CreateLessonResourceDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<LessonResourceDto> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.addLessonResource(lessonId, data, adminInfo);
  }

  @Delete('resources/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a lesson resource' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200 })
  async deleteLessonResource(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.deleteLessonResource(id, adminInfo);
  }
}
