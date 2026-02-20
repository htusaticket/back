// src/infrastructure/http/controllers/jobs/jobs.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { JobsService } from '@/application/jobs/services/jobs.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';
import { JobFiltersDto, JobListResponseDto, ApplyResponseDto } from '@/application/jobs/dto';

@ApiTags('Jobs')
@Controller('api/jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * GET /api/jobs
   * Obtener listado de ofertas de trabajo con filtros
   */
  @Get()
  @ApiOperation({
    summary: 'Listar ofertas de trabajo',
    description:
      'Retorna lista de ofertas de trabajo activas con filtros opcionales por búsqueda (título/empresa), tipo y ordenamiento.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar por título o empresa',
    example: 'Frontend',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filtrar por tipo de trabajo',
    example: 'Full-time',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Ordenar resultados',
    enum: [
      'best_match',
      'newest_first',
      'oldest_first',
      'highest_ote',
      'lowest_ote',
      'highest_revenue',
      'lowest_revenue',
    ],
    example: 'newest_first',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ofertas con estadísticas',
    type: JobListResponseDto,
  })
  async getJobs(
    @CurrentUser() user: JwtPayload,
    @Query() filters: JobFiltersDto,
  ): Promise<JobListResponseDto> {
    return this.jobsService.getJobs(user.userId, filters);
  }

  /**
   * POST /api/jobs/:id/apply
   * Aplicar a una oferta de trabajo
   */
  @Post(':id/apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aplicar a una oferta',
    description:
      'Crea una aplicación a la oferta de trabajo especificada. Retorna error si ya aplicó.',
  })
  @ApiParam({ name: 'id', description: 'ID de la oferta de trabajo', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Aplicación exitosa',
    type: ApplyResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Oferta no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya aplicó a esta oferta o la oferta no está disponible',
  })
  async applyToJob(
    @Param('id', ParseIntPipe) jobId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApplyResponseDto> {
    return this.jobsService.applyToJob(user.userId, jobId);
  }
}
