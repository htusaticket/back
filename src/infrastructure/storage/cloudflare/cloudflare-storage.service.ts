// src/infrastructure/storage/cloudflare/cloudflare-storage.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CloudflareStorageService implements OnModuleInit {
  private readonly logger = new Logger(CloudflareStorageService.name);
  private s3Client: S3Client | null = null;
  private isConfigured = false;
  private bucketName: string = '';
  private publicUrl: string = '';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeCloudflare();
  }

  private initializeCloudflare(): void {
    const accountId = this.configService.get<string>('CLOUDFLARE_R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    const bucketName = this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME');
    const publicUrl = this.configService.get<string>('CLOUDFLARE_R2_PUBLIC_URL');

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      this.logger.warn(
        'Cloudflare R2 credentials not configured. File upload functionality will be disabled.',
      );
      this.logger.warn(
        'Set CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME in .env',
      );
      return;
    }

    try {
      // Configurar el endpoint de Cloudflare R2
      const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

      this.logger.log(`Initializing Cloudflare R2 with endpoint: ${endpoint}`);
      this.logger.log(`Bucket: ${bucketName}`);
      this.logger.log(`Access Key ID: ${accessKeyId?.substring(0, 8)}...`);

      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true,
        requestHandler: {
          requestTimeout: 30000,
        },
      });

      this.bucketName = bucketName;
      this.publicUrl = publicUrl || '';
      this.isConfigured = true;

      if (!this.publicUrl) {
        this.logger.warn(
          '⚠️ CLOUDFLARE_R2_PUBLIC_URL is not set. File uploads will fail because a valid public URL cannot be generated. ' +
            'Set it to your R2 public bucket URL (e.g. https://pub-xxxxx.r2.dev)',
        );
      }

      this.logger.log('✅ Cloudflare R2 Storage initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Cloudflare R2 Storage', error);
      this.isConfigured = false;
    }
  }

  /**
   * Verifica si Cloudflare R2 está configurado
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Sube un archivo de audio al storage
   * @param file - Buffer del archivo
   * @param userId - ID del usuario
   * @param challengeId - ID del challenge
   * @param mimeType - Tipo MIME del archivo
   * @returns URL pública del archivo
   */
  async uploadAudio(
    file: Buffer,
    userId: string,
    challengeId: number,
    mimeType: string = 'audio/webm',
  ): Promise<string> {
    if (!this.isConfigured || !this.s3Client) {
      this.logger.error('Cloudflare R2 Storage is not configured');
      throw new Error('Cloudflare R2 Storage is not configured');
    }

    const filename = `challenges/${userId}/${challengeId}/${uuidv4()}.webm`;

    this.logger.log(`Uploading audio: ${filename}`);
    this.logger.log(`File size: ${file.length} bytes`);

    const params: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: filename,
      Body: file,
      ContentType: mimeType,
      Metadata: {
        userId,
        challengeId: String(challengeId),
        uploadedAt: new Date().toISOString(),
      },
    };

    try {
      await this.s3Client.send(new PutObjectCommand(params));

      // Construir URL pública
      if (!this.publicUrl) {
        this.logger.error(
          '❌ CLOUDFLARE_R2_PUBLIC_URL is not configured. Cannot generate a valid public URL. ' +
            'Set CLOUDFLARE_R2_PUBLIC_URL in .env (e.g. https://pub-xxxxx.r2.dev)',
        );
        throw new Error(
          'CLOUDFLARE_R2_PUBLIC_URL is not configured. Cannot generate a valid public URL for uploaded files.',
        );
      }

      const publicUrl = `${this.publicUrl}/${filename}`;

      this.logger.log(`✅ Audio uploaded successfully: ${publicUrl}`);
      return publicUrl;
    } catch (error: unknown) {
      this.logger.error(`❌ Failed to upload audio to Cloudflare R2:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode =
        error && typeof error === 'object' && 'code' in error
          ? (error as { code: string }).code
          : undefined;
      const statusCode =
        error && typeof error === 'object' && '$metadata' in error
          ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
          : undefined;

      this.logger.error(`Error details:`, {
        message: errorMessage,
        code: errorCode,
        statusCode: statusCode,
      });

      // Provide more helpful error message for common issues
      if (errorCode === 'SignatureDoesNotMatch' || errorMessage.includes('SignatureDoesNotMatch')) {
        this.logger.error(
          '⚠️ SignatureDoesNotMatch: This usually means the CLOUDFLARE_R2_ACCESS_KEY_ID or ' +
            'CLOUDFLARE_R2_SECRET_ACCESS_KEY in your .env file is incorrect. ' +
            'Please verify your Cloudflare R2 API token credentials.',
        );
        throw new Error(
          'Storage authentication failed. Please verify the Cloudflare R2 credentials ' +
            '(CLOUDFLARE_R2_ACCESS_KEY_ID and CLOUDFLARE_R2_SECRET_ACCESS_KEY) in your .env file.',
        );
      }

      throw new Error(`Failed to upload file to storage: ${errorMessage}`);
    }
  }

  /**
   * Sube un recurso de lección al storage
   * @param file - Buffer del archivo
   * @param lessonId - ID de la lección
   * @param originalName - Nombre original del archivo
   * @param mimeType - Tipo MIME del archivo
   * @returns URL pública del archivo
   */
  async uploadLessonResource(
    file: Buffer,
    lessonId: number,
    originalName: string,
    mimeType: string,
  ): Promise<string> {
    if (!this.isConfigured || !this.s3Client) {
      throw new Error('Cloudflare R2 Storage is not configured');
    }

    const extension = originalName.split('.').pop() || 'pdf';
    const filename = `lessons/${lessonId}/resources/${uuidv4()}.${extension}`;

    const params: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: filename,
      Body: file,
      ContentType: mimeType,
      Metadata: {
        originalName,
        lessonId: String(lessonId),
        uploadedAt: new Date().toISOString(),
      },
    };

    await this.s3Client.send(new PutObjectCommand(params));

    // Construir URL pública
    if (!this.publicUrl) {
      this.logger.error(
        '❌ CLOUDFLARE_R2_PUBLIC_URL is not configured. Cannot generate a valid public URL.',
      );
      throw new Error(
        'CLOUDFLARE_R2_PUBLIC_URL is not configured. Cannot generate a valid public URL for uploaded files.',
      );
    }

    const publicUrl = `${this.publicUrl}/${filename}`;

    this.logger.log(`Lesson resource uploaded successfully: ${filename}`);
    return publicUrl;
  }

  /**
   * Elimina un archivo del storage
   * @param fileUrl - URL del archivo a eliminar
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.isConfigured || !this.s3Client) {
      throw new Error('Cloudflare R2 Storage is not configured');
    }

    try {
      // Extraer el path del archivo de la URL
      let filePath: string;

      if (this.publicUrl && fileUrl.startsWith(this.publicUrl)) {
        filePath = fileUrl.replace(`${this.publicUrl}/`, '');
      } else if (fileUrl.includes('.r2.dev/')) {
        const parts = fileUrl.split('.r2.dev/');
        filePath = parts[1] ?? '';
      } else {
        throw new Error('Invalid file URL format');
      }

      if (!filePath) {
        throw new Error('Invalid file path');
      }

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: filePath,
        }),
      );

      this.logger.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${fileUrl}`, error);
      throw error;
    }
  }
}
