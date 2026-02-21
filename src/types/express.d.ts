// src/types/express.d.ts
import type { JwtPayload } from '@/application/auth/services/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
