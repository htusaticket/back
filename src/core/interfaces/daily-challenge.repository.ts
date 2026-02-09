// src/core/interfaces/daily-challenge.repository.ts
import type {
  DailyChallenge,
  UserDailyChallengeProgress,
} from '../entities/daily-challenge.entity';

export const DAILY_CHALLENGE_REPOSITORY = 'DAILY_CHALLENGE_REPOSITORY';

export interface IDailyChallengeRepository {
  /**
   * Obtener el challenge del día actual
   */
  findTodayChallenge(): Promise<DailyChallenge | null>;

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
}
