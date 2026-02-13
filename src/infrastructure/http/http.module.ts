import { Module } from '@nestjs/common';
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { ClassesModule } from './controllers/classes/classes.module';
import { DashboardModule } from './controllers/dashboard/dashboard.module';
import { AcademyModule } from './controllers/academy/academy.module';
import { ChallengesModule } from './controllers/challenges/challenges.module';

@Module({
  imports: [PrismaModule, ClassesModule, DashboardModule, AcademyModule, ChallengesModule],
  controllers: [],
  exports: [ClassesModule, DashboardModule, AcademyModule, ChallengesModule],
})
export class HttpModule {}
