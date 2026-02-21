// src/application/dashboard/dto/dashboard-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NextClassDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: ['regular', 'workshop'] })
  type!: string; // 'regular' | 'workshop'

  @ApiProperty({ description: 'Day of the week or relative (e.g., "Today", "Monday")' })
  day!: string;

  @ApiProperty({ description: 'Short date format (e.g., "Jan 29")' })
  date!: string;

  @ApiProperty({ description: 'Time range (e.g., "18:00 - 19:00")' })
  time!: string;

  @ApiProperty({ nullable: true })
  meetLink!: string | null;

  @ApiProperty({ nullable: true })
  materialsLink!: string | null;
}

export class DailyChallengeDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  completed!: boolean;

  @ApiProperty()
  streak!: number;
}

export class ContinueLearningDto {
  @ApiProperty()
  lessonId!: number;

  @ApiProperty()
  lessonTitle!: string;

  @ApiProperty()
  moduleId!: number;

  @ApiProperty()
  moduleTitle!: string;

  @ApiProperty({ nullable: true })
  contentUrl!: string | null;
}

export class NotificationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class DashboardSummaryDto {
  @ApiProperty({ type: NextClassDto, nullable: true })
  nextClass!: NextClassDto | null;

  @ApiProperty({ type: DailyChallengeDto, nullable: true })
  dailyChallenge!: DailyChallengeDto | null;

  @ApiProperty({ type: ContinueLearningDto, nullable: true })
  continueLearning!: ContinueLearningDto | null;

  @ApiProperty({ type: [NotificationDto] })
  notifications!: NotificationDto[];
}
