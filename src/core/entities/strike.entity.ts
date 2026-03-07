// src/core/entities/strike.entity.ts
export interface Strike {
  id: string;
  userId: string;
  classSessionId: number | null;
  reason: string;
  isManual: boolean;
  createdAt: Date;
}
