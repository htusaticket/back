// src/application/common/services/punishment-reset.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';

/**
 * Servicio de cron para resetear punishments expirados
 * Ejecuta cada hora para verificar si algún usuario tiene punishedUntil < ahora
 */
@Injectable()
export class PunishmentResetService {
  private readonly logger = new Logger(PunishmentResetService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ejecutar cada hora: Resetear punishments expirados
   */
  @Cron(CronExpression.EVERY_HOUR)
  async resetExpiredPunishments(): Promise<void> {
    this.logger.log('Checking for expired punishments...');

    const now = new Date();

    try {
      // Encontrar usuarios con punishment expirado
      const expiredPunishedUsers = await this.prisma.user.findMany({
        where: {
          isPunished: true,
          punishedUntil: {
            lte: now,
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          punishedUntil: true,
        },
      });

      if (expiredPunishedUsers.length === 0) {
        this.logger.log('No expired punishments found');
        return;
      }

      this.logger.log(`Found ${expiredPunishedUsers.length} users with expired punishments`);

      for (const user of expiredPunishedUsers) {
        try {
          // Resetear punishment y eliminar strikes
          await this.prisma.$transaction([
            // Quitar punishment
            this.prisma.user.update({
              where: { id: user.id },
              data: {
                isPunished: false,
                punishedUntil: null,
              },
            }),
            // Eliminar todos los strikes del usuario
            this.prisma.strike.deleteMany({
              where: { userId: user.id },
            }),
          ]);

          this.logger.log(
            `Reset punishment for user ${user.id} (${user.email}). ` +
              `Punishment was until: ${user.punishedUntil?.toISOString()}`,
          );

          // Crear notificación para el usuario
          await this.prisma.notification.create({
            data: {
              userId: user.id,
              title: 'Castigo finalizado',
              message:
                'Tu periodo de castigo ha terminado. Ya puedes volver a inscribirte en clases en vivo.',
              type: 'GENERAL',
              isRead: false,
            },
          });
        } catch (error) {
          this.logger.error(
            `Error resetting punishment for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      this.logger.log(`Successfully reset ${expiredPunishedUsers.length} expired punishments`);
    } catch (error) {
      this.logger.error(
        `Error in resetExpiredPunishments cron: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
