// src/infrastructure/storage/firebase/firebase-storage.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FirebaseStorageService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseStorageService.name);
  private bucket: admin.storage.Storage | null = null;
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
    const storageBucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET');

    if (!projectId || !clientEmail || !privateKey || !storageBucket) {
      this.logger.warn(
        'Firebase credentials not configured. File upload functionality will be disabled.',
      );
      this.logger.warn(
        'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_STORAGE_BUCKET in .env',
      );
      return;
    }

    try {
      // Inicializar Firebase Admin si no está inicializado
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
          storageBucket,
        });
      }

      this.bucket = admin.storage();
      this.isConfigured = true;
      this.logger.log('Firebase Storage initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Storage', error);
    }
  }

  /**
   * Verifica si Firebase está configurado
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
    if (!this.isConfigured || !this.bucket) {
      throw new Error('Firebase Storage is not configured');
    }

    const bucket = admin.storage().bucket();
    const filename = `challenges/${userId}/${challengeId}/${uuidv4()}.webm`;
    const fileRef = bucket.file(filename);

    await fileRef.save(file, {
      metadata: {
        contentType: mimeType,
        metadata: {
          userId,
          challengeId: String(challengeId),
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Hacer el archivo público y obtener URL
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    this.logger.log(`Audio uploaded successfully: ${filename}`);
    return publicUrl;
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
    if (!this.isConfigured || !this.bucket) {
      throw new Error('Firebase Storage is not configured');
    }

    const bucket = admin.storage().bucket();
    const extension = originalName.split('.').pop() || 'pdf';
    const filename = `lessons/${lessonId}/resources/${uuidv4()}.${extension}`;
    const fileRef = bucket.file(filename);

    await fileRef.save(file, {
      metadata: {
        contentType: mimeType,
        metadata: {
          originalName,
          lessonId: String(lessonId),
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    this.logger.log(`Lesson resource uploaded successfully: ${filename}`);
    return publicUrl;
  }

  /**
   * Elimina un archivo del storage
   * @param fileUrl - URL del archivo a eliminar
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.isConfigured || !this.bucket) {
      throw new Error('Firebase Storage is not configured');
    }

    try {
      const bucket = admin.storage().bucket();
      // Extraer el path del archivo de la URL
      const urlParts = fileUrl.split(`${bucket.name}/`);
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL');
      }

      const filePath = urlParts[1] ?? '';
      if (!filePath) {
        throw new Error('Invalid file path');
      }
      await bucket.file(filePath).delete();
      this.logger.log(`File deleted successfully: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${fileUrl}`, error);
      throw error;
    }
  }
}
