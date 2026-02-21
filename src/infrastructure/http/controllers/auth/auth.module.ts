// src/infrastructure/http/controllers/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from '@/application/auth/services/auth.service';
import { EmailService } from '@/application/auth/services/email.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';

import { PrismaModule } from '@/infrastructure/persistence/prisma/prisma.module';
import { PrismaUserRepository } from '@/infrastructure/persistence/prisma/repositories/user.repository';
import { PrismaPasswordResetRepository } from '@/infrastructure/persistence/prisma/repositories/password-reset.repository';

import { USER_REPOSITORY } from '@/core/interfaces/user.repository';
import { PASSWORD_RESET_REPOSITORY } from '@/core/interfaces/password-reset.repository';

import { getEnvConfig, validateEnv } from '@/config/env.config';

// Asegurarse de que las variables de entorno estén validadas
validateEnv();
const env = getEnvConfig();

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: env.JWT_EXPIRES_IN },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailService,
    JwtAuthGuard,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: PASSWORD_RESET_REPOSITORY,
      useClass: PrismaPasswordResetRepository,
    },
  ],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
