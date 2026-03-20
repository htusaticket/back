// src/infrastructure/http/controllers/contact/contact.controller.ts
import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';
import { ContactService } from '@/application/contact/services/contact.service';
import { UpgradeRequestDto } from '@/application/contact/dto';

@ApiTags('Contact')
@Controller('api/contact')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /**
   * POST /api/contact/upgrade
   * Solicitar upgrade de plan - notifica a todos los SUPERADMINs
   */
  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar upgrade de plan',
    description:
      'Envía una solicitud de upgrade de plan a todos los superadministradores. ' +
      'Crea notificaciones in-app y envía emails a los SUPERADMINs configurados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud enviada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example:
            'Tu solicitud de upgrade ha sido enviada. Un administrador se pondrá en contacto contigo.',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async requestUpgrade(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpgradeRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.contactService.requestUpgrade(user, dto.message);
  }
}
