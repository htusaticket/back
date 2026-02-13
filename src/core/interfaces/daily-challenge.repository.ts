// src/core/interfaces/daily-challenge.repository.ts
import type {
  DailyChallenge,
  UserDailyChallengeProgress,
  ChallengeHistoryItem,
  QuizQuestion,
} from '../entities/daily-challenge.entity';
import type { SubmissionStatus } from '@prisma/client';

export const DAILY_CHALLENGE_REPOSITORY = 'DAILY_CHALLENGE_REPOSITORY';

export interface IDailyChallengeRepository {
  /**
   * Obtener el challenge del día actual
   */
  findTodayChallenge(): Promise<DailyChallenge | null>;

  /**
   * Obtener challenge por ID
   */
  findById(challengeId: number): Promise<DailyChallenge | null>;

  /**
   * Obtener progreso del usuario para un challenge
   */
  findUserProgress(userId: string, challengeId: number): Promise<UserDailyChallengeProgress | null>;

  /**
   * Calcular streak del usuario (días consecutivos completando challenges)
   */
  calculateStreak(userId: string): Promise<number>;

  /**
   * Marcar challenge como completado
   */
  completeChallenge(
    userId: string,
    challengeId: number,
    answers?: unknown, // Prisma JsonValue
    score?: number,
  ): Promise<UserDailyChallengeProgress>;

  /**
   * Guardar/actualizar submission de audio
   */
  submitAudio(
    userId: string,
    challengeId: number,
    fileUrl: string,
  ): Promise<UserDailyChallengeProgress>;

  /**
   * Enviar respuestas de quiz y calcular score
   */
  submitQuiz(
    userId: string,
    challengeId: number,
    answers: number[],
    score: number,
    status: SubmissionStatus,
  ): Promise<UserDailyChallengeProgress>;

  /**
   * Obtener historial de challenges del usuario
   */
  findUserHistory(userId: string, limit?: number): Promise<ChallengeHistoryItem[]>;

  /**
   * Obtener preguntas de un challenge (sin respuestas correctas para el frontend)
   */
  findChallengeQuestions(challengeId: number): Promise<Omit<QuizQuestion, 'correctAnswer'>[]>;

  /**
   * Obtener preguntas con respuestas correctas (para validación en backend)
   */
  findChallengeQuestionsWithAnswers(challengeId: number): Promise<QuizQuestion[]>;
}
