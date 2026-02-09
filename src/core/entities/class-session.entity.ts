// src/core/entities/class-session.entity.ts
import type { ClassType } from '@prisma/client';

export interface ClassSession {
  id: number;
  title: string;
  type: ClassType;
  startTime: Date;
  endTime: Date;
  capacityMax: number | null;
  meetLink: string | null;
  materialsLink: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassSessionWithEnrollmentCount extends ClassSession {
  currentEnrollment: number;
  isFull: boolean;
}
