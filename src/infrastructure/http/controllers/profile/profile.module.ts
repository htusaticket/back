// src/infrastructure/http/controllers/profile/profile.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/infrastructure/persistence/prisma/prisma.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from '@/application/profile/services/profile.service';
import { USER_REPOSITORY, STRIKE_REPOSITORY } from '@/core/interfaces';
import {
  PrismaUserRepository,
  PrismaStrikeRepository,
} from '@/infrastructure/persistence/prisma/repositories';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: STRIKE_REPOSITORY,
      useClass: PrismaStrikeRepository,
    },
  ],
  exports: [ProfileService],
})
export class ProfileModule {}
