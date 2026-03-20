// src/infrastructure/http/controllers/contact/contact.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@/infrastructure/persistence/prisma/prisma.module';
import { ContactController } from './contact.controller';
import { ContactService } from '@/application/contact/services/contact.service';
import { EmailService } from '@/application/auth/services/email.service';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ContactController],
  providers: [ContactService, EmailService],
  exports: [ContactService],
})
export class ContactModule {}
