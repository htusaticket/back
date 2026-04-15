// src/application/auth/services/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { getEnvConfig } from '@/config/env.config';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';

const DEFAULT_LOGO_URL = 'https://pub-edad5806cdff45b08f50aa762e6fce6c.r2.dev/HT_USA_Logo-lau.png';

interface NewUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly env = getEnvConfig();
  private cachedLogoUrl: string | null = null;
  private logoFetchedAt = 0;
  private static readonly LOGO_TTL_MS = 60_000;

  constructor(private readonly prisma?: PrismaService) {
    this.resend = new Resend(this.env.RESEND_API_KEY);
  }

  private async getLogoUrl(): Promise<string> {
    const now = Date.now();
    if (this.cachedLogoUrl && now - this.logoFetchedAt < EmailService.LOGO_TTL_MS) {
      return this.cachedLogoUrl;
    }
    try {
      const cfg = await this.prisma?.systemConfig.findUnique({ where: { id: 'default' } });
      const url = cfg?.logoUrl?.trim() || DEFAULT_LOGO_URL;
      this.cachedLogoUrl = url;
      this.logoFetchedAt = now;
      return url;
    } catch {
      return DEFAULT_LOGO_URL;
    }
  }

  /**
   * Obtiene los emails de los superadmins configurados
   */
  getSuperadminEmails(): string[] {
    return this.env.SUPERADMIN_EMAILS.split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  /**
   * Envía email de recuperación de contraseña
   */
  async sendPasswordResetEmail(to: string, firstName: string, resetLink: string): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.env.RESEND_FROM_NAME} <${this.env.RESEND_FROM_EMAIL}>`,
        to,
        subject: 'Recupera tu contraseña - High Ticket USA',
        html: await this.getPasswordResetTemplate(firstName, resetLink),
      });

      if (error) {
        this.logger.error(`Error de Resend enviando email a ${to}:`, JSON.stringify(error));
        throw new Error('Error al enviar email');
      }

      this.logger.log(`Email de recuperación enviado a: ${to} (ID: ${data?.id})`);
    } catch (error) {
      this.logger.error(`Error enviando email a ${to}:`, error);
      // No lanzar error para no revelar información
    }
  }

  /**
   * Envía email al usuario notificando que su registro está en revisión
   */
  async sendRegistrationPendingEmail(to: string, firstName: string): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.env.RESEND_FROM_NAME} <${this.env.RESEND_FROM_EMAIL}>`,
        to,
        subject: 'Registro recibido - High Ticket USA',
        html: await this.getRegistrationPendingTemplate(firstName),
      });

      if (error) {
        this.logger.error(
          `Error de Resend enviando email de registro pendiente a ${to}:`,
          JSON.stringify(error),
        );
        throw new Error('Error al enviar email');
      }

      this.logger.log(`Email de registro pendiente enviado a: ${to} (ID: ${data?.id})`);
    } catch (error) {
      this.logger.error(`Error enviando email de registro pendiente a ${to}:`, error);
    }
  }

  /**
   * Envía email a todos los administradores notificando un nuevo registro por aprobar
   */
  async sendNewRegistrationNotificationToAdmins(
    adminEmails: string[],
    userData: NewUserData,
  ): Promise<void> {
    if (adminEmails.length === 0) {
      this.logger.warn('No hay administradores activos para notificar');
      return;
    }

    const reviewLink = `${this.env.FRONTEND_URL}/admin/users`;

    for (const adminEmail of adminEmails) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: `${this.env.RESEND_FROM_NAME} <${this.env.RESEND_FROM_EMAIL}>`,
          to: adminEmail,
          subject: 'Nuevo registro pendiente de aprobación - High Ticket USA',
          html: await this.getNewRegistrationAdminTemplate(userData, reviewLink),
        });

        if (error) {
          this.logger.error(
            `Error de Resend enviando notificación al admin ${adminEmail}:`,
            JSON.stringify(error),
          );
        } else {
          this.logger.log(
            `Notificación de nuevo registro enviada a: ${adminEmail} (ID: ${data?.id})`,
          );
        }
      } catch (error) {
        this.logger.error(`Error enviando notificación al admin ${adminEmail}:`, error);
      }
    }
  }

  /**
   * Envía email al usuario notificando que su registro fue aprobado
   */
  async sendRegistrationApprovedEmail(to: string, firstName: string): Promise<void> {
    try {
      const loginLink = `${this.env.FRONTEND_URL}/login`;

      const { data, error } = await this.resend.emails.send({
        from: `${this.env.RESEND_FROM_NAME} <${this.env.RESEND_FROM_EMAIL}>`,
        to,
        subject: '¡Tu cuenta ha sido aprobada! - High Ticket USA',
        html: await this.getRegistrationApprovedTemplate(firstName, loginLink),
      });

      if (error) {
        this.logger.error(
          `Error de Resend enviando email de aprobación a ${to}:`,
          JSON.stringify(error),
        );
        throw new Error('Error al enviar email');
      }

      this.logger.log(`Email de aprobación enviado a: ${to} (ID: ${data?.id})`);
    } catch (error) {
      this.logger.error(`Error enviando email de aprobación a ${to}:`, error);
    }
  }

  /**
   * Envía email al usuario notificando que su registro fue rechazado
   */
  async sendRegistrationRejectedEmail(
    to: string,
    firstName: string,
    reason?: string,
  ): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.env.RESEND_FROM_NAME} <${this.env.RESEND_FROM_EMAIL}>`,
        to,
        subject: 'Actualización sobre tu registro - High Ticket USA',
        html: await this.getRegistrationRejectedTemplate(firstName, reason),
      });

      if (error) {
        this.logger.error(
          `Error de Resend enviando email de rechazo a ${to}:`,
          JSON.stringify(error),
        );
        throw new Error('Error al enviar email');
      }

      this.logger.log(`Email de rechazo enviado a: ${to} (ID: ${data?.id})`);
    } catch (error) {
      this.logger.error(`Error enviando email de rechazo a ${to}:`, error);
    }
  }

  /**
   * Envía email al usuario notificando que su plan ha expirado
   */
  async sendPlanExpiredEmail(to: string, firstName: string, planName: string): Promise<void> {
    try {
      const loginLink = `${this.env.FRONTEND_URL}/login`;

      const { data, error } = await this.resend.emails.send({
        from: `${this.env.RESEND_FROM_NAME} <${this.env.RESEND_FROM_EMAIL}>`,
        to,
        subject: 'Tu plan ha expirado - High Ticket USA',
        html: await this.getPlanExpiredTemplate(firstName, planName, loginLink),
      });

      if (error) {
        this.logger.error(
          `Error de Resend enviando email de plan expirado a ${to}:`,
          JSON.stringify(error),
        );
        throw new Error('Error al enviar email');
      }

      this.logger.log(`Email de plan expirado enviado a: ${to} (ID: ${data?.id})`);
    } catch (error) {
      this.logger.error(`Error enviando email de plan expirado a ${to}:`, error);
    }
  }

  /**
   * Template HTML para email de recuperación de contraseña
   */
  private async getPasswordResetTemplate(firstName: string, resetLink: string): Promise<string> {
    const logoUrl = await this.getLogoUrl();
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupera tu contraseña</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 20px; text-align: center; background-color: #000000; border-radius: 8px 8px 0 0;">
              <img src="${logoUrl}" alt="High Ticket USA" style="max-width: 220px; height: auto; display: inline-block;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 24px;">
                Hola, ${firstName} 👋
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta. 
                Si no realizaste esta solicitud, puedes ignorar este correo.
              </p>
              
              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Para restablecer tu contraseña, haz clic en el siguiente botón:
              </p>
              
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" 
                       style="display: inline-block; padding: 16px 40px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                      Restablecer Contraseña
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Este enlace expirará en <strong>1 hora</strong> por seguridad.
              </p>
              
              <p style="margin: 20px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              
              <p style="margin: 10px 0 0; color: #4f46e5; font-size: 12px; word-break: break-all;">
                ${resetLink}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #888888; font-size: 12px;">
                © ${new Date().getFullYear()} High Ticket USA. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Template HTML para email de registro pendiente (al usuario)
   */
  private async getRegistrationPendingTemplate(firstName: string): Promise<string> {
    const logoUrl = await this.getLogoUrl();
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registro recibido</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 20px; text-align: center; background-color: #000000; border-radius: 8px 8px 0 0;">
              <img src="${logoUrl}" alt="High Ticket USA" style="max-width: 220px; height: auto; display: inline-block;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 24px;">
                ¡Bienvenido, ${firstName}! 🎉
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hemos recibido tu solicitud de registro en <strong>High Ticket USA</strong>.
              </p>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Tu cuenta se encuentra actualmente <strong>en período de revisión</strong>. 
                Nuestro equipo verificará tu información y te notificaremos por correo electrónico 
                una vez que tu cuenta haya sido aprobada.
              </p>
              
              <!-- Status Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      <strong>⏳ Estado: En revisión</strong><br>
                      Este proceso puede tomar entre 24 a 48 horas hábiles.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Si tienes alguna pregunta no dudes en contactarnos en <a href="mailto:info@highticketusa.com" style="color: #4f46e5;">info@highticketusa.com</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #888888; font-size: 12px;">
                © ${new Date().getFullYear()} High Ticket USA. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Template HTML para notificación de nuevo registro (al admin)
   */
  private async getNewRegistrationAdminTemplate(
    userData: NewUserData,
    reviewLink: string,
  ): Promise<string> {
    const logoUrl = await this.getLogoUrl();
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo registro pendiente</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 20px; text-align: center; background-color: #000000; border-radius: 8px 8px 0 0;">
              <img src="${logoUrl}" alt="High Ticket USA" style="max-width: 220px; height: auto; display: inline-block;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 24px;">
                Nuevo registro pendiente 📋
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Un nuevo usuario ha solicitado registro en la plataforma y está pendiente de tu aprobación.
              </p>
              
              <!-- User Info Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8f9fa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px; color: #1a1a2e; font-size: 16px;">
                      Datos del solicitante:
                    </h3>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 120px;">
                          <strong>Nombre:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #4a4a4a; font-size: 14px;">
                          ${userData.firstName} ${userData.lastName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">
                          <strong>Email:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #4a4a4a; font-size: 14px;">
                          ${userData.email}
                        </td>
                      </tr>
                      ${
                        userData.phone
                          ? `
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">
                          <strong>Teléfono:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #4a4a4a; font-size: 14px;">
                          ${userData.phone}
                        </td>
                      </tr>
                      `
                          : ''
                      }
                      ${
                        userData.city || userData.country
                          ? `
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">
                          <strong>Ubicación:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #4a4a4a; font-size: 14px;">
                          ${[userData.city, userData.country].filter(Boolean).join(', ')}
                        </td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Para revisar y aprobar o rechazar esta solicitud, haz clic en el siguiente botón:
              </p>
              
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${reviewLink}" 
                       style="display: inline-block; padding: 16px 40px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                      Revisar Solicitud
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              
              <p style="margin: 10px 0 0; color: #4f46e5; font-size: 12px; word-break: break-all;">
                ${reviewLink}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #888888; font-size: 12px;">
                © ${new Date().getFullYear()} High Ticket USA. Todos los derechos reservados.
              </p>
              <p style="margin: 10px 0 0; color: #888888; font-size: 12px;">
                Este es un correo automático del sistema de administración.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Template HTML para email de registro aprobado
   */
  private async getRegistrationApprovedTemplate(
    firstName: string,
    loginLink: string,
  ): Promise<string> {
    const logoUrl = await this.getLogoUrl();
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cuenta aprobada</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 20px; text-align: center; background-color: #000000; border-radius: 8px 8px 0 0;">
              <img src="${logoUrl}" alt="High Ticket USA" style="max-width: 220px; height: auto; display: inline-block;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 24px;">
                ¡Felicidades, ${firstName}! 🎉
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Nos complace informarte que tu cuenta en <strong>High Ticket USA</strong> ha sido <strong>aprobada</strong>.
              </p>
              
              <!-- Success Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #d1fae5; border-radius: 8px; border-left: 4px solid #10b981;">
                    <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                      <strong>✅ Estado: Cuenta activa</strong><br>
                      Ya puedes acceder a todas las funcionalidades de la plataforma.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Para comenzar, inicia sesión con tu correo electrónico y contraseña:
              </p>
              
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${loginLink}" 
                       style="display: inline-block; padding: 16px 40px; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                      Iniciar Sesión
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              
              <p style="margin: 10px 0 0; color: #4f46e5; font-size: 12px; word-break: break-all;">
                ${loginLink}
              </p>
              
              <p style="margin: 30px 0 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Si tienes alguna pregunta no dudes en contactarnos en <a href="mailto:info@highticketusa.com" style="color: #4f46e5;">info@highticketusa.com</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #888888; font-size: 12px;">
                © ${new Date().getFullYear()} High Ticket USA. Todos los derechos reservados.
              </p>
              <p style="margin: 10px 0 0; color: #888888; font-size: 12px;">
                ¡Bienvenido a nuestra comunidad!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Template HTML para email de registro rechazado
   */
  private async getRegistrationRejectedTemplate(
    firstName: string,
    reason?: string,
  ): Promise<string> {
    const logoUrl = await this.getLogoUrl();
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Actualización de registro</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 20px; text-align: center; background-color: #000000; border-radius: 8px 8px 0 0;">
              <img src="${logoUrl}" alt="High Ticket USA" style="max-width: 220px; height: auto; display: inline-block;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 24px;">
                Hola, ${firstName}
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Gracias por tu interés en unirte a <strong>High Ticket USA</strong>.
              </p>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Lamentamos informarte que después de revisar tu solicitud, no hemos podido aprobar 
                tu registro en este momento.
              </p>
              
              <!-- Rejection Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #fee2e2; border-radius: 8px; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                      <strong>❌ Estado: No aprobado</strong>
                      ${reason ? `<br><br><strong>Motivo:</strong> ${reason}` : ''}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Si tienes alguna pregunta no dudes en contactarnos en <a href="mailto:info@highticketusa.com" style="color: #4f46e5;">info@highticketusa.com</a>
              </p>
              
              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Agradecemos tu comprensión y te deseamos mucho éxito.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #888888; font-size: 12px;">
                © ${new Date().getFullYear()} High Ticket USA. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Template HTML para email de plan expirado
   */
  private async getPlanExpiredTemplate(
    firstName: string,
    planName: string,
    loginLink: string,
  ): Promise<string> {
    const logoUrl = await this.getLogoUrl();
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu plan ha expirado</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 20px; text-align: center; background-color: #000000; border-radius: 8px 8px 0 0;">
              <img src="${logoUrl}" alt="High Ticket USA" style="max-width: 220px; height: auto; display: inline-block;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 24px;">
                Hola, ${firstName} 👋
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Te informamos que tu plan <strong>${planName}</strong> en <strong>High Ticket USA</strong> ha expirado.
              </p>
              
              <!-- Expired Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      <strong>⚠️ Plan Expirado</strong><br>
                      Tu acceso al contenido de la plataforma ha sido temporalmente suspendido hasta que renueves tu plan.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Para continuar accediendo a todo el contenido de la plataforma, te invitamos a renovar tu suscripción.
              </p>
              
              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Inicia sesión para ver las opciones de renovación disponibles:
              </p>
              
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${loginLink}" 
                       style="display: inline-block; padding: 16px 40px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                      Renovar Mi Plan
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Si tienes alguna pregunta no dudes en contactarnos en <a href="mailto:info@highticketusa.com" style="color: #4f46e5;">info@highticketusa.com</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #888888; font-size: 12px;">
                © ${new Date().getFullYear()} High Ticket USA. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Envía email a todos los superadmins notificando una solicitud de upgrade de plan
   */
  async sendUpgradeRequestNotificationToAdmins(
    adminEmails: string[],
    userData: {
      firstName: string;
      lastName: string;
      email: string;
      currentPlan: string;
      message?: string;
    },
  ): Promise<void> {
    if (adminEmails.length === 0) {
      this.logger.warn('No hay superadmins para notificar solicitud de upgrade');
      return;
    }

    const reviewLink = 'https://admin.hte.syroxtech.com/subscription';

    for (const adminEmail of adminEmails) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: `${this.env.RESEND_FROM_NAME} <${this.env.RESEND_FROM_EMAIL}>`,
          to: adminEmail,
          subject: 'Solicitud de upgrade de plan - High Ticket USA',
          html: await this.getUpgradeRequestAdminTemplate(userData, reviewLink),
        });

        if (error) {
          this.logger.error(
            `Error de Resend enviando notificación de upgrade al admin ${adminEmail}:`,
            JSON.stringify(error),
          );
        } else {
          this.logger.log(`Notificación de upgrade enviada a: ${adminEmail} (ID: ${data?.id})`);
        }
      } catch (error) {
        this.logger.error(`Error enviando notificación de upgrade al admin ${adminEmail}:`, error);
      }
    }
  }

  /**
   * Template HTML para notificación de solicitud de upgrade
   */
  private async getUpgradeRequestAdminTemplate(
    userData: {
      firstName: string;
      lastName: string;
      email: string;
      currentPlan: string;
      message?: string;
    },
    reviewLink: string,
  ): Promise<string> {
    const logoUrl = await this.getLogoUrl();
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitud de upgrade de plan</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 20px; text-align: center; background-color: #000000; border-radius: 8px 8px 0 0;">
              <img src="${logoUrl}" alt="High Ticket USA" style="max-width: 220px; height: auto; display: inline-block;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 24px;">
                Solicitud de Upgrade de Plan ⬆️
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Un usuario ha solicitado un upgrade de su plan actual.
              </p>
              
              <!-- User Info Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8f9fa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 15px; color: #1a1a2e; font-size: 16px;">
                      Datos del solicitante:
                    </h3>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 120px;">
                          <strong>Nombre:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #4a4a4a; font-size: 14px;">
                          ${userData.firstName} ${userData.lastName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">
                          <strong>Email:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #4a4a4a; font-size: 14px;">
                          ${userData.email}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">
                          <strong>Plan actual:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #4a4a4a; font-size: 14px;">
                          ${userData.currentPlan}
                        </td>
                      </tr>
                      ${
                        userData.message
                          ? `
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; vertical-align: top;">
                          <strong>Mensaje:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #4a4a4a; font-size: 14px;">
                          ${userData.message}
                        </td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Para gestionar esta solicitud, haz clic en el siguiente botón:
              </p>
              
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${reviewLink}" 
                       style="display: inline-block; padding: 16px 40px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                      Gestionar Solicitud
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              
              <p style="margin: 10px 0 0; color: #4f46e5; font-size: 12px; word-break: break-all;">
                ${reviewLink}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #888888; font-size: 12px;">
                © ${new Date().getFullYear()} High Ticket USA. Todos los derechos reservados.
              </p>
              <p style="margin: 10px 0 0; color: #888888; font-size: 12px;">
                Este es un correo automático del sistema de administración.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}
