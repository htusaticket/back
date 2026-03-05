// src/application/profile/dto/profile.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// ============ Request DTOs ============

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del usuario',
    example: '+54 11 1234-5678',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Ciudad del usuario',
    example: 'Buenos Aires',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'País del usuario',
    example: 'Argentina',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}

// ============ Response DTOs ============

export class UserProfileDto {
  @ApiProperty({ example: 'clxxxxxxxxxxxxxxxxxx' })
  id!: string;

  @ApiProperty({ example: 'eugenia@example.com' })
  email!: string;

  @ApiProperty({ example: 'Eugenia' })
  firstName!: string;

  @ApiProperty({ example: 'Rodríguez' })
  lastName!: string;

  @ApiPropertyOptional({ example: '+54 11 1234-5678' })
  phone?: string | null;

  @ApiPropertyOptional({ example: 'Buenos Aires' })
  city?: string | null;

  @ApiPropertyOptional({ example: 'Argentina' })
  country?: string | null;

  @ApiPropertyOptional({ example: 'Instagram' })
  reference?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string | null;

  @ApiProperty({ example: 'USER' })
  role!: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ example: '2026-01-15T10:00:00.000Z' })
  createdAt!: Date;
}

export class SubscriptionInfoDto {
  @ApiPropertyOptional({
    example: 'PRO',
    description: 'Tipo de plan (PRO, ELITE, etc) o null si no tiene',
  })
  plan?: string | null;

  @ApiProperty({
    example: 'January 2026',
    description: 'Fecha de inicio de membresía formateada',
  })
  memberSince!: string;

  @ApiProperty({
    example: true,
    description: 'Si tiene una subscripción activa',
  })
  hasActiveSubscription!: boolean;

  @ApiPropertyOptional({
    example: '2026-01-15T10:00:00.000Z',
    description: 'Fecha de inicio de la subscripción',
  })
  startDate?: Date | null;

  @ApiPropertyOptional({
    example: '2026-07-15T10:00:00.000Z',
    description: 'Fecha de fin de la subscripción',
  })
  endDate?: Date | null;
}

export class StrikeInfoDto {
  @ApiProperty({ example: 1, description: 'Cantidad de strikes activos' })
  strikesCount!: number;

  @ApiProperty({ example: 3, description: 'Cantidad máxima de strikes permitidos' })
  maxStrikes!: number;

  @ApiPropertyOptional({
    example: '2026-02-15T00:00:00.000Z',
    description: 'Fecha de reseteo de strikes (null si no hay strikes)',
  })
  resetDate!: string | null;
}

export class ProfileStatsDto {
  @ApiProperty({
    example: 24,
    description: 'Clases completadas (pasadas con inscripción confirmada)',
  })
  completedClasses!: number;

  @ApiProperty({
    example: 7,
    description: 'Lecciones marcadas como completadas',
  })
  completedLessons!: number;

  @ApiProperty({
    example: 15,
    description: 'Challenges completados',
  })
  completedChallenges!: number;
}

export class ProfileResponseDto {
  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;

  @ApiProperty({ type: SubscriptionInfoDto })
  subscription!: SubscriptionInfoDto;

  @ApiProperty({ type: ProfileStatsDto })
  stats!: ProfileStatsDto;

  @ApiProperty({ type: StrikeInfoDto })
  strikes!: StrikeInfoDto;

  @ApiProperty({ example: false, description: 'Si el usuario está castigado' })
  isPunished!: boolean;

  @ApiPropertyOptional({
    example: '2026-02-15T10:00:00.000Z',
    description: 'Fecha hasta la que está castigado',
  })
  punishedUntil?: Date | null;
}

export class UpdateProfileResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Perfil actualizado correctamente' })
  message!: string;

  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;
}
