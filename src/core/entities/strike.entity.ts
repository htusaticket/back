// src/core/entities/strike.entity.ts
export interface Strike {
  id: string;
  userId: string;
  classSessionId: number;
  reason: string;
  createdAt: Date;
}
