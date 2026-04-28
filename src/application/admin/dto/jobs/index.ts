// Admin Jobs DTOs
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  Min,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ==================== Job Offer DTOs ====================

export class CreateJobOfferDto {
  @ApiProperty({ description: 'Job title', example: '$40k/Mo Closers for RE Development' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Contact/recruiter name', example: 'Ryan Herrera' })
  @IsString()
  @MaxLength(200)
  company!: string;

  @ApiPropertyOptional({ description: 'Job location', example: 'Remote' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ description: 'Salary range', example: '$8,000-$40,000/Mo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  salaryRange?: string;

  @ApiPropertyOptional({ description: 'OTE minimum (monthly)', example: 5000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  oteMin?: number;

  @ApiPropertyOptional({ description: 'OTE maximum (monthly)', example: 10000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  oteMax?: number;

  @ApiPropertyOptional({ description: 'Revenue target (monthly)', example: 50000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  revenue?: number;

  @ApiPropertyOptional({ description: 'Job type', example: 'Setter' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({ description: 'Job requirements', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ description: 'Is job active', default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Primary social link',
    example: 'https://www.instagram.com/user/',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  social?: string;

  @ApiPropertyOptional({
    description: 'Recruiter social link',
    example: 'https://www.instagram.com/recruiter/',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  recruiterSocial?: string;

  @ApiPropertyOptional({ description: 'Website URL', example: 'https://www.company.com/' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({ description: 'Contact email', example: 'contact@company.com' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional({
    description: 'Apply code (auto-extracted from description if omitted)',
    example: '02306',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;
}

export class UpdateJobOfferDto {
  @ApiPropertyOptional({ description: 'Job title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @ApiPropertyOptional({ description: 'Job location' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ description: 'Salary range' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  salaryRange?: string;

  @ApiPropertyOptional({ description: 'OTE minimum (monthly)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  oteMin?: number;

  @ApiPropertyOptional({ description: 'OTE maximum (monthly)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  oteMax?: number;

  @ApiPropertyOptional({ description: 'Revenue target (monthly)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  revenue?: number;

  @ApiPropertyOptional({ description: 'Job type' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({ description: 'Job requirements', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ description: 'Is job active' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Primary social link' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  social?: string;

  @ApiPropertyOptional({ description: 'Recruiter social link' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  recruiterSocial?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional({ description: 'Apply code (auto-extracted from description if omitted)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;
}

export class JobOfferResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  company!: string;

  @ApiProperty()
  location!: string;

  @ApiProperty()
  salaryRange!: string;

  @ApiProperty()
  oteMin!: number;

  @ApiProperty()
  oteMax!: number;

  @ApiProperty()
  revenue!: number;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [String] })
  requirements!: string[];

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  applicationsCount!: number;

  @ApiPropertyOptional()
  social?: string | null;

  @ApiPropertyOptional()
  recruiterSocial?: string | null;

  @ApiPropertyOptional()
  website?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional({ description: 'Apply code extracted from description' })
  code?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

// ==================== Job Application DTOs ====================

export class JobApplicationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  userEmail!: string;

  @ApiProperty()
  userName!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  notes?: string | undefined;

  @ApiProperty()
  appliedAt!: Date;
}

export class JobOfferWithApplicationsDto extends JobOfferResponseDto {
  @ApiProperty({ type: [JobApplicationDto] })
  applications!: JobApplicationDto[];
}

// ==================== Query DTOs ====================

export class GetJobOffersQueryDto {
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

  @ApiPropertyOptional({ description: 'Search by title or company' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ key, obj }: { key: string; obj: Record<string, unknown> }) => {
    const raw = obj[key];
    if (raw === 'true' || raw === true) return true;
    if (raw === 'false' || raw === false) return false;
    return undefined;
  })
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by job type' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class JobOffersListResponseDto {
  @ApiProperty({ type: [JobOfferResponseDto] })
  jobs!: JobOfferResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty({ description: 'Total active job posts (across all pages)' })
  activeJobs!: number;

  @ApiProperty({ description: 'Total applications across all jobs' })
  totalApplicants!: number;

  @ApiProperty({ description: 'Job offers created in the last 7 days' })
  newThisWeek!: number;
}

// ==================== Bulk Upload DTOs ====================

export class BulkCreateJobOfferDto {
  @ApiProperty({ type: [CreateJobOfferDto] })
  @IsArray()
  @ArrayMinSize(1)
  jobs!: CreateJobOfferDto[];
}

export class BulkCreateResponseDto {
  @ApiProperty()
  created!: number;

  @ApiProperty()
  failed!: number;

  @ApiPropertyOptional({ type: [String] })
  errors?: string[] | undefined;
}
