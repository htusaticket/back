// src/infrastructure/http/controllers/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AdminUsersController } from './admin-users.controller';
import { AdminClassesController } from './admin-classes.controller';
import { AdminSubmissionsController } from './admin-submissions.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AdminSystemConfigController } from './admin-system-config.controller';
import { AdminProfileController } from './admin-profile.controller';
import { AuditLogController } from './audit-log.controller';
import { AdminAcademyController } from './admin-academy.controller';
import { AdminJobsController } from './admin-jobs.controller';
import { AdminChallengesController } from './admin-challenges.controller';

import { AdminUsersService } from '@/application/admin/services/admin-users.service';
import { AdminClassesService } from '@/application/admin/services/admin-classes.service';
import { AdminSubmissionsService } from '@/application/admin/services/admin-submissions.service';
import { AdminDashboardService } from '@/application/admin/services/admin-dashboard.service';
import { AdminSubscriptionsService } from '@/application/admin/services/admin-subscriptions.service';
import { AdminSystemConfigService } from '@/application/admin/services/admin-system-config.service';
import { AdminProfileService } from '@/application/admin/services/admin-profile.service';
import { AuditLogService } from '@/application/admin/services/audit-log.service';
import { AdminAcademyService } from '@/application/admin/services/admin-academy.service';
import { AdminJobsService } from '@/application/admin/services/admin-jobs.service';
import { AdminChallengesService } from '@/application/admin/services/admin-challenges.service';
import { EmailService } from '@/application/auth/services/email.service';

import { PrismaModule } from '@/infrastructure/persistence/prisma/prisma.module';
import { CloudflareStorageModule } from '@/infrastructure/storage/cloudflare/cloudflare-storage.module';
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
    CloudflareStorageModule,
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
    AdminSubscriptionsController,
    AdminSystemConfigController,
    AdminProfileController,
    AuditLogController,
    AdminAcademyController,
    AdminJobsController,
    AdminChallengesController,
  ],
  providers: [
    AdminUsersService,
    AdminClassesService,
    AdminSubmissionsService,
    AdminDashboardService,
    AdminSubscriptionsService,
    AdminSystemConfigService,
    AdminProfileService,
    AuditLogService,
    AdminAcademyService,
    AdminJobsService,
    AdminChallengesService,
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
    EmailService,
  ],
  exports: [
    AdminUsersService,
    AdminClassesService,
    AdminSubmissionsService,
    AdminDashboardService,
    AdminSubscriptionsService,
    AdminSystemConfigService,
    AdminProfileService,
    AuditLogService,
    AdminAcademyService,
    AdminJobsService,
    AdminChallengesService,
  ],
})
export class AdminModule {}
