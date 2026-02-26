// src/application/auth/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../services/auth.service';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los roles requeridos del decorador
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles definidos, permitir acceso (solo requiere autenticación)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;

    if (!user) {
      this.logger.warn('Intento de acceso sin usuario autenticado');
      throw new ForbiddenException('No tienes permisos para acceder a este recurso');
    }

    const hasRole = requiredRoles.some(role => user.role === role);

    if (!hasRole) {
      this.logger.warn(
        `Usuario ${user.email} con rol ${user.role} intentó acceder a recurso que requiere roles: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException('No tienes permisos para acceder a este recurso');
    }

    this.logger.debug(`Acceso permitido para usuario ${user.email} con rol ${user.role}`);
    return true;
  }
}
