// Admin Challenges DTOs
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  IsEnum,
  IsDateString,
  Min,
  MaxLength,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ChallengeType } from '@prisma/client';

// ==================== Question DTOs (for Multiple Choice) ====================

export class QuizQuestionDto {
  @ApiProperty({
    description: 'Question text',
    example: 'What is the best approach to close a sale?',
  })
  @IsString()
  @MaxLength(1000)
  text!: string;

  @ApiProperty({
    description: 'Answer options',
    type: [String],
    example: ['Always close', 'Listen first', 'Speak fast'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  options!: string[];

  @ApiProperty({ description: 'Index of correct answer', example: 1 })
  @IsInt()
  @Min(0)
  correctAnswer!: number;
}

// ==================== Challenge DTOs ====================

export class CreateChallengeDto {
  @ApiProperty({ description: 'Challenge title', example: 'Listen to Podcast #4' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Challenge type', enum: ChallengeType })
  @IsEnum(ChallengeType)
  type!: ChallengeType;

  @ApiProperty({ description: 'Challenge instructions' })
  @IsString()
  @MaxLength(5000)
  instructions!: string;

  @ApiProperty({
    description: 'Date for the challenge (YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY)',
    example: '2026-03-15',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (!value || typeof value !== 'string') return value;
    const match = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (match) {
      const day = match[1]!;
      const month = match[2]!;
      const year = match[3]!;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return value;
  })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({
    description: 'Quiz questions (required for MULTIPLE_CHOICE type)',
    type: [QuizQuestionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions?: QuizQuestionDto[];

  @ApiPropertyOptional({ description: 'Audio file URL (for AUDIO type)' })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Points for completing the challenge', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  points?: number;

  @ApiPropertyOptional({ description: 'Visible for SKILL_BUILDER plan', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  visibleForSkillBuilder?: boolean;

  @ApiPropertyOptional({ description: 'Visible for SKILL_BUILDER_LIVE plan', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  visibleForSkillBuilderLive?: boolean;
}

export class UpdateChallengeDto {
  @ApiPropertyOptional({ description: 'Challenge title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Challenge instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  instructions?: string;

  @ApiPropertyOptional({
    description: 'Date for the challenge (YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY)',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value || typeof value !== 'string') return value;
    const match = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (match) {
      const day = match[1]!;
      const month = match[2]!;
      const year = match[3]!;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return value;
  })
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Quiz questions (for MULTIPLE_CHOICE type)',
    type: [QuizQuestionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions?: QuizQuestionDto[];

  @ApiPropertyOptional({ description: 'Audio file URL (for AUDIO type)' })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Points for completing the challenge' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  points?: number;

  @ApiPropertyOptional({ description: 'Is challenge active' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Visible for SKILL_BUILDER plan' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  visibleForSkillBuilder?: boolean;

  @ApiPropertyOptional({ description: 'Visible for SKILL_BUILDER_LIVE plan' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  visibleForSkillBuilderLive?: boolean;
}

export class ChallengeResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: ChallengeType })
  type!: ChallengeType;

  @ApiProperty()
  instructions!: string;

  @ApiProperty()
  date!: Date;

  @ApiPropertyOptional()
  questions?: QuizQuestionDto[] | undefined;

  @ApiPropertyOptional()
  audioUrl?: string | undefined;

  @ApiProperty()
  points!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  visibleForSkillBuilder!: boolean;

  @ApiProperty()
  visibleForSkillBuilderLive!: boolean;

  @ApiProperty()
  submissionsCount!: number;

  @ApiProperty()
  pendingSubmissions!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

// ==================== Query DTOs ====================

export class GetChallengesQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by type', enum: ChallengeType })
  @IsOptional()
  @IsEnum(ChallengeType)
  type?: ChallengeType;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search by title' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ChallengesListResponseDto {
  @ApiProperty({ type: [ChallengeResponseDto] })
  challenges!: ChallengeResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

// ==================== Bulk Upload DTOs ====================

export class BulkCreateChallengeDto {
  @ApiProperty({ type: [CreateChallengeDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateChallengeDto)
  challenges!: CreateChallengeDto[];
}

export class BulkCreateChallengesResponseDto {
  @ApiProperty()
  created!: number;

  @ApiProperty()
  failed!: number;

  @ApiPropertyOptional({ type: [String] })
  errors?: string[] | undefined;
}
