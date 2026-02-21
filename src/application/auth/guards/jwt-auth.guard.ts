// src/application/auth/guards/jwt-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from '../services/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('No se proporcionó token de autenticación');
      throw new UnauthorizedException({
        message: 'No se proporcionó token de autenticación',
        code: 'MISSING_TOKEN',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      // Inyectar el payload del usuario en el request
      request.user = payload;

      this.logger.debug(`Token válido para usuario: ${payload.email}`);
      return true;
    } catch {
      this.logger.warn('Token inválido o expirado');
      throw new UnauthorizedException({
        message: 'Token inválido o expirado',
        code: 'INVALID_TOKEN',
      });
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
