// src/core/entities/daily-challenge.entity.ts
import type { ChallengeType } from '@prisma/client';

export interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface DailyChallenge {
  id: number;
  title: string;
  type: ChallengeType;
  instructions: string;
  date: Date;
  questions: unknown; // Prisma JsonValue
  audioUrl: string | null;
  points: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDailyChallengeProgress {
  id: string;
  userId: string;
  challengeId: number;
  completed: boolean;
  completedAt: Date | null;
  answers: unknown; // Prisma JsonValue
  feedback: string | null;
  score: number | null;
  createdAt: Date;
  updatedAt: Date;
}
