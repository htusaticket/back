// src/application/common/services/plan-expiration.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { EmailService } from '@/application/auth/services/email.service';

@Injectable()
export class PlanExpirationService {
  private readonly logger = new Logger(PlanExpirationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Ejecuta todos los días a la medianoche (00:00)
   * Revisa subscripciones activas cuya fecha de fin ha pasado y las marca como EXPIRED
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredSubscriptions(): Promise<void> {
    this.logger.log('Starting expired subscriptions check...');

    const now = new Date();

    // Buscar subscripciones ACTIVE cuya fecha de fin ha pasado
    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          lt: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (expiredSubscriptions.length === 0) {
      this.logger.log('No expired subscriptions found');
      return;
    }

    this.logger.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

    // Procesar cada subscripción expirada
    for (const subscription of expiredSubscriptions) {
      try {
        // Cambiar estado de la subscripción a EXPIRED
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.EXPIRED,
          },
        });

        // Crear notificación para el usuario
        await this.prisma.notification.create({
          data: {
            userId: subscription.userId,
            type: NotificationType.PLAN_EXPIRED,
            title: 'Tu subscripción ha expirado',
            message: `Tu subscripción ${subscription.plan} ha expirado. Contacta al administrador para renovar tu acceso.`,
            data: {
              plan: subscription.plan,
              expiredAt: subscription.endDate.toISOString(),
            },
          },
        });

        // Enviar email de notificación
        await this.emailService.sendPlanExpiredEmail(
          subscription.user.email,
          subscription.user.firstName,
          subscription.plan,
        );

        this.logger.log(
          `Subscription ${subscription.id} for user ${subscription.user.email} expired, marked as EXPIRED`,
        );
      } catch (error) {
        this.logger.error(`Error processing expired subscription ${subscription.id}:`, error);
      }
    }

    this.logger.log(
      `Expired subscriptions check completed. Processed ${expiredSubscriptions.length} subscriptions`,
    );
  }

  /**
   * Ejecuta todos los días a las 9:00 AM
   * Envía recordatorio a usuarios cuya subscripción expirará en 3 días
   */
  @Cron('0 9 * * *')
  async sendExpirationReminders(): Promise<void> {
    this.logger.log('Starting expiration reminders check...');

    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Buscar subscripciones activas que expiran en 3 días
    const expiringSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (expiringSubscriptions.length === 0) {
      this.logger.log('No subscriptions expiring in 3 days');
      return;
    }

    this.logger.log(`Found ${expiringSubscriptions.length} subscriptions expiring soon`);

    // Por ahora solo logueamos, se puede agregar email de recordatorio después
    for (const subscription of expiringSubscriptions) {
      this.logger.log(
        `User ${subscription.user.email} subscription ${subscription.plan} expires on ${subscription.endDate.toISOString()}`,
      );
      // TODO: Agregar email de recordatorio cuando se tenga el template
    }
  }
}
