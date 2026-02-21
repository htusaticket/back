// src/application/jobs/dto/application.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength } from 'class-validator';

// Enum para validación
export enum ApplicationStatusEnum {
  APPLIED = 'APPLIED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
}

// ============ Request DTOs ============

export class UpdateApplicationStatusDto {
  @ApiProperty({
    enum: ApplicationStatusEnum,
    description: 'Nuevo estado de la aplicación',
    example: 'INTERVIEW',
  })
  @IsEnum(ApplicationStatusEnum)
  status!: ApplicationStatusEnum;
}

export class UpdateApplicationNotesDto {
  @ApiProperty({
    description: 'Notas personales sobre la aplicación',
    example: 'Entrevista el jueves a las 3pm',
  })
  @IsString()
  @MaxLength(500)
  notes!: string;
}

// ============ Response DTOs ============

export class ApplicationJobDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Customer Success Manager' })
  title!: string;

  @ApiProperty({ example: 'SaaS Solutions' })
  company!: string;
}

export class ApplicationDto {
  @ApiProperty({ example: 'clxxxxxxxxxxxxxxxxxx' })
  id!: string;

  @ApiProperty({ type: ApplicationJobDto })
  job!: ApplicationJobDto;

  @ApiProperty({ example: 'Jan 28, 2026' })
  appliedDate!: string;

  @ApiPropertyOptional({ example: 'Entrevista el jueves a las 3pm' })
  notes?: string | null;
}

export class ApplicationsByStatusDto {
  @ApiProperty({ type: [ApplicationDto] })
  applied!: ApplicationDto[];

  @ApiProperty({ type: [ApplicationDto] })
  interview!: ApplicationDto[];

  @ApiProperty({ type: [ApplicationDto] })
  offer!: ApplicationDto[];

  @ApiProperty({ type: [ApplicationDto] })
  rejected!: ApplicationDto[];
}

export class ApplicationStatsDto {
  @ApiProperty({ example: 2 })
  applied!: number;

  @ApiProperty({ example: 1 })
  interview!: number;

  @ApiProperty({ example: 1 })
  offer!: number;

  @ApiProperty({ example: 1 })
  rejected!: number;
}

export class MyApplicationsResponseDto {
  @ApiProperty({ type: ApplicationStatsDto })
  stats!: ApplicationStatsDto;

  @ApiProperty({ type: ApplicationsByStatusDto })
  applications!: ApplicationsByStatusDto;
}

export class UpdateStatusResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Estado actualizado correctamente' })
  message!: string;

  @ApiProperty({
    enum: ApplicationStatusEnum,
    example: 'INTERVIEW',
  })
  newStatus!: ApplicationStatusEnum;
}
