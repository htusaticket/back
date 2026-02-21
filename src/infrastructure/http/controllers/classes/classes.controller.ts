// src/infrastructure/http/controllers/classes/classes.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { ClassesService } from '@/application/classes/services/classes.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';
import { ClassResponseDto, EnrollResponseDto, CancelResponseDto } from '@/application/classes/dto';

@ApiTags('Classes')
@Controller('api/classes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  /**
   * GET /api/classes/available
   * Obtener todas las clases disponibles (futuras)
   */
  @Get('available')
  @ApiOperation({
    summary: 'Listar clases disponibles',
    description:
      'Retorna solo clases futuras (date > now). Calcula si is_full (current >= max) e isEnrolled para el usuario actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de clases disponibles',
    type: [ClassResponseDto],
  })
  async getAvailableClasses(@CurrentUser() user: JwtPayload): Promise<ClassResponseDto[]> {
    return this.classesService.getAvailableClasses(user.userId);
  }

  /**
   * GET /api/classes/my-schedule
   * Obtener clases del usuario (inscritas y confirmadas)
   */
  @Get('my-schedule')
  @ApiOperation({
    summary: 'Obtener mi horario de clases',
    description: 'Retorna las clases en las que el usuario está inscrito (status = CONFIRMED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de clases del usuario',
    type: [ClassResponseDto],
  })
  async getMySchedule(@CurrentUser() user: JwtPayload): Promise<ClassResponseDto[]> {
    return this.classesService.getMySchedule(user.userId);
  }

  /**
   * POST /api/classes/:id/enroll
   * Inscribirse en una clase
   */
  @Post(':id/enroll')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inscribirse en una clase',
    description:
      'Inscribe al usuario en una clase. Valida: usuario no inscrito previamente, cupo disponible (transacción atómica), usuario no suspendido',
  })
  @ApiParam({ name: 'id', description: 'ID de la clase', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Inscripción exitosa',
    type: EnrollResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Usuario suspendido o pendiente',
  })
  @ApiResponse({
    status: 404,
    description: 'Clase no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Usuario ya inscrito o clase llena',
  })
  async enrollInClass(
    @Param('id', ParseIntPipe) classId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<EnrollResponseDto> {
    return this.classesService.enrollInClass(user.userId, classId);
  }

  /**
   * POST /api/classes/:id/cancel
   * Cancelar inscripción en una clase
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar inscripción en una clase',
    description:
      'Cancela la inscripción del usuario. Si (class.date - now) < 24h → Agregar registro en tabla Strikes y notificar al usuario',
  })
  @ApiParam({ name: 'id', description: 'ID de la clase', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Cancelación exitosa',
    type: CancelResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Clase no encontrada o usuario no inscrito',
  })
  async cancelEnrollment(
    @Param('id', ParseIntPipe) classId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<CancelResponseDto> {
    return this.classesService.cancelEnrollment(user.userId, classId);
  }
}
