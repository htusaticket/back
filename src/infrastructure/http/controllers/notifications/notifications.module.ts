// src/infrastructure/http/controllers/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/infrastructure/persistence/prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from '@/application/notifications/services/notifications.service';
import { NOTIFICATION_REPOSITORY } from '@/core/interfaces';
import { PrismaNotificationRepository } from '@/infrastructure/persistence/prisma/repositories';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
