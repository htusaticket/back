// src/application/contact/services/contact.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { UserRole, UserStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { EmailService } from '@/application/auth/services/email.service';
import { JwtPayload } from '@/application/auth/services/auth.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Procesa una solicitud de upgrade de plan.
   * - Obtiene los datos del usuario actual
   * - Busca todos los SUPERADMINs activos
   * - Crea notificaciones in-database para cada SUPERADMIN
   * - Envía email a los SUPERADMINs configurados
   */
  async requestUpgrade(
    currentUser: JwtPayload,
    message?: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Solicitud de upgrade recibida del usuario: ${currentUser.email}`);

    // Obtener datos completos del usuario actual
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const currentPlan = user.subscriptions[0]?.plan ?? 'Sin plan activo';

    // Buscar todos los SUPERADMIN activos
    const superadmins = await this.prisma.user.findMany({
      where: {
        role: UserRole.SUPERADMIN,
        status: UserStatus.ACTIVE,
      },
      select: { id: true, email: true },
    });

    if (superadmins.length === 0) {
      this.logger.warn('No se encontraron superadmins activos para notificar');
    }

    // Crear notificaciones in-database para cada superadmin
    if (superadmins.length > 0) {
      await this.prisma.notification.createMany({
        data: superadmins.map(admin => ({
          userId: admin.id,
          type: NotificationType.UPGRADE_REQUEST,
          title: 'Solicitud de upgrade de plan',
          message: `${user.firstName} ${user.lastName} (${user.email}) ha solicitado un upgrade de su plan actual (${currentPlan}).${message ? ` Mensaje: ${message}` : ''}`,
          isRead: false,
          data: {
            requestingUserId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            currentPlan,
            message: message ?? null,
          },
        })),
      });

      this.logger.log(`Notificaciones de upgrade creadas para ${superadmins.length} superadmins`);
    }

    // Enviar email a los superadmins configurados
    const superadminEmails = this.emailService.getSuperadminEmails();

    await this.emailService.sendUpgradeRequestNotificationToAdmins(superadminEmails, {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      currentPlan,
      ...(message ? { message } : {}),
    });

    return {
      success: true,
      message:
        'Tu solicitud de upgrade ha sido enviada. Un administrador se pondrá en contacto contigo.',
    };
  }
}
