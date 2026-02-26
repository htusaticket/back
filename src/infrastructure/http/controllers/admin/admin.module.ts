// src/infrastructure/http/controllers/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AdminUsersController } from './admin-users.controller';
import { AdminClassesController } from './admin-classes.controller';
import { AdminSubmissionsController } from './admin-submissions.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminUsersService } from '@/application/admin/services/admin-users.service';
import { AdminClassesService } from '@/application/admin/services/admin-classes.service';
import { AdminSubmissionsService } from '@/application/admin/services/admin-submissions.service';
import { AdminDashboardService } from '@/application/admin/services/admin-dashboard.service';

import { PrismaModule } from '@/infrastructure/persistence/prisma/prisma.module';
import { PrismaUserRepository } from '@/infrastructure/persistence/prisma/repositories/user.repository';
import { PrismaStrikeRepository } from '@/infrastructure/persistence/prisma/repositories/strike.repository';
import { PrismaClassSessionRepository } from '@/infrastructure/persistence/prisma/repositories/class-session.repository';
import { PrismaNotificationRepository } from '@/infrastructure/persistence/prisma/repositories/notification.repository';

import { USER_REPOSITORY } from '@/core/interfaces/user.repository';
import { STRIKE_REPOSITORY } from '@/core/interfaces/strike.repository';
import { CLASS_SESSION_REPOSITORY } from '@/core/interfaces/class-session.repository';
import { NOTIFICATION_REPOSITORY } from '@/core/interfaces/notification.repository';

import { getEnvConfig } from '@/config/env.config';

const env = getEnvConfig();

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: env.JWT_EXPIRES_IN },
    }),
  ],
  controllers: [
    AdminUsersController,
    AdminClassesController,
    AdminSubmissionsController,
    AdminDashboardController,
  ],
  providers: [
    AdminUsersService,
    AdminClassesService,
    AdminSubmissionsService,
    AdminDashboardService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: STRIKE_REPOSITORY,
      useClass: PrismaStrikeRepository,
    },
    {
      provide: CLASS_SESSION_REPOSITORY,
      useClass: PrismaClassSessionRepository,
    },
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [AdminUsersService, AdminClassesService, AdminSubmissionsService, AdminDashboardService],
})
export class AdminModule {}
