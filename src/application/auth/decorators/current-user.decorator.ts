// src/application/auth/decorators/current-user.decorator.ts
import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../services/auth.service';

/**
 * Decorador para obtener el usuario actual del request
 * Uso: @CurrentUser() user: JwtPayload
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new Error('User not found in request. Make sure JwtAuthGuard is applied.');
    }

    // Si se especifica una propiedad, devolver solo esa
    if (data) {
      return user[data];
    }

    return user;
  },
);
