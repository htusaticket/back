// src/application/auth/guards/active-subscription.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { UserRole, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { JwtPayload } from '../services/auth.service';

/**
 * Exige una subscripción ACTIVE para acceder a contenido.
 * Solo aplica a alumnos (rol USER): staff y job uploaders no dependen de subscripción.
 * Usar después de JwtAuthGuard, que inyecta el user en el request.
 *
 * No se aplica a auth/profile/notifications/contact para que un alumno
 * con subscripción vencida o cancelada pueda loguearse, ver su perfil
 * y solicitar la renovación.
 */
@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(ActiveSubscriptionGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload; url?: string }>();
    const user = request.user;

    if (!user) {
      this.logger.warn('ActiveSubscriptionGuard ejecutado sin usuario autenticado');
      throw new ForbiddenException({
        message: 'No tienes permisos para acceder a este recurso',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    if (user.role !== UserRole.USER) {
      return true;
    }

    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId: user.userId,
        status: SubscriptionStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (!activeSubscription) {
      this.logger.warn(
        `Usuario ${user.email} sin subscripción activa intentó acceder a: ${request.url ?? 'desconocido'}`,
      );
      throw new ForbiddenException({
        message: 'Necesitas una subscripción activa para acceder a este contenido',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    return true;
  }
}
