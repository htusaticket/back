// src/application/jobs/dto/job.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

// ============ Enums ============

export enum JobSortBy {
  BEST_MATCH = 'best_match',
  NEWEST_FIRST = 'newest_first',
  OLDEST_FIRST = 'oldest_first',
  HIGHEST_OTE = 'highest_ote',
  LOWEST_OTE = 'lowest_ote',
  HIGHEST_REVENUE = 'highest_revenue',
  LOWEST_REVENUE = 'lowest_revenue',
}

// ============ Request DTOs ============

export class JobFiltersDto {
  @ApiPropertyOptional({
    description: 'Buscar por título o empresa',
    example: 'Frontend',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de trabajo',
    example: 'Full-time',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Ordenar resultados',
    enum: JobSortBy,
    example: JobSortBy.NEWEST_FIRST,
  })
  @IsOptional()
  @IsEnum(JobSortBy)
  sortBy?: JobSortBy;
}

// ============ Response DTOs ============

export class JobOfferDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Senior Frontend Developer' })
  title!: string;

  @ApiProperty({ example: 'TechCorp Inc.' })
  company!: string;

  @ApiProperty({ example: 'Remote' })
  location!: string;

  @ApiProperty({ example: '$80k - $120k/year' })
  salaryRange!: string;

  @ApiProperty({ example: 8000, description: 'OTE mínimo mensual en USD' })
  oteMin!: number;

  @ApiProperty({ example: 12000, description: 'OTE máximo mensual en USD' })
  oteMax!: number;

  @ApiProperty({ example: 25000, description: 'Revenue mensual requerido en USD' })
  revenue!: number;

  @ApiProperty({ example: 'Full-time' })
  type!: string;

  @ApiProperty({
    example: "We're looking for an experienced Frontend Developer to join our team...",
  })
  description!: string;

  @ApiProperty({
    example: ['Fluent English (C1+)', '2+ years experience', 'React/Vue knowledge'],
    type: [String],
  })
  requirements!: string[];

  @ApiPropertyOptional({ example: 'https://instagram.com/company', nullable: true })
  social!: string | null;

  @ApiPropertyOptional({ example: 'https://instagram.com/recruiter', nullable: true })
  recruiterSocial!: string | null;

  @ApiPropertyOptional({ example: 'https://company.com', nullable: true })
  website!: string | null;

  @ApiPropertyOptional({ example: 'contact@company.com', nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ example: '02306', nullable: true, description: 'Apply code' })
  code!: string | null;

  @ApiProperty({ example: false })
  hasApplied!: boolean;

  @ApiProperty({ example: '2026-02-01T10:00:00.000Z' })
  createdAt!: Date;
}

export class JobStatsDto {
  @ApiProperty({ example: 24, description: 'Total de ofertas activas' })
  availableOffers!: number;

  @ApiProperty({ example: 2, description: 'Aplicaciones activas del usuario' })
  activeApplications!: number;

  @ApiProperty({ example: 8, description: 'Ofertas nuevas esta semana' })
  newThisWeek!: number;
}

export class JobListResponseDto {
  @ApiProperty({ type: JobStatsDto })
  stats!: JobStatsDto;

  @ApiProperty({ type: [JobOfferDto] })
  jobs!: JobOfferDto[];
}

export class ApplyResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Has aplicado exitosamente a esta oferta' })
  message!: string;
}
