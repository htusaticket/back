// src/infrastructure/http/controllers/jobs/applications.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { ApplicationsService } from '@/application/jobs/services/applications.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';
import {
  MyApplicationsResponseDto,
  UpdateApplicationStatusDto,
  UpdateApplicationNotesDto,
  UpdateStatusResponseDto,
} from '@/application/jobs/dto';

@ApiTags('Applications')
@Controller('api/applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  /**
   * GET /api/applications/my
   * Obtener todas las aplicaciones del usuario
   */
  @Get('my')
  @ApiOperation({
    summary: 'Obtener mis aplicaciones',
    description:
      'Retorna todas las aplicaciones del usuario agrupadas por estado (Applied, Interview, Offer, Rejected).',
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicaciones agrupadas por estado',
    type: MyApplicationsResponseDto,
  })
  async getMyApplications(@CurrentUser() user: JwtPayload): Promise<MyApplicationsResponseDto> {
    return this.applicationsService.getMyApplications(user.userId);
  }

  /**
   * PATCH /api/applications/:id/status
   * Actualizar estado de una aplicación (para Kanban)
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar estado de aplicación',
    description:
      'Actualiza el estado de una aplicación. Usado cuando el usuario mueve una tarjeta en el tablero Kanban.',
  })
  @ApiParam({ name: 'id', description: 'ID de la aplicación', type: String })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado correctamente',
    type: UpdateStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Aplicación no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para modificar esta aplicación',
  })
  async updateStatus(
    @Param('id') applicationId: string,
    @Body() dto: UpdateApplicationStatusDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdateStatusResponseDto> {
    return this.applicationsService.updateStatus(user.userId, applicationId, dto.status);
  }

  /**
   * PATCH /api/applications/:id/notes
   * Actualizar notas de una aplicación
   */
  @Patch(':id/notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar notas de aplicación',
    description: 'Permite al usuario agregar o modificar notas personales sobre una aplicación.',
  })
  @ApiParam({ name: 'id', description: 'ID de la aplicación', type: String })
  @ApiResponse({
    status: 200,
    description: 'Notas actualizadas correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Aplicación no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para modificar esta aplicación',
  })
  async updateNotes(
    @Param('id') applicationId: string,
    @Body() dto: UpdateApplicationNotesDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; message: string }> {
    return this.applicationsService.updateNotes(user.userId, applicationId, dto.notes);
  }
}
