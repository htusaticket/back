// src/infrastructure/http/controllers/challenges/challenges.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

import { ChallengesService } from '@/application/challenges/services/challenges.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';
import {
  DailyChallengeDto,
  QuizChallengeDto,
  SubmitQuizDto,
  QuizResultDto,
  AudioSubmissionResultDto,
  ChallengeHistoryDto,
} from '@/application/challenges/dto';

@ApiTags('Challenges')
@Controller('api/challenges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  /**
   * GET /api/challenges/daily
   * Obtener el challenge del día actual
   */
  @Get('daily')
  @ApiOperation({
    summary: 'Obtener challenge diario',
    description:
      'Retorna el challenge activo del día. Incluye tipo (AUDIO/MULTIPLE_CHOICE), instrucciones y estado del usuario.',
  })
  @ApiResponse({
    status: 200,
    description: 'Challenge del día',
    type: DailyChallengeDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No hay challenge para hoy',
  })
  async getDailyChallenge(
    @CurrentUser() user: JwtPayload,
  ): Promise<DailyChallengeDto | QuizChallengeDto | null> {
    return this.challengesService.getDailyChallenge(user.userId);
  }

  /**
   * GET /api/challenges/:id/questions
   * Obtener preguntas de un challenge de tipo quiz
   */
  @Get(':id/questions')
  @ApiOperation({
    summary: 'Obtener preguntas del quiz',
    description:
      'Retorna las preguntas de un challenge de tipo MULTIPLE_CHOICE. NO incluye las respuestas correctas.',
  })
  @ApiParam({ name: 'id', description: 'ID del challenge', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Preguntas del quiz',
    type: QuizChallengeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'El challenge no es de tipo quiz',
  })
  @ApiResponse({
    status: 404,
    description: 'Challenge no encontrado',
  })
  async getChallengeQuestions(
    @Param('id', ParseIntPipe) challengeId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuizChallengeDto> {
    return this.challengesService.getChallengeQuestions(challengeId, user.userId);
  }

  /**
   * POST /api/challenges/:id/submit-quiz
   * Enviar respuestas de quiz
   */
  @Post(':id/submit-quiz')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar respuestas del quiz',
    description:
      'Envía las respuestas del usuario. Calcula automáticamente el score y determina si aprobó (>=70%).',
  })
  @ApiParam({ name: 'id', description: 'ID del challenge', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Resultado del quiz',
    type: QuizResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'El challenge no es de tipo quiz o respuestas inválidas',
  })
  @ApiResponse({
    status: 404,
    description: 'Challenge no encontrado',
  })
  async submitQuiz(
    @Param('id', ParseIntPipe) challengeId: number,
    @Body() submitQuizDto: SubmitQuizDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<QuizResultDto> {
    return this.challengesService.submitQuiz(challengeId, user.userId, submitQuizDto.answers);
  }

  /**
   * POST /api/challenges/submit-audio
   * Enviar archivo de audio
   */
  @Post('submit-audio')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
      },
      fileFilter: (req, file, callback) => {
        // Aceptar audio/webm, audio/mp3, audio/wav, audio/ogg
        const allowedMimes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException('Invalid file type. Only audio files are allowed.'),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Enviar audio del challenge',
    description:
      'Sube un archivo de audio para un challenge de tipo AUDIO. Permite re-intento (sobrescribe el anterior).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de audio (webm, mp3, wav, ogg)',
        },
        challengeId: {
          type: 'number',
          description: 'ID del challenge',
        },
      },
      required: ['audio', 'challengeId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Audio subido correctamente',
    type: AudioSubmissionResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido o storage no configurado',
  })
  @ApiResponse({
    status: 404,
    description: 'Challenge no encontrado',
  })
  async submitAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body('challengeId', ParseIntPipe) challengeId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<AudioSubmissionResultDto> {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }

    return this.challengesService.submitAudio(challengeId, user.userId, file);
  }

  /**
   * GET /api/challenges/history
   * Obtener historial de challenges del usuario
   */
  @Get('history')
  @ApiOperation({
    summary: 'Obtener historial de challenges',
    description:
      'Retorna el historial de challenges completados del usuario, ordenados por fecha descendente. Incluye feedback del profesor si existe.',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de challenges',
    type: ChallengeHistoryDto,
  })
  async getHistory(@CurrentUser() user: JwtPayload): Promise<ChallengeHistoryDto> {
    return this.challengesService.getHistory(user.userId);
  }
}
