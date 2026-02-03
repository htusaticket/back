// src/infrastructure/http/controllers/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { AuthService } from '@/application/auth/services/auth.service';
import { JwtAuthGuard } from '@/application/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/application/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/application/auth/services/auth.service';

import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LoginResponseDto,
  UserResponseDto,
  AuthMessageResponseDto,
} from '@/application/auth/dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Registra un nuevo usuario con status PENDING
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea un nuevo usuario con estado PENDING. Requiere aprobación del admin.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    type: AuthMessageResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'El email ya está registrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  async register(@Body() dto: RegisterDto): Promise<AuthMessageResponseDto> {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   * Inicia sesión y retorna JWT + datos del usuario
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica al usuario y retorna un JWT. Retorna error si la cuenta está pendiente o suspendida.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  @ApiResponse({
    status: 403,
    description: 'Cuenta pendiente (ACCOUNT_PENDING) o suspendida (ACCOUNT_SUSPENDED)',
  })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  /**
   * GET /auth/me
   * Obtiene los datos del usuario actual
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener usuario actual',
    description: 'Retorna los datos del usuario autenticado. Verifica que la cuenta siga activa.',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos del usuario',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o no proporcionado',
  })
  @ApiResponse({
    status: 403,
    description: 'Cuenta suspendida mientras el token era válido',
  })
  async getMe(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.authService.getMe(user.userId);
  }

  /**
   * POST /auth/forgot-password
   * Solicita recuperación de contraseña
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar recuperación de contraseña',
    description:
      'Envía un email con enlace de recuperación. Siempre responde OK para no revelar si el email existe.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email enviado (si existe)',
    type: AuthMessageResponseDto,
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<AuthMessageResponseDto> {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * POST /auth/reset-password
   * Restablece la contraseña usando el token
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restablecer contraseña',
    description:
      'Cambia la contraseña usando el token recibido por email. El token se invalida después de usarse.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada',
    type: AuthMessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido o expirado',
  })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<AuthMessageResponseDto> {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  /**
   * GET /auth/validate-reset-token
   * Valida si un token de reset es válido (sin usarlo)
   */
  @Get('validate-reset-token')
  @ApiOperation({
    summary: 'Validar token de reset',
    description:
      'Verifica si el token es válido antes de mostrar el formulario de nueva contraseña.',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Token de recuperación',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del token',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
      },
    },
  })
  async validateResetToken(@Query('token') token: string): Promise<{ valid: boolean }> {
    return this.authService.validateResetToken(token);
  }
}
