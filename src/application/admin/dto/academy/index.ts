// Admin Academy DTOs
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  Min,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ResourceType } from '@prisma/client';

// ==================== Module DTOs ====================

export class CreateModuleDto {
  @ApiProperty({ description: 'Module title', example: 'Foundations & Goals' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    description: 'Module description',
    example: 'Start your journey by setting clear objectives...',
  })
  @IsString()
  @MaxLength(2000)
  description!: string;

  @ApiProperty({
    description: 'Module cover image URL',
    example: 'https://images.unsplash.com/...',
  })
  @IsString()
  @IsUrl()
  image!: string;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;

  @ApiPropertyOptional({ description: 'Visible for SKILL_BUILDER plan', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  visibleForSkillBuilder?: boolean;
}

export class UpdateModuleDto {
  @ApiPropertyOptional({ description: 'Module title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Module description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Module cover image URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  image?: string;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;

  @ApiPropertyOptional({ description: 'Visible for SKILL_BUILDER plan' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  visibleForSkillBuilder?: boolean;
}

export class ModuleResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  image!: string;

  @ApiProperty()
  order!: number;

  @ApiProperty()
  visibleForSkillBuilder!: boolean;

  @ApiProperty()
  lessonsCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

// ==================== Lesson DTOs ====================

export class CreateLessonDto {
  @ApiProperty({ description: 'Lesson title', example: 'Introduction' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: 'Lesson description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ description: 'Lesson duration', example: '10 min' })
  @IsString()
  @MaxLength(50)
  duration!: string;

  @ApiPropertyOptional({ description: 'Video or content URL' })
  @IsOptional()
  @IsString()
  contentUrl?: string;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;
}

export class UpdateLessonDto {
  @ApiPropertyOptional({ description: 'Lesson title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Lesson description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ description: 'Lesson duration' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  duration?: string;

  @ApiPropertyOptional({ description: 'Video or content URL' })
  @IsOptional()
  @IsString()
  contentUrl?: string;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;
}

export class LessonResourceDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  fileUrl!: string;

  @ApiProperty({ enum: ResourceType })
  type!: ResourceType;

  @ApiPropertyOptional()
  size?: string | undefined;
}

export class CreateLessonResourceDto {
  @ApiProperty({ description: 'Resource title', example: 'Lesson PDF Guide' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Resource file URL' })
  @IsString()
  fileUrl!: string;

  @ApiProperty({ description: 'Resource type', enum: ResourceType })
  @IsEnum(ResourceType)
  type!: ResourceType;

  @ApiPropertyOptional({ description: 'File size', example: '245 KB' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;
}

export class LessonResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | undefined;

  @ApiProperty()
  duration!: string;

  @ApiPropertyOptional()
  contentUrl?: string | undefined;

  @ApiProperty()
  order!: number;

  @ApiProperty()
  moduleId!: number;

  @ApiPropertyOptional({ type: [LessonResourceDto] })
  resources?: LessonResourceDto[];
}

// ==================== Module with Lessons ====================

export class ModuleWithLessonsDto extends ModuleResponseDto {
  @ApiProperty({ type: [LessonResponseDto] })
  lessons!: LessonResponseDto[];
}

// ==================== Query DTOs ====================

export class GetModulesQueryDto {
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

  @ApiPropertyOptional({ description: 'Search by title' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ModulesListResponseDto {
  @ApiProperty({ type: [ModuleResponseDto] })
  modules!: ModuleResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}
