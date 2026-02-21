// src/infrastructure/http/controllers/jobs/jobs.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/infrastructure/persistence/prisma/prisma.module';
import { JobsController } from './jobs.controller';
import { ApplicationsController } from './applications.controller';
import { JobsService, ApplicationsService } from '@/application/jobs/services';
import { JOB_REPOSITORY, JOB_APPLICATION_REPOSITORY } from '@/core/interfaces';
import {
  PrismaJobRepository,
  PrismaJobApplicationRepository,
} from '@/infrastructure/persistence/prisma/repositories';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [JobsController, ApplicationsController],
  providers: [
    JobsService,
    ApplicationsService,
    {
      provide: JOB_REPOSITORY,
      useClass: PrismaJobRepository,
    },
    {
      provide: JOB_APPLICATION_REPOSITORY,
      useClass: PrismaJobApplicationRepository,
    },
  ],
  exports: [JobsService, ApplicationsService],
})
export class JobsModule {}
