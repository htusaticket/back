import { LoggerModule } from 'nestjs-pino';
import type { Params } from 'nestjs-pino';
import { getEnvConfig } from './env.config';

export function createLoggerConfig(): Params {
  const env = getEnvConfig();

  const baseConfig: Params = {
    pinoHttp: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: true,
          },
        },
      }),
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.confirmPassword',
          'req.body.oldPassword',
          'req.body.newPassword',
          'res.headers["set-cookie"]',
        ],
        censor: '[REDACTED]',
      },
      serializers: {
        req: (req: any) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
          remotePort: req.remotePort,
          userAgent: req.headers?.['user-agent'],
          correlationId: req.headers?.['x-correlation-id'],
        }),
        res: (res: any) => ({
          statusCode: res.statusCode,
          responseTime: res.responseTime,
        }),
        err: (err: any) => ({
          type: err.type,
          message: err.message,
          stack: env.NODE_ENV === 'development' ? err.stack : undefined,
        }),
      },
      customLogLevel: (req: any, res: any, err: any) => {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          return 'warn';
        }
        if (res.statusCode >= 500 || err) {
          return 'error';
        }
        return 'info';
      },
      customSuccessMessage: (req: any, res: any) => {
        return `${req.method} ${req.url} - ${res.statusCode}`;
      },
      customErrorMessage: (req: any, res: any, err: any) => {
        return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
      },
    },
  };

  return baseConfig;
}

export const LoggerConfigModule = LoggerModule.forRootAsync({
  useFactory: () => createLoggerConfig(),
});
