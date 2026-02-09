import { Module } from '@nestjs/common';
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { ClassesModule } from './controllers/classes/classes.module';
import { DashboardModule } from './controllers/dashboard/dashboard.module';

@Module({
  imports: [PrismaModule, ClassesModule, DashboardModule],
  controllers: [],
  exports: [ClassesModule, DashboardModule],
})
export class HttpModule {}
