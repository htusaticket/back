import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction } from '@prisma/client';

export class AuditLogDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  adminId!: string;

  @ApiProperty()
  adminEmail!: string;

  @ApiProperty()
  adminName!: string;

  @ApiProperty({ enum: AuditAction })
  action!: AuditAction;

  @ApiPropertyOptional()
  targetType?: string;

  @ApiPropertyOptional()
  targetId?: string;

  @ApiPropertyOptional()
  targetName?: string;

  @ApiPropertyOptional()
  details?: Record<string, unknown>;

  @ApiPropertyOptional()
  ipAddress?: string;

  @ApiProperty()
  createdAt!: Date;
}

export class GetAuditLogsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: AuditAction })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AuditLogsResponseDto {
  @ApiProperty({ type: [AuditLogDto] })
  logs!: Array<AuditLogDto>;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class CreateAuditLogDto {
  adminId!: string;
  adminEmail!: string;
  adminName!: string;
  action!: AuditAction;
  targetType?: string | undefined;
  targetId?: string | undefined;
  targetName?: string | undefined;
  details?: Record<string, unknown> | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}
