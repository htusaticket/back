// src/core/entities/daily-challenge.entity.ts
import type { ChallengeType, SubmissionStatus } from '@prisma/client';

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
  questions: unknown; // Prisma JsonValue - QuizQuestion[]
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
  answers: unknown; // Prisma JsonValue - user answers
  fileUrl: string | null; // URL del audio subido
  status: SubmissionStatus;
  feedback: string | null;
  score: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Extended types for API responses
export interface DailyChallengeWithProgress extends DailyChallenge {
  userProgress: UserDailyChallengeProgress | null;
}

export interface ChallengeHistoryItem {
  id: string;
  challengeId: number;
  challengeTitle: string;
  challengeType: ChallengeType;
  submittedAt: Date;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  fileUrl: string | null;
}

// Quiz detail for history view
export interface QuizDetailItem {
  id: string;
  challengeId: number;
  challengeTitle: string;
  score: number | null;
  status: SubmissionStatus;
  submittedAt: Date;
  questions: {
    id: number;
    text: string;
    options: string[];
    correctAnswer: number;
    userAnswer: number;
  }[];
}
