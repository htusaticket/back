// src/infrastructure/storage/cloudflare/cloudflare-storage.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudflareStorageService } from './cloudflare-storage.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CloudflareStorageService],
  exports: [CloudflareStorageService],
})
export class CloudflareStorageModule {}
