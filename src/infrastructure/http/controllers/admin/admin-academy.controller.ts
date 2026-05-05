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
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
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
  CreateSectionDto,
  UpdateSectionDto,
  SectionResponseDto,
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

  @Put('modules/reorder')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Reorder modules' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { orderedIds: { type: 'array', items: { type: 'number' } } },
    },
  })
  @ApiResponse({ status: 200, description: 'Modules reordered successfully' })
  async reorderModules(
    @Body() body: { orderedIds: number[] },
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.reorderModules(body.orderedIds, adminInfo);
  }

  @Put('modules/:moduleId/lessons/reorder')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Reorder lessons within a module' })
  @ApiParam({ name: 'moduleId', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { orderedIds: { type: 'array', items: { type: 'number' } } },
    },
  })
  @ApiResponse({ status: 200, description: 'Lessons reordered successfully' })
  async reorderLessons(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() body: { orderedIds: number[] },
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.reorderLessons(moduleId, body.orderedIds, adminInfo);
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

  // ==================== SECTIONS ====================

  @Get('modules/:moduleId/sections')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all sections for a module' })
  @ApiParam({ name: 'moduleId', type: Number })
  @ApiResponse({ status: 200, type: [SectionResponseDto] })
  async getSections(
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ): Promise<SectionResponseDto[]> {
    return this.academyService.getSectionsByModule(moduleId);
  }

  @Post('modules/:moduleId/sections')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new section in a module' })
  @ApiParam({ name: 'moduleId', type: Number })
  @ApiResponse({ status: 201, type: SectionResponseDto })
  async createSection(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() data: CreateSectionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<SectionResponseDto> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.createSection(moduleId, data, adminInfo);
  }

  @Put('modules/:moduleId/sections/reorder')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Reorder sections within a module' })
  @ApiParam({ name: 'moduleId', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { orderedIds: { type: 'array', items: { type: 'number' } } },
    },
  })
  @ApiResponse({ status: 200, description: 'Sections reordered successfully' })
  async reorderSections(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() body: { orderedIds: number[] },
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.reorderSections(moduleId, body.orderedIds, adminInfo);
  }

  @Put('sections/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a section' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: SectionResponseDto })
  async updateSection(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSectionDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<SectionResponseDto> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.updateSection(id, data, adminInfo);
  }

  @Delete('sections/:id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a section (SUPERADMIN only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200 })
  async deleteSection(
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
    return this.academyService.deleteSection(id, adminInfo);
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

  @Post('lessons/:lessonId/resources/upload')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB max
      },
      fileFilter: (
        _req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/webm',
          'audio/mpeg',
          'audio/mp3',
          'text/plain',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}`),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a resource file for a lesson' })
  @ApiParam({ name: 'lessonId', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Resource file' },
      },
    },
  })
  @ApiResponse({ status: 201, type: LessonResourceDto })
  async uploadLessonResource(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<LessonResourceDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.academyService.uploadLessonResource(lessonId, file, adminInfo);
  }
}
