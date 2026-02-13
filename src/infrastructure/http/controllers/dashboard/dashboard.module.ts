// src/infrastructure/http/controllers/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/infrastructure/persistence/prisma/prisma.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from '@/application/dashboard/services/dashboard.service';
import {
  CLASS_SESSION_REPOSITORY,
  DAILY_CHALLENGE_REPOSITORY,
  NOTIFICATION_REPOSITORY,
} from '@/core/interfaces';
import {
  PrismaClassSessionRepository,
  PrismaNotificationRepository,
} from '@/infrastructure/persistence/prisma/repositories';
import { ChallengesRepository } from '@/infrastructure/persistence/repositories/challenges.repository';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    {
      provide: CLASS_SESSION_REPOSITORY,
      useClass: PrismaClassSessionRepository,
    },
    {
      provide: DAILY_CHALLENGE_REPOSITORY,
      useClass: ChallengesRepository,
    },
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
