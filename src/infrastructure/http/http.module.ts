import { Module } from '@nestjs/common';
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { ClassesModule } from './controllers/classes/classes.module';
import { DashboardModule } from './controllers/dashboard/dashboard.module';
import { AcademyModule } from './controllers/academy/academy.module';
import { ChallengesModule } from './controllers/challenges/challenges.module';
import { JobsModule } from './controllers/jobs/jobs.module';
import { ProfileModule } from './controllers/profile/profile.module';

@Module({
  imports: [
    PrismaModule,
    ClassesModule,
    DashboardModule,
    AcademyModule,
    ChallengesModule,
    JobsModule,
    ProfileModule,
  ],
  controllers: [],
  exports: [
    ClassesModule,
    DashboardModule,
    AcademyModule,
    ChallengesModule,
    JobsModule,
    ProfileModule,
  ],
})
export class HttpModule {}
