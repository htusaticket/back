// src/application/admin/dto/users/admin-users.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsInt, MinLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserStatus, UserPlan, SubscriptionStatus } from '@prisma/client';

// ==================== QUERY DTOs ====================

export class GetUsersQueryDto {
  @ApiPropertyOptional({ description: 'Búsqueda por nombre o email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Filtrar por rol' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus, description: 'Filtrar por estado' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

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

export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  lastName!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsEnum(UserStatus)
  status!: UserStatus;

  @ApiPropertyOptional({ description: 'Motivo del rechazo (solo cuando status es rechazado)' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// DTO para aprobar un registro con plan obligatorio (PENDING → ACTIVE)
export class ApproveRegistrationDto {
  @ApiProperty({ enum: UserPlan, description: 'Plan a asignar al usuario' })
  @IsEnum(UserPlan)
  plan!: UserPlan;

  @ApiProperty({ description: 'Fecha de inicio del plan (formato ISO)' })
  @IsString()
  startDate!: string;

  @ApiProperty({ description: 'Fecha de fin del plan (formato ISO)' })
  @IsString()
  endDate!: string;
}

// DTO para rechazar un registro (elimina de BD)
export class RejectRegistrationDto {
  @ApiProperty({ description: 'Motivo del rechazo que se enviará al usuario' })
  @IsString()
  @MinLength(10, { message: 'El motivo debe tener al menos 10 caracteres' })
  reason!: string;
}

export class UpdateUserNotesDto {
  @ApiProperty({ description: 'Notas del administrador' })
  @IsString()
  notes!: string;
}

export class IssueStrikeDto {
  @ApiProperty({ description: 'Razón del strike' })
  @IsString()
  @MinLength(5)
  reason!: string;

  @ApiPropertyOptional({ description: 'ID de la clase asociada (opcional)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  classSessionId?: number;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'john@example.com',
    description: 'Solo SUPERADMIN puede cambiar el email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

// ==================== RESPONSE INTERFACES ====================

export interface UserListItemDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  plan: UserPlan | null;
  createdAt: Date;
  lastLoginAt: string | null;
  isPunished: boolean;
  punishedUntil: Date | null;
}

export interface PaginatedUsersResponseDto {
  users: UserListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StrikeDetailDto {
  id: string;
  reason: string;
  isManual: boolean;
  classTitle: string | null;
  createdAt: Date;
}

export interface UserStrikesDto {
  count: number;
  maxStrikes: number;
  resetDate: string | null;
  history: StrikeDetailDto[];
}

export interface UserStatsDto {
  attendancePercentage: number;
  totalClassesEnrolled: number;
  totalClassesAttended: number;
  modulesCompleted: number;
  totalModules: number;
  challengesCompleted: number;
}

export interface ModuleProgressDto {
  moduleId: number;
  moduleTitle: string;
  progress: number;
  status: 'Completed' | 'In Progress' | 'Not Started';
}

export interface UserSubscriptionDto {
  id: string;
  plan: UserPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  hasPaid: boolean;
}

export interface UserDetailDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  city: string | null;
  country: string | null;
  reference: string | null;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  plan: UserPlan | null;
  startDate: Date | null;
  endDate: Date | null;
  isPunished: boolean;
  punishedUntil: Date | null;
  adminNotes: string | null;
  createdAt: Date;
  stats: UserStatsDto;
  strikes: UserStrikesDto;
  moduleProgress: ModuleProgressDto[];
  subscription: UserSubscriptionDto | null;
}

export interface CreateUserResponseDto {
  success: boolean;
  message: string;
  user: UserListItemDto;
}

export interface UpdateStatusResponseDto {
  success: boolean;
  message: string;
}

export interface IssueStrikeResponseDto {
  success: boolean;
  message: string;
  strikeId: string;
  totalStrikes: number;
  userPunished: boolean; // Cambiado de userSuspended
  punishedUntil: Date | null; // Nuevo campo
}

export interface ApproveRegistrationResponseDto {
  success: boolean;
  message: string;
}

export interface RejectRegistrationResponseDto {
  success: boolean;
  message: string;
}
