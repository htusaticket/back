// src/application/admin/dto/subscriptions/index.ts
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserPlan, SubscriptionStatus } from '@prisma/client';

// ==================== Query DTOs ====================

export class GetSubscriptionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserPlan)
  plan?: UserPlan;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}

// ==================== Create/Update DTOs ====================

export class CreateSubscriptionDto {
  @IsString()
  userId!: string;

  @IsEnum(UserPlan)
  plan!: UserPlan;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsBoolean()
  @IsOptional()
  hasPaid?: boolean = false;

  @IsString()
  @IsOptional()
  paymentNote?: string;
}

export class UpdateSubscriptionDto {
  @IsEnum(UserPlan)
  @IsOptional()
  plan?: UserPlan;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  hasPaid?: boolean;

  @IsString()
  @IsOptional()
  paymentNote?: string;
}

// ==================== Response DTOs ====================

export interface SubscriptionUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

export interface SubscriptionDto {
  id: string;
  userId: string;
  plan: UserPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  hasPaid: boolean;
  paidAt: string | null;
  paymentNote: string | null;
  assignedBy: string | null;
  createdAt: string;
  user?: SubscriptionUserDto;
}

export interface PaginatedSubscriptionsResponseDto {
  subscriptions: SubscriptionDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSubscriptionResponseDto {
  subscription: SubscriptionDto;
  message: string;
}

export interface UpdateSubscriptionResponseDto {
  subscription: SubscriptionDto;
  message: string;
}

export interface DeleteSubscriptionResponseDto {
  success: boolean;
  message: string;
}

// Alias para conveniencia
export type SubscriptionResponseDto = SubscriptionDto;
export type PaginatedSubscriptionsResponse = PaginatedSubscriptionsResponseDto;

// ==================== User Subscription Info ====================

export interface UserActiveSubscriptionDto {
  hasActiveSubscription: boolean;
  subscription: SubscriptionDto | null;
  isPunished: boolean;
  punishedUntil: string | null;
}
