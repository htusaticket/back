// Admin Challenges Controller
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
import { AdminChallengesService } from '@/application/admin/services/admin-challenges.service';
import {
  CreateChallengeDto,
  UpdateChallengeDto,
  ChallengeResponseDto,
  ChallengesListResponseDto,
  GetChallengesQueryDto,
  BulkCreateChallengeDto,
  BulkCreateChallengesResponseDto,
} from '@/application/admin/dto/challenges';

@ApiTags('Admin Challenges')
@Controller('api/admin/challenges')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminChallengesController {
  constructor(private readonly challengesService: AdminChallengesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all challenges with pagination' })
  @ApiResponse({ status: 200, type: ChallengesListResponseDto })
  async getChallenges(@Query() query: GetChallengesQueryDto): Promise<ChallengesListResponseDto> {
    return this.challengesService.getChallenges(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get challenge by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: ChallengeResponseDto })
  async getChallengeById(@Param('id', ParseIntPipe) id: number): Promise<ChallengeResponseDto> {
    return this.challengesService.getChallengeById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new challenge' })
  @ApiResponse({ status: 201, type: ChallengeResponseDto })
  async createChallenge(
    @Body() data: CreateChallengeDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<ChallengeResponseDto> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.challengesService.createChallenge(data, adminInfo);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a challenge' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: ChallengeResponseDto })
  async updateChallenge(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateChallengeDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<ChallengeResponseDto> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.challengesService.updateChallenge(id, data, adminInfo);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a challenge (SUPERADMIN only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200 })
  async deleteChallenge(
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
    return this.challengesService.deleteChallenge(id, adminInfo);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Bulk create challenges' })
  @ApiResponse({ status: 201, type: BulkCreateChallengesResponseDto })
  async bulkCreateChallenges(
    @Body() data: BulkCreateChallengeDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<BulkCreateChallengesResponseDto> {
    const adminInfo = {
      adminId: user.userId,
      adminEmail: user.email,
      adminName: user.email,
      ip: req.ip ?? 'unknown',
    };
    return this.challengesService.bulkCreateChallenges(data, adminInfo);
  }
}
