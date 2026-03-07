// src/application/admin/dto/system-config/index.ts
import { IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class UpdateSystemConfigDto {
  @IsOptional()
  @IsBoolean()
  strikesEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxStrikesForPunishment?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  punishmentDurationDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(72)
  lateCancellationHours?: number;

  @IsOptional()
  @IsBoolean()
  jobBoardEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  academyEnabled?: boolean;
}

export interface SystemConfigDto {
  id: string;
  strikesEnabled: boolean;
  maxStrikesForPunishment: number;
  punishmentDurationDays: number;
  lateCancellationHours: number;
  jobBoardEnabled: boolean;
  academyEnabled: boolean;
  updatedAt: string;
}

export interface UpdateSystemConfigResponseDto {
  config: SystemConfigDto;
  message: string;
}
