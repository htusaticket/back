// src/infrastructure/http/controllers/challenges/challenges.module.ts
import { Module } from '@nestjs/common';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from '@/application/challenges/services/challenges.service';
import { ChallengesRepository } from '@/infrastructure/persistence/repositories/challenges.repository';
import { PrismaModule } from '@/infrastructure/persistence/prisma/prisma.module';
import { CloudflareStorageModule } from '@/infrastructure/storage/cloudflare/cloudflare-storage.module';
import { DAILY_CHALLENGE_REPOSITORY } from '@/core/interfaces';

@Module({
  imports: [PrismaModule, CloudflareStorageModule],
  controllers: [ChallengesController],
  providers: [
    ChallengesService,
    {
      provide: DAILY_CHALLENGE_REPOSITORY,
      useClass: ChallengesRepository,
    },
  ],
  exports: [ChallengesService],
})
export class ChallengesModule {}
