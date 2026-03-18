// src/infrastructure/http/controllers/admin/admin-submissions.controller.ts
import {
  Controller,
  Get,
  Post,
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

import { AdminSubmissionsService } from '@/application/admin/services/admin-submissions.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/application/auth/guards/roles.guard';
import { Roles } from '@/application/auth/decorators/roles.decorator';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';

import {
  GetSubmissionsQueryDto,
  ReviewSubmissionDto,
  PaginatedSubmissionsResponseDto,
  ReviewSubmissionResponseDto,
} from '@/application/admin/dto/submissions';

@ApiTags('Admin - Submissions')
@Controller('api/admin/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminSubmissionsController {
  constructor(private readonly adminSubmissionsService: AdminSubmissionsService) {}

  /**
   * GET /api/admin/submissions
   * Listar submissions de audio para revisión
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Listar submissions',
    description: 'Obtiene lista de submissions de audio pendientes de revisión o historial',
  })
  @ApiResponse({ status: 200, description: 'Lista de submissions' })
  async getSubmissions(
    @Query() query: GetSubmissionsQueryDto,
  ): Promise<PaginatedSubmissionsResponseDto> {
    return this.adminSubmissionsService.getSubmissions(query);
  }

  /**
   * POST /api/admin/submissions/:id/review
   * Revisar/calificar una submission
   */
  @Post(':id/review')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revisar submission',
    description: 'Envía feedback y calificación para una submission de audio',
  })
  @ApiParam({ name: 'id', description: 'ID de la submission' })
  @ApiResponse({ status: 200, description: 'Feedback enviado' })
  @ApiResponse({ status: 404, description: 'Submission no encontrada' })
  async reviewSubmission(
    @Param('id') submissionId: string,
    @Body() dto: ReviewSubmissionDto,
    @CurrentUser() admin: JwtPayload,
    @Req() req: Request,
  ): Promise<ReviewSubmissionResponseDto> {
    const adminInfo = { adminId: admin.userId, adminEmail: admin.email, adminName: admin.email, ip: req.ip ?? 'unknown' };
    return this.adminSubmissionsService.reviewSubmission(submissionId, dto, adminInfo);
  }
}
