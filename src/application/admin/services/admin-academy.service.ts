// Admin Academy Service
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import { Prisma } from '@prisma/client';
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
} from '../dto/academy';

@Injectable()
export class AdminAcademyService {
  private readonly logger = new Logger(AdminAcademyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditLogService,
  ) {}

  // ==================== MODULES ====================

  async getModules(query: GetModulesQueryDto): Promise<ModulesListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ModuleWhereInput = {};

    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [modules, total] = await Promise.all([
      this.prisma.module.findMany({
        where,
        orderBy: { order: 'asc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { lessons: true },
          },
        },
      }),
      this.prisma.module.count({ where }),
    ]);

    return {
      modules: modules.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        image: m.image,
        order: m.order,
        visibleForSkillBuilder: m.visibleForSkillBuilder,
        lessonsCount: m._count.lessons,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getModuleById(id: number): Promise<ModuleWithLessonsDto> {
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            resources: true,
          },
        },
        _count: {
          select: { lessons: true },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Módulo con ID ${id} no encontrado`);
    }

    return {
      id: module.id,
      title: module.title,
      description: module.description,
      image: module.image,
      order: module.order,
      visibleForSkillBuilder: module.visibleForSkillBuilder,
      lessonsCount: module._count.lessons,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
      lessons: module.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description ?? undefined,
        duration: lesson.duration,
        contentUrl: lesson.contentUrl ?? undefined,
        order: lesson.order,
        moduleId: lesson.moduleId,
        resources: lesson.resources.map(r => ({
          id: r.id,
          title: r.title,
          fileUrl: r.fileUrl,
          type: r.type,
          size: r.size ?? undefined,
        })),
      })),
    };
  }

  async createModule(
    data: CreateModuleDto,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<ModuleResponseDto> {
    // Get max order
    const maxOrder = await this.prisma.module.aggregate({
      _max: { order: true },
    });

    // Default placeholder image if none provided
    const defaultImage =
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop';

    const module = await this.prisma.module.create({
      data: {
        title: data.title,
        description: data.description,
        image: data.image || defaultImage,
        order: data.order ?? (maxOrder._max.order ?? 0) + 1,
        visibleForSkillBuilder: data.visibleForSkillBuilder ?? false,
      },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    // Log audit
    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'MODULE_CREATED',
      targetType: 'MODULE',
      targetId: module.id.toString(),
      targetName: module.title,
      details: { title: module.title },
      ipAddress: adminInfo.ip,
    });

    return {
      id: module.id,
      title: module.title,
      description: module.description,
      image: module.image,
      order: module.order,
      visibleForSkillBuilder: module.visibleForSkillBuilder,
      lessonsCount: module._count.lessons,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
    };
  }

  async updateModule(
    id: number,
    data: UpdateModuleDto,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<ModuleResponseDto> {
    const existing = await this.prisma.module.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Módulo con ID ${id} no encontrado`);
    }

    const updateData: Prisma.ModuleUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.visibleForSkillBuilder !== undefined)
      updateData.visibleForSkillBuilder = data.visibleForSkillBuilder;

    const module = await this.prisma.module.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    // Log audit
    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'MODULE_UPDATED',
      targetType: 'MODULE',
      targetId: module.id.toString(),
      targetName: module.title,
      details: { changes: data },
      ipAddress: adminInfo.ip,
    });

    return {
      id: module.id,
      title: module.title,
      description: module.description,
      image: module.image,
      order: module.order,
      visibleForSkillBuilder: module.visibleForSkillBuilder,
      lessonsCount: module._count.lessons,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
    };
  }

  async deleteModule(
    id: number,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<{ success: boolean; message: string }> {
    const module = await this.prisma.module.findUnique({ where: { id } });
    if (!module) {
      throw new NotFoundException(`Módulo con ID ${id} no encontrado`);
    }

    await this.prisma.module.delete({ where: { id } });

    // Log audit
    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'MODULE_DELETED',
      targetType: 'MODULE',
      targetId: id.toString(),
      targetName: module.title,
      ipAddress: adminInfo.ip,
    });

    return { success: true, message: 'Módulo eliminado correctamente' };
  }

  // ==================== LESSONS ====================

  async createLesson(
    moduleId: number,
    data: CreateLessonDto,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<LessonResponseDto> {
    const module = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException(`Módulo con ID ${moduleId} no encontrado`);
    }

    // Get max order in module
    const maxOrder = await this.prisma.lesson.aggregate({
      where: { moduleId },
      _max: { order: true },
    });

    const lesson = await this.prisma.lesson.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        duration: data.duration,
        contentUrl: data.contentUrl ?? null,
        order: data.order ?? (maxOrder._max.order ?? 0) + 1,
        moduleId,
      },
      include: {
        resources: true,
      },
    });

    // Log audit
    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'LESSON_CREATED',
      targetType: 'LESSON',
      targetId: lesson.id.toString(),
      targetName: lesson.title,
      details: { moduleId, title: lesson.title },
      ipAddress: adminInfo.ip,
    });

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description ?? undefined,
      duration: lesson.duration,
      contentUrl: lesson.contentUrl ?? undefined,
      order: lesson.order,
      moduleId: lesson.moduleId,
      resources: lesson.resources.map(r => ({
        id: r.id,
        title: r.title,
        fileUrl: r.fileUrl,
        type: r.type,
        size: r.size ?? undefined,
      })),
    };
  }

  async updateLesson(
    lessonId: number,
    data: UpdateLessonDto,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<LessonResponseDto> {
    const existing = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!existing) {
      throw new NotFoundException(`Lección con ID ${lessonId} no encontrada`);
    }

    const updateData: Prisma.LessonUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.contentUrl !== undefined) updateData.contentUrl = data.contentUrl;
    if (data.order !== undefined) updateData.order = data.order;

    const lesson = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: updateData,
      include: {
        resources: true,
      },
    });

    // Log audit
    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'LESSON_UPDATED',
      targetType: 'LESSON',
      targetId: lesson.id.toString(),
      targetName: lesson.title,
      details: { changes: data },
      ipAddress: adminInfo.ip,
    });

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description ?? undefined,
      duration: lesson.duration,
      contentUrl: lesson.contentUrl ?? undefined,
      order: lesson.order,
      moduleId: lesson.moduleId,
      resources: lesson.resources.map(r => ({
        id: r.id,
        title: r.title,
        fileUrl: r.fileUrl,
        type: r.type,
        size: r.size ?? undefined,
      })),
    };
  }

  async deleteLesson(
    lessonId: number,
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<{ success: boolean; message: string }> {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException(`Lección con ID ${lessonId} no encontrada`);
    }

    await this.prisma.lesson.delete({ where: { id: lessonId } });

    // Log audit
    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'LESSON_DELETED',
      targetType: 'LESSON',
      targetId: lessonId.toString(),
      targetName: lesson.title,
      ipAddress: adminInfo.ip,
    });

    return { success: true, message: 'Lección eliminada correctamente' };
  }

  // ==================== LESSON RESOURCES ====================

  async addLessonResource(
    lessonId: number,
    data: CreateLessonResourceDto,
    _adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<LessonResourceDto> {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException(`Lección con ID ${lessonId} no encontrada`);
    }

    const resource = await this.prisma.lessonResource.create({
      data: {
        title: data.title,
        fileUrl: data.fileUrl,
        type: data.type,
        size: data.size ?? null,
        lessonId,
      },
    });

    return {
      id: resource.id,
      title: resource.title,
      fileUrl: resource.fileUrl,
      type: resource.type,
      size: resource.size ?? undefined,
    };
  }

  async deleteLessonResource(
    resourceId: number,
    _adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<{ success: boolean; message: string }> {
    const resource = await this.prisma.lessonResource.findUnique({ where: { id: resourceId } });
    if (!resource) {
      throw new NotFoundException(`Recurso con ID ${resourceId} no encontrado`);
    }

    await this.prisma.lessonResource.delete({ where: { id: resourceId } });

    return { success: true, message: 'Recurso eliminado correctamente' };
  }
}
