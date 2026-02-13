// src/infrastructure/http/controllers/academy/academy.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { AcademyService } from '@/application/academy/services/academy.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';
import {
  AcademyOverviewDto,
  LessonDetailDto,
  ToggleLessonCompleteDto,
} from '@/application/academy/dto';

@ApiTags('Academy')
@Controller('api/academy')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  /**
   * GET /api/academy/overview
   * Obtener vista general de la Academy con estadísticas y módulos
   */
  @Get('overview')
  @ApiOperation({
    summary: 'Obtener vista general de la Academy',
    description:
      'Retorna lista de módulos con progreso del usuario, lecciones completadas y estadísticas globales (Overall Progress, Lessons Completed, Total Time)',
  })
  @ApiResponse({
    status: 200,
    description: 'Vista general de la Academy',
    type: AcademyOverviewDto,
  })
  async getOverview(@CurrentUser() user: JwtPayload): Promise<AcademyOverviewDto> {
    return this.academyService.getOverview(user.userId);
  }

  /**
   * GET /api/lessons/:id
   * Obtener detalle de una lección específica
   */
  @Get('lessons/:id')
  @ApiOperation({
    summary: 'Obtener detalle de una lección',
    description:
      'Retorna video URL, descripción, recursos descargables, estado de completado y navegación (previous/next lesson)',
  })
  @ApiParam({ name: 'id', description: 'ID de la lección', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la lección',
    type: LessonDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Lección no encontrada',
  })
  async getLessonDetail(
    @Param('id', ParseIntPipe) lessonId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<LessonDetailDto> {
    return this.academyService.getLessonDetail(lessonId, user.userId);
  }

  /**
   * POST /api/lessons/:id/toggle-complete
   * Marcar/desmarcar lección como vista
   */
  @Post('lessons/:id/toggle-complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alternar estado de completado de una lección',
    description:
      'Marca o desmarca una lección como vista. Recalcula automáticamente el progreso del módulo.',
  })
  @ApiParam({ name: 'id', description: 'ID de la lección', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado correctamente',
    type: ToggleLessonCompleteDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Lección no encontrada',
  })
  async toggleLessonComplete(
    @Param('id', ParseIntPipe) lessonId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ToggleLessonCompleteDto> {
    return this.academyService.toggleLessonComplete(lessonId, user.userId);
  }
}
