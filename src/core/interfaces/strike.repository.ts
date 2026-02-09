// src/core/interfaces/strike.repository.ts
import type { Strike } from '../entities/strike.entity';

export const STRIKE_REPOSITORY = 'STRIKE_REPOSITORY';

export interface IStrikeRepository {
  /**
   * Crear un nuevo strike
   */
  create(userId: string, classSessionId: number, reason?: string): Promise<Strike>;

  /**
   * Obtener todos los strikes de un usuario
   */
  findByUserId(userId: string): Promise<Strike[]>;

  /**
   * Contar strikes de un usuario
   */
  countByUserId(userId: string): Promise<number>;
}
