// src/infrastructure/http/controllers/academy/academy.module.ts
import { Module } from '@nestjs/common';
import { AcademyController } from './academy.controller';
import { AcademyService } from '@/application/academy/services/academy.service';
import { AcademyRepository } from '@/infrastructure/persistence/repositories/academy.repository';
import { PrismaModule } from '@/infrastructure/persistence/prisma/prisma.module';
import { ACADEMY_REPOSITORY } from '@/core/interfaces';

@Module({
  imports: [PrismaModule],
  controllers: [AcademyController],
  providers: [
    AcademyService,
    {
      provide: ACADEMY_REPOSITORY,
      useClass: AcademyRepository,
    },
  ],
  exports: [AcademyService],
})
export class AcademyModule {}
