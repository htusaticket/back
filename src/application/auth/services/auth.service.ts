// src/application/auth/services/auth.service.ts
import {
  Injectable,
  Inject,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserStatus, UserRole } from '@prisma/client';

import { IUserRepository, USER_REPOSITORY } from '@/core/interfaces/user.repository';
import {
  IPasswordResetRepository,
  PASSWORD_RESET_REPOSITORY,
} from '@/core/interfaces/password-reset.repository';
import { EmailService } from './email.service';
import { getEnvConfig } from '@/config/env.config';

import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto, UserResponseDto } from '../dto/auth-response.dto';

// Códigos de error específicos para el frontend
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_PENDING = 'ACCOUNT_PENDING',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  status: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly env = getEnvConfig();

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PASSWORD_RESET_REPOSITORY)
    private readonly passwordResetRepository: IPasswordResetRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Registra un nuevo usuario con status PENDING
   * El usuario debe esperar aprobación del admin para poder acceder
   * Envía emails de notificación al usuario y al admin
   */
  async register(dto: RegisterDto): Promise<{ message: string }> {
    this.logger.log(`Intento de registro para email: ${dto.email}`);

    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException({
        message: 'El email ya está registrado',
        code: AuthErrorCode.EMAIL_ALREADY_EXISTS,
      });
    }

    // Hashear password
    const hashedPassword = await bcrypt.hash(dto.password, this.env.BCRYPT_SALT_ROUNDS);

    // Crear usuario con status PENDING
    await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      city: dto.city,
      country: dto.country,
      reference: dto.reference ?? null,
      status: UserStatus.PENDING,
    });

    this.logger.log(`Usuario registrado exitosamente: ${dto.email}`);

    // Enviar email al usuario notificando que su registro está en revisión
    await this.emailService.sendRegistrationPendingEmail(dto.email, dto.firstName);

    // Obtener todos los administradores activos para notificarles
    const admins = await this.userRepository.findAllByRole(UserRole.ADMIN);
    const adminEmails = admins.map(admin => admin.email);

    // Enviar notificación a todos los administradores sobre el nuevo registro
    await this.emailService.sendNewRegistrationNotificationToAdmins(adminEmails, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      city: dto.city,
      country: dto.country,
    });

    return {
      message: 'Registro exitoso. Tu cuenta está pendiente de aprobación.',
    };
  }

  /**
   * Inicia sesión verificando credenciales y estado del usuario
   * Retorna error específico según el estado (PENDING, SUSPENDED)
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Intento de login para email: ${dto.email}`);

    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({
        message: 'Credenciales inválidas',
        code: AuthErrorCode.INVALID_CREDENTIALS,
      });
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: 'Credenciales inválidas',
        code: AuthErrorCode.INVALID_CREDENTIALS,
      });
    }

    // Verificar estado del usuario
    switch (user.status) {
      case UserStatus.PENDING:
        throw new ForbiddenException({
          message: 'Tu cuenta está pendiente de aprobación',
          code: AuthErrorCode.ACCOUNT_PENDING,
        });

      case UserStatus.SUSPENDED:
        throw new ForbiddenException({
          message: 'Tu cuenta ha sido suspendida. Contacta a soporte.',
          code: AuthErrorCode.ACCOUNT_SUSPENDED,
        });

      case UserStatus.ACTIVE:
        // Continuar con el login
        break;
    }

    // Generar JWT
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Login exitoso para: ${dto.email}`);

    return {
      accessToken,
      user: this.mapUserToResponse(user),
    };
  }

  /**
   * Obtiene los datos del usuario actual
   * Verifica que el usuario siga activo (no haya sido suspendido)
   */
  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Usuario no encontrado',
        code: AuthErrorCode.INVALID_TOKEN,
      });
    }

    // Verificar si el usuario fue suspendido mientras tenía token válido
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException({
        message: 'Tu cuenta ha sido suspendida',
        code: AuthErrorCode.ACCOUNT_SUSPENDED,
      });
    }

    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException({
        message: 'Tu cuenta está pendiente de aprobación',
        code: AuthErrorCode.ACCOUNT_PENDING,
      });
    }

    return this.mapUserToResponse(user);
  }

  /**
   * Solicita recuperación de contraseña
   * Genera token temporal y envía email
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    this.logger.log(`Solicitud de recuperación para: ${email}`);

    const user = await this.userRepository.findByEmail(email);

    // Siempre responder igual para no revelar si el email existe
    if (!user) {
      return {
        message: 'Si el email existe, recibirás un enlace de recuperación.',
      };
    }

    // Eliminar tokens anteriores del usuario
    await this.passwordResetRepository.deleteByUserId(user.id);

    // Generar token seguro
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token en DB
    await this.passwordResetRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    // Enviar email
    const resetLink = `${this.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.emailService.sendPasswordResetEmail(user.email, user.firstName, resetLink);

    this.logger.log(`Email de recuperación enviado a: ${email}`);

    return {
      message: 'Si el email existe, recibirás un enlace de recuperación.',
    };
  }

  /**
   * Restablece la contraseña usando el token
   * Invalida el token después de usarlo
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    this.logger.log('Intento de reset de contraseña');

    // Buscar token válido
    const passwordReset = await this.passwordResetRepository.findValidByToken(token);

    if (!passwordReset) {
      throw new BadRequestException({
        message: 'Token inválido o expirado',
        code: AuthErrorCode.TOKEN_EXPIRED,
      });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, this.env.BCRYPT_SALT_ROUNDS);

    // Actualizar contraseña
    await this.userRepository.updatePassword(passwordReset.userId, hashedPassword);

    // Marcar token como usado
    await this.passwordResetRepository.markAsUsed(passwordReset.id);

    this.logger.log(`Contraseña restablecida para userId: ${passwordReset.userId}`);

    return {
      message: 'Contraseña actualizada exitosamente.',
    };
  }

  /**
   * Valida si un token de reset es válido (sin usarlo)
   * Útil para el frontend para mostrar el formulario o error
   */
  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    const passwordReset = await this.passwordResetRepository.findValidByToken(token);
    return { valid: !!passwordReset };
  }

  /**
   * Mapea el usuario de la DB al DTO de respuesta (sin password)
   */
  private mapUserToResponse(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    city: string | null;
    country: string | null;
    reference: string | null;
    avatar: string | null;
    role: string;
    status: string;
    createdAt: Date;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      city: user.city,
      country: user.country,
      reference: user.reference,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
