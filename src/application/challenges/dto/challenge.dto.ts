// src/application/challenges/dto/challenge.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

// ==================== DAILY CHALLENGE ====================

export class DailyChallengeDto {
  @ApiProperty({ example: 1, description: 'ID del challenge' })
  id!: number;

  @ApiProperty({ example: 'Describe Your Morning Routine', description: 'Título del challenge' })
  title!: string;

  @ApiProperty({ enum: ['AUDIO', 'MULTIPLE_CHOICE', 'WRITING'], description: 'Tipo de challenge' })
  type!: string;

  @ApiProperty({
    example: 'Record a 2-3 minute audio describing your morning routine...',
    description: 'Instrucciones del challenge',
  })
  instructions!: string;

  @ApiProperty({ example: '2026-02-09T23:59:00Z', description: 'Fecha límite' })
  deadline!: string;

  @ApiProperty({ example: 10, description: 'Puntos que otorga el challenge' })
  points!: number;

  @ApiProperty({
    example: 'pending',
    enum: ['pending', 'submitted', 'approved', 'needs_improvement'],
    description: 'Estado del challenge para el usuario',
  })
  status!: string;

  @ApiProperty({ example: null, description: 'URL del archivo enviado (si aplica)' })
  fileUrl!: string | null;
}

// ==================== QUIZ ====================

export class QuizQuestionDto {
  @ApiProperty({ example: 1, description: 'ID de la pregunta' })
  id!: number;

  @ApiProperty({ example: "What does 'ROI' stand for?", description: 'Texto de la pregunta' })
  text!: string;

  @ApiProperty({
    example: ['Rate of Inflation', 'Return on Investment', 'Risk of Insolvency'],
    description: 'Opciones de respuesta',
  })
  options!: string[];
}

export class QuizChallengeDto extends DailyChallengeDto {
  @ApiProperty({ type: [QuizQuestionDto], description: 'Preguntas del quiz' })
  questions!: QuizQuestionDto[];
}

export class SubmitQuizDto {
  @ApiProperty({
    example: [1, 2, 0, 1],
    description: 'Array de índices de respuestas seleccionadas (en orden de las preguntas)',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  answers!: number[];
}

export class QuizResultDto {
  @ApiProperty({ example: true, description: 'Si el quiz fue aprobado' })
  passed!: boolean;

  @ApiProperty({ example: 8, description: 'Respuestas correctas' })
  correctAnswers!: number;

  @ApiProperty({ example: 10, description: 'Total de preguntas' })
  totalQuestions!: number;

  @ApiProperty({ example: 80, description: 'Porcentaje obtenido' })
  score!: number;

  @ApiProperty({ enum: ['APPROVED', 'NEEDS_IMPROVEMENT'], description: 'Estado del resultado' })
  status!: string;

  @ApiProperty({ example: 'Great job! You passed the quiz.', description: 'Mensaje de feedback' })
  message!: string;

  @ApiProperty({
    example: [1, 2, 0, 1],
    description: 'Array con el índice de la respuesta correcta para cada pregunta',
  })
  correctOptions!: number[];
}

// ==================== AUDIO SUBMISSION ====================

export class AudioSubmissionResultDto {
  @ApiProperty({ example: true, description: 'Si la subida fue exitosa' })
  success!: boolean;

  @ApiProperty({ example: 'https://storage.googleapis.com/...', description: 'URL del archivo' })
  fileUrl!: string;

  @ApiProperty({ enum: ['PENDING'], description: 'Estado de la submission' })
  status!: string;

  @ApiProperty({
    example: 'Audio submitted successfully. Waiting for teacher review.',
    description: 'Mensaje de confirmación',
  })
  message!: string;
}

// ==================== HISTORY ====================

export class ChallengeHistoryItemDto {
  @ApiProperty({ example: 'cuid123', description: 'ID del progreso' })
  id!: string;

  @ApiProperty({ example: 1, description: 'ID del challenge' })
  challengeId!: number;

  @ApiProperty({ example: 'Tell Us About Your Hometown', description: 'Título del challenge' })
  title!: string;

  @ApiProperty({ enum: ['AUDIO', 'MULTIPLE_CHOICE'], description: 'Tipo de challenge' })
  type!: string;

  @ApiProperty({ example: '2026-01-28T14:30:00Z', description: 'Fecha de envío' })
  submittedAt!: string;

  @ApiProperty({
    enum: ['PENDING', 'APPROVED', 'NEEDS_IMPROVEMENT'],
    description: 'Estado de la submission',
  })
  status!: string;

  @ApiProperty({ example: 9, description: 'Puntaje obtenido (solo quiz)', nullable: true })
  score!: number | null;

  @ApiProperty({
    example: 'Excellent work! Your pronunciation has improved significantly.',
    description: 'Feedback del profesor',
    nullable: true,
  })
  feedback!: string | null;
}

export class ChallengeHistoryDto {
  @ApiProperty({ type: [ChallengeHistoryItemDto], description: 'Lista de challenges pasados' })
  history!: ChallengeHistoryItemDto[];
}

// ==================== QUIZ DETAIL ====================

export class QuizDetailQuestionDto {
  @ApiProperty({ example: 1, description: 'ID de la pregunta' })
  id!: number;

  @ApiProperty({ example: "What does 'ROI' stand for?", description: 'Texto de la pregunta' })
  text!: string;

  @ApiProperty({
    example: ['Rate of Inflation', 'Return on Investment', 'Risk of Insolvency'],
    description: 'Opciones de respuesta',
  })
  options!: string[];

  @ApiProperty({ example: 1, description: 'Índice de la respuesta correcta' })
  correctAnswer!: number;

  @ApiProperty({ example: 0, description: 'Índice de la respuesta del usuario' })
  userAnswer!: number;
}

export class QuizDetailDto {
  @ApiProperty({ example: 'cuid123', description: 'ID del progreso' })
  id!: string;

  @ApiProperty({ example: 1, description: 'ID del challenge' })
  challengeId!: number;

  @ApiProperty({ example: 'Grammar Quiz: Present Perfect', description: 'Título del quiz' })
  title!: string;

  @ApiProperty({ example: 90, description: 'Puntaje obtenido' })
  score!: number | null;

  @ApiProperty({ enum: ['APPROVED', 'NEEDS_IMPROVEMENT'], description: 'Estado' })
  status!: string;

  @ApiProperty({ example: '2026-02-17T14:30:00Z', description: 'Fecha de envío' })
  submittedAt!: string;

  @ApiProperty({ type: [QuizDetailQuestionDto], description: 'Preguntas con respuestas' })
  questions!: QuizDetailQuestionDto[];
}
