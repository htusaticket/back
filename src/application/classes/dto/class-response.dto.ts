// src/application/classes/dto/class-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CapacityDto {
  @ApiProperty()
  current!: number;

  @ApiProperty({ nullable: true })
  max!: number | null;
}

export class ClassResponseDto {
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

  @ApiProperty({ type: CapacityDto })
  capacity!: CapacityDto;

  @ApiProperty()
  isEnrolled!: boolean;

  @ApiProperty()
  isFull!: boolean;

  @ApiProperty({ nullable: true })
  meetLink!: string | null;

  @ApiProperty({ nullable: true })
  description!: string | null;
}

export class EnrollResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  message!: string;
}

export class CancelResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  message!: string;

  @ApiProperty({ required: false })
  strikeApplied?: boolean;
}
