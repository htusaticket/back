// src/core/interfaces/strike.repository.ts
import type { Strike } from '../entities/strike.entity';

export const STRIKE_REPOSITORY = 'STRIKE_REPOSITORY';

export interface StrikeInfo {
  strikesCount: number;
  maxStrikes: number;
  resetDate: string | null; // Fecha en formato ISO, null si no hay strikes
}

export interface StrikeWithDetails extends Strike {
  classSession?: {
    id: number;
    title: string;
  } | null;
}

export interface IStrikeRepository {
  /**
   * Crear un nuevo strike automático (por clase)
   */
  create(userId: string, classSessionId: number, reason?: string): Promise<Strike>;

  /**
   * Crear un strike manual (emitido por admin)
   */
  createManual(userId: string, reason: string, classSessionId?: number): Promise<Strike>;

  /**
   * Obtener todos los strikes de un usuario
   */
  findByUserId(userId: string): Promise<Strike[]>;

  /**
   * Obtener todos los strikes de un usuario con detalles de clase
   */
  findByUserIdWithDetails(userId: string): Promise<StrikeWithDetails[]>;

  /**
   * Contar strikes de un usuario
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Obtener el último strike de un usuario
   */
  findLastByUserId(userId: string): Promise<Strike | null>;

  /**
   * Contar strikes activos (dentro del período de 14 días desde el último)
   * y calcular fecha de reseteo
   */
  getStrikeInfo(userId: string): Promise<StrikeInfo>;
}
