// src/application/admin/dto/classes/admin-classes.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  IsUrl,
  IsArray,
  ValidateNested,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClassType, AttendanceStatus } from '@prisma/client';

// ==================== QUERY DTOs ====================

export class GetClassesQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar desde esta fecha' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filtrar hasta esta fecha' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ enum: ClassType, description: 'Filtrar por tipo' })
  @IsOptional()
  @IsEnum(ClassType)
  type?: ClassType;

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

export class CreateClassDto {
  @ApiProperty({ example: 'Advanced Conversation' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Descripción de la clase' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ClassType, default: ClassType.REGULAR })
  @IsEnum(ClassType)
  type!: ClassType;

  @ApiProperty({ description: 'Fecha y hora de inicio (ISO 8601)' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ description: 'Fecha y hora de fin (ISO 8601)' })
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional({ description: 'Capacidad máxima (null = ilimitada)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacityMax?: number;

  @ApiPropertyOptional({ description: 'Link de la reunión' })
  @IsOptional()
  @IsUrl()
  meetLink?: string;

  @ApiPropertyOptional({ description: 'Link de materiales' })
  @IsOptional()
  @IsString()
  materialsLink?: string;

  @ApiPropertyOptional({ description: 'Visible para usuarios Skill Builder Live', default: false })
  @IsOptional()
  @IsBoolean()
  visibleForSkillBuilderLive?: boolean;
}

export class AttendanceRecordDto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsString()
  userId!: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;
}

export class SaveAttendanceDto {
  @ApiProperty({ type: [AttendanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  attendance!: AttendanceRecordDto[];

  @ApiPropertyOptional({
    description: 'Generar strikes automáticamente por ausencias',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  autoStrike?: boolean = true;
}

export class UpdateClassDto {
  @ApiPropertyOptional({ example: 'Updated Conversation Class' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Descripción de la clase' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ClassType })
  @IsOptional()
  @IsEnum(ClassType)
  type?: ClassType;

  @ApiPropertyOptional({ description: 'Fecha y hora de inicio (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Fecha y hora de fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Capacidad máxima' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacityMax?: number;

  @ApiPropertyOptional({ description: 'Link de la reunión' })
  @IsOptional()
  @IsString()
  meetLink?: string;

  @ApiPropertyOptional({ description: 'Link de materiales / grabación' })
  @IsOptional()
  @IsString()
  materialsLink?: string;

  @ApiPropertyOptional({ description: 'Visible para usuarios Skill Builder Live' })
  @IsOptional()
  @IsBoolean()
  visibleForSkillBuilderLive?: boolean;
}

// ==================== RESPONSE INTERFACES ====================

export interface ClassListItemDto {
  id: number;
  title: string;
  type: ClassType;
  startTime: Date;
  endTime: Date;
  capacityMax: number | null;
  enrolledCount: number;
  meetLink: string | null;
  description: string | null;
  visibleForSkillBuilderLive: boolean;
  createdAt: Date;
}

export interface PaginatedClassesResponseDto {
  classes: ClassListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClassAttendeeDto {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  attendanceStatus: AttendanceStatus;
  enrolledAt: Date;
}

export interface ClassAttendeesResponseDto {
  classId: number;
  classTitle: string;
  startTime: Date;
  attendees: ClassAttendeeDto[];
}

export interface CreateClassResponseDto {
  success: boolean;
  message: string;
  classSession: ClassListItemDto;
}

export interface SaveAttendanceResponseDto {
  success: boolean;
  message: string;
  strikesIssued: number;
}

export interface UpdateClassResponseDto {
  success: boolean;
  message: string;
  classSession: ClassListItemDto;
}

export interface DeleteClassResponseDto {
  success: boolean;
  message: string;
}

// ==================== BULK CREATE ====================

export class BulkCreateClassesDto {
  @ApiProperty({ type: [CreateClassDto], description: 'Array de clases a crear' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClassDto)
  classes!: CreateClassDto[];
}

export interface BulkCreateClassesResponseDto {
  success: boolean;
  message: string;
  created: number;
  failed: number;
  errors: string[];
}
