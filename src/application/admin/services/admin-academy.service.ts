// Admin Academy Service
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { CloudflareStorageService } from '@/infrastructure/storage/cloudflare/cloudflare-storage.service';
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
    private readonly storageService: CloudflareStorageService,
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
        status: m.status,
        visibleForSkillBuilder: m.visibleForSkillBuilder,
        visibleForSkillBuilderLive: m.visibleForSkillBuilderLive,
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
      status: module.status,
      visibleForSkillBuilder: module.visibleForSkillBuilder,
      visibleForSkillBuilderLive: module.visibleForSkillBuilderLive,
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
        status: lesson.status,
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
        status: data.status ?? 'DRAFT',
        visibleForSkillBuilder: data.visibleForSkillBuilder ?? false,
        visibleForSkillBuilderLive: data.visibleForSkillBuilderLive ?? false,
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
      status: module.status,
      visibleForSkillBuilder: module.visibleForSkillBuilder,
      visibleForSkillBuilderLive: module.visibleForSkillBuilderLive,
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
    if (data.visibleForSkillBuilderLive !== undefined)
      updateData.visibleForSkillBuilderLive = data.visibleForSkillBuilderLive;
    if (data.status !== undefined) updateData.status = data.status;

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
      status: module.status,
      visibleForSkillBuilder: module.visibleForSkillBuilder,
      visibleForSkillBuilderLive: module.visibleForSkillBuilderLive,
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

    const targetOrder = data.order ?? (maxOrder._max.order ?? 0) + 1;

    // If a lesson already exists with this order, shift subsequent lessons up
    const existingWithOrder = await this.prisma.lesson.findFirst({
      where: { moduleId, order: targetOrder },
    });
    if (existingWithOrder) {
      await this.prisma.lesson.updateMany({
        where: { moduleId, order: { gte: targetOrder } },
        data: { order: { increment: 1 } },
      });
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        duration: data.duration,
        contentUrl: data.contentUrl ?? null,
        order: targetOrder,
        status: data.status ?? 'PUBLISHED',
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
      status: lesson.status,
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
    if (data.status !== undefined) updateData.status = data.status;

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
      status: lesson.status,
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

  async uploadLessonResource(
    lessonId: number,
    file: Express.Multer.File,
    _adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<LessonResourceDto> {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException(`Lección con ID ${lessonId} no encontrada`);
    }

    if (!this.storageService.isReady()) {
      throw new BadRequestException('El servicio de almacenamiento no está configurado');
    }

    // Upload file to Cloudflare R2
    const fileUrl = await this.storageService.uploadLessonResource(
      file.buffer,
      lessonId,
      file.originalname,
      file.mimetype,
    );

    // Determine resource type from mime
    let resourceType: 'PDF' | 'LINK' | 'VIDEO' | 'DOCUMENT' = 'DOCUMENT';
    if (file.mimetype === 'application/pdf') {
      resourceType = 'PDF';
    } else if (file.mimetype.startsWith('video/')) {
      resourceType = 'VIDEO';
    }

    // Format file size
    const sizeInKB = file.size / 1024;
    const sizeStr =
      sizeInKB >= 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${Math.round(sizeInKB)} KB`;

    const resource = await this.prisma.lessonResource.create({
      data: {
        title: file.originalname,
        fileUrl,
        type: resourceType,
        size: sizeStr,
        lessonId,
      },
    });

    this.logger.log(`Resource uploaded for lesson ${lessonId}: ${file.originalname}`);

    return {
      id: resource.id,
      title: resource.title,
      fileUrl: resource.fileUrl,
      type: resource.type,
      size: resource.size ?? undefined,
    };
  }

  async reorderModules(
    orderedIds: number[],
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<{ success: boolean }> {
    // Update each module's order based on array position
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.module.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    );

    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'MODULES_REORDERED',
      targetType: 'MODULE',
      targetId: 'bulk',
      targetName: 'Reorder modules',
      details: { orderedIds },
      ipAddress: adminInfo.ip,
    });

    return { success: true };
  }

  async reorderLessons(
    moduleId: number,
    orderedIds: number[],
    adminInfo: { adminId: string; adminEmail: string; adminName: string; ip?: string },
  ): Promise<{ success: boolean }> {
    const module = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException(`Módulo con ID ${moduleId} no encontrado`);
    }

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.lesson.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    );

    await this.auditService.createLog({
      adminId: adminInfo.adminId,
      adminEmail: adminInfo.adminEmail,
      adminName: adminInfo.adminName,
      action: 'LESSONS_REORDERED',
      targetType: 'LESSON',
      targetId: moduleId.toString(),
      targetName: `Reorder lessons in module ${moduleId}`,
      details: { moduleId, orderedIds },
      ipAddress: adminInfo.ip,
    });

    return { success: true };
  }
}
