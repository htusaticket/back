// src/infrastructure/http/controllers/classes/classes.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/infrastructure/persistence/prisma/prisma.module';
import { ClassesController } from './classes.controller';
import { ClassesService } from '@/application/classes/services/classes.service';
import {
  CLASS_SESSION_REPOSITORY,
  STRIKE_REPOSITORY,
  NOTIFICATION_REPOSITORY,
  USER_REPOSITORY,
} from '@/core/interfaces';
import {
  PrismaClassSessionRepository,
  PrismaStrikeRepository,
  PrismaNotificationRepository,
  PrismaUserRepository,
} from '@/infrastructure/persistence/prisma/repositories';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ClassesController],
  providers: [
    ClassesService,
    {
      provide: CLASS_SESSION_REPOSITORY,
      useClass: PrismaClassSessionRepository,
    },
    {
      provide: STRIKE_REPOSITORY,
      useClass: PrismaStrikeRepository,
    },
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [ClassesService],
})
export class ClassesModule {}
