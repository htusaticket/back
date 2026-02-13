// src/application/challenges/services/challenges.service.ts
import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SubmissionStatus, ChallengeType } from '@prisma/client';
import { IDailyChallengeRepository, DAILY_CHALLENGE_REPOSITORY } from '@/core/interfaces';
import { FirebaseStorageService } from '@/infrastructure/storage/firebase/firebase-storage.service';
import {
  DailyChallengeDto,
  QuizChallengeDto,
  QuizResultDto,
  AudioSubmissionResultDto,
  ChallengeHistoryDto,
} from '../dto';

// Umbral de aprobación para quiz (70%)
const QUIZ_PASS_THRESHOLD = 70;

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    @Inject(DAILY_CHALLENGE_REPOSITORY)
    private readonly challengesRepository: IDailyChallengeRepository,
    private readonly firebaseStorage: FirebaseStorageService,
  ) {}

  /**
   * Obtener el challenge del día actual
   */
  async getDailyChallenge(userId: string): Promise<DailyChallengeDto | QuizChallengeDto | null> {
    this.logger.debug(`Getting daily challenge for user: ${userId}`);

    const challenge = await this.challengesRepository.findTodayChallenge();

    if (!challenge) {
      return null;
    }

    // Obtener progreso del usuario
    const userProgress = await this.challengesRepository.findUserProgress(userId, challenge.id);

    // Mapear estado
    let status = 'pending';
    if (userProgress?.completed) {
      status =
        userProgress.status === SubmissionStatus.PENDING
          ? 'submitted'
          : userProgress.status.toLowerCase();
    }

    // Calcular deadline (fin del día)
    const deadline = new Date(challenge.date);
    deadline.setHours(23, 59, 59, 999);

    const baseDto: DailyChallengeDto = {
      id: challenge.id,
      title: challenge.title,
      type: challenge.type,
      instructions: challenge.instructions,
      deadline: deadline.toISOString(),
      points: challenge.points,
      status,
      fileUrl: userProgress?.fileUrl || null,
    };

    // Si es quiz, agregar preguntas (sin respuestas correctas)
    if (challenge.type === ChallengeType.MULTIPLE_CHOICE) {
      const questions = await this.challengesRepository.findChallengeQuestions(challenge.id);
      return {
        ...baseDto,
        questions,
      } as QuizChallengeDto;
    }

    return baseDto;
  }

  /**
   * Obtener preguntas de un challenge específico (para quiz)
   */
  async getChallengeQuestions(challengeId: number, userId: string): Promise<QuizChallengeDto> {
    this.logger.debug(`Getting questions for challenge: ${challengeId}`);

    const challenge = await this.challengesRepository.findById(challengeId);

    if (!challenge) {
      throw new NotFoundException(`Challenge with ID ${challengeId} not found`);
    }

    if (challenge.type !== ChallengeType.MULTIPLE_CHOICE) {
      throw new BadRequestException('This challenge is not a quiz');
    }

    const questions = await this.challengesRepository.findChallengeQuestions(challengeId);
    const userProgress = await this.challengesRepository.findUserProgress(userId, challengeId);

    let status = 'pending';
    if (userProgress?.completed) {
      status =
        userProgress.status === SubmissionStatus.PENDING
          ? 'submitted'
          : userProgress.status.toLowerCase();
    }

    const deadline = new Date(challenge.date);
    deadline.setHours(23, 59, 59, 999);

    return {
      id: challenge.id,
      title: challenge.title,
      type: challenge.type,
      instructions: challenge.instructions,
      deadline: deadline.toISOString(),
      points: challenge.points,
      status,
      fileUrl: null,
      questions,
    };
  }

  /**
   * Enviar respuestas de quiz y calcular resultado
   */
  async submitQuiz(challengeId: number, userId: string, answers: number[]): Promise<QuizResultDto> {
    this.logger.debug(`Submitting quiz for challenge: ${challengeId}, user: ${userId}`);

    const challenge = await this.challengesRepository.findById(challengeId);

    if (!challenge) {
      throw new NotFoundException(`Challenge with ID ${challengeId} not found`);
    }

    if (challenge.type !== ChallengeType.MULTIPLE_CHOICE) {
      throw new BadRequestException('This challenge is not a quiz');
    }

    // Obtener preguntas con respuestas correctas
    const questions =
      await this.challengesRepository.findChallengeQuestionsWithAnswers(challengeId);

    if (answers.length !== questions.length) {
      throw new BadRequestException(`Expected ${questions.length} answers, got ${answers.length}`);
    }

    // Calcular score
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (question.correctAnswer === answers[index]) {
        correctAnswers++;
      }
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= QUIZ_PASS_THRESHOLD;
    const status = passed ? SubmissionStatus.APPROVED : SubmissionStatus.NEEDS_IMPROVEMENT;

    // Guardar resultado
    await this.challengesRepository.submitQuiz(userId, challengeId, answers, score, status);

    const message = passed
      ? `Great job! You passed with ${score}%!`
      : `You scored ${score}%. You need at least ${QUIZ_PASS_THRESHOLD}% to pass. Try again!`;

    return {
      passed,
      correctAnswers,
      totalQuestions,
      score,
      status,
      message,
    };
  }

  /**
   * Enviar archivo de audio para challenge
   */
  async submitAudio(
    challengeId: number,
    userId: string,
    audioFile: Express.Multer.File,
  ): Promise<AudioSubmissionResultDto> {
    this.logger.debug(`Submitting audio for challenge: ${challengeId}, user: ${userId}`);

    const challenge = await this.challengesRepository.findById(challengeId);

    if (!challenge) {
      throw new NotFoundException(`Challenge with ID ${challengeId} not found`);
    }

    if (challenge.type !== ChallengeType.AUDIO) {
      throw new BadRequestException('This challenge is not an audio challenge');
    }

    // Verificar si Firebase está configurado
    if (!this.firebaseStorage.isReady()) {
      throw new BadRequestException(
        'File storage is not configured. Please contact the administrator.',
      );
    }

    // Subir archivo a Firebase
    const fileUrl = await this.firebaseStorage.uploadAudio(
      audioFile.buffer,
      userId,
      challengeId,
      audioFile.mimetype,
    );

    // Guardar en base de datos (permite re-intento, actualiza el anterior)
    await this.challengesRepository.submitAudio(userId, challengeId, fileUrl);

    return {
      success: true,
      fileUrl,
      status: 'PENDING',
      message: 'Audio submitted successfully. Waiting for teacher review.',
    };
  }

  /**
   * Obtener historial de challenges del usuario
   */
  async getHistory(userId: string): Promise<ChallengeHistoryDto> {
    this.logger.debug(`Getting challenge history for user: ${userId}`);

    const history = await this.challengesRepository.findUserHistory(userId);

    return {
      history: history.map(item => ({
        id: item.id,
        challengeId: item.challengeId,
        title: item.challengeTitle,
        type: item.challengeType,
        submittedAt: item.submittedAt.toISOString(),
        status: item.status,
        score: item.score,
        feedback: item.feedback,
      })),
    };
  }
}
