// src/application/admin/dto/submissions/admin-submissions.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SubmissionStatus, ChallengeType } from '@prisma/client';

// ==================== QUERY DTOs ====================

export class GetSubmissionsQueryDto {
  @ApiPropertyOptional({ enum: SubmissionStatus, description: 'Filtrar por estado' })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @ApiPropertyOptional({ description: 'Buscar por nombre de alumno' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1, description: 'Número de página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Items por página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

// ==================== INPUT DTOs ====================

export class ReviewSubmissionDto {
  @ApiProperty({ enum: SubmissionStatus })
  @IsEnum(SubmissionStatus)
  status!: SubmissionStatus;

  @ApiProperty({ description: 'Feedback del profesor' })
  @IsString()
  feedback!: string;

  @ApiPropertyOptional({ description: 'Puntaje (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  score?: number;
}

// ==================== RESPONSE INTERFACES ====================

export interface SubmissionListItemDto {
  id: string;
  challengeId: number;
  challengeTitle: string;
  challengeType: ChallengeType;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  status: SubmissionStatus;
  fileUrl: string | null;
  submittedAt: Date;
  feedback: string | null;
  score: number | null;
}

export interface SubmissionStatsDto {
  pending: number;
  approved: number;
  needsImprovement: number;
}

export interface PaginatedSubmissionsResponseDto {
  submissions: SubmissionListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: SubmissionStatsDto;
}

export interface ReviewSubmissionResponseDto {
  success: boolean;
  message: string;
}
