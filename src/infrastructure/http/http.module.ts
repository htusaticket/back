import { Module } from '@nestjs/common';
import { PrismaModule } from '../persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [],
  exports: [],
})
export class HttpModule {}
