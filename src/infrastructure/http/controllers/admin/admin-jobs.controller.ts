// Admin Jobs Controller
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
import { AdminJobsService } from '@/application/admin/services/admin-jobs.service';
import {
  CreateJobOfferDto,
  UpdateJobOfferDto,
  JobOfferResponseDto,
  JobOfferWithApplicationsDto,
  JobOffersListResponseDto,
  GetJobOffersQueryDto,
  BulkCreateJobOfferDto,
  BulkCreateResponseDto,
} from '@/application/admin/dto/jobs';

@ApiTags('Admin Jobs')
@Controller('api/admin/jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminJobsController {
  constructor(private readonly jobsService: AdminJobsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.JOB_UPLOADER)
  @ApiOperation({ summary: 'Get all job offers with pagination' })
  @ApiResponse({ status: 200, type: JobOffersListResponseDto })
  async getJobs(@Query() query: GetJobOffersQueryDto): Promise<JobOffersListResponseDto> {
    return this.jobsService.getJobs(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.JOB_UPLOADER)
  @ApiOperation({ summary: 'Get job offer by ID with applications' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: JobOfferWithApplicationsDto })
  async getJobById(@Param('id', ParseIntPipe) id: number): Promise<JobOfferWithApplicationsDto> {
    return this.jobsService.getJobById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.JOB_UPLOADER)
  @ApiOperation({ summary: 'Create a new job offer' })
  @ApiResponse({ status: 201, type: JobOfferResponseDto })
  async createJob(
    @Body() data: CreateJobOfferDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<JobOfferResponseDto> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.jobsService.createJob(data, adminInfo);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.JOB_UPLOADER)
  @ApiOperation({ summary: 'Update a job offer' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: JobOfferResponseDto })
  async updateJob(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateJobOfferDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<JobOfferResponseDto> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.jobsService.updateJob(id, data, adminInfo);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a job offer (SUPERADMIN only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200 })
  async deleteJob(
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
    return this.jobsService.deleteJob(id, adminInfo);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.JOB_UPLOADER)
  @ApiOperation({ summary: 'Bulk create job offers' })
  @ApiResponse({ status: 201, type: BulkCreateResponseDto })
  async bulkCreateJobs(
    @Body() data: BulkCreateJobOfferDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<BulkCreateResponseDto> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.jobsService.bulkCreateJobs(data, adminInfo);
  }
}
