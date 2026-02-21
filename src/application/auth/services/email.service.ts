// src/application/auth/services/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { getEnvConfig } from '@/config/env.config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly env = getEnvConfig();

  constructor() {
    this.resend = new Resend(this.env.RESEND_API_KEY);
  }

  /**
   * Envía email de recuperación de contraseña
   */
  async sendPasswordResetEmail(to: string, firstName: string, resetLink: string): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: `${this.env.RESEND_FROM_NAME} <${this.env.RESEND_FROM_EMAIL}>`,
        to,
        subject: 'Recupera tu contraseña - JFalcon',
        html: this.getPasswordResetTemplate(firstName, resetLink),
      });

      if (error) {
        this.logger.error(`Error enviando email a ${to}:`, error);
        throw new Error('Error al enviar email');
      }

      this.logger.log(`Email de recuperación enviado a: ${to}`);
    } catch (error) {
      this.logger.error(`Error enviando email a ${to}:`, error);
      // No lanzar error para no revelar información
    }
  }

  /**
   * Template HTML para email de recuperación de contraseña
   */
  private getPasswordResetTemplate(firstName: string, resetLink: string): string {
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
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a1a2e; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">JFalcon</h1>
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
                © ${new Date().getFullYear()} JFalcon. Todos los derechos reservados.
              </p>
              <p style="margin: 10px 0 0; color: #888888; font-size: 12px;">
                Revisa tu bandeja de spam si no encuentras este correo.
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
