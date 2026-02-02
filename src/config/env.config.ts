import { z } from 'zod';

const EnvSchema = z.object({
  // Configuración del entorno
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  // Base de datos
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres para seguridad'),
  JWT_EXPIRES_IN: z.string().default('1d'),

  // Auth
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  // CORS
  HOSTS_WHITE_LIST: z.string().optional(),

  // Configuraciones opcionales para producción
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  // Sentry para monitoreo de errores
  SENTRY_DSN: z.string().url().optional(),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

let cachedEnv: EnvConfig | null = null;

export function validateEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = EnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Configuración de variables de entorno inválida:');
    console.error(parsed.error.format());
    process.exit(1);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getEnvConfig(): EnvConfig {
  if (!cachedEnv) {
    throw new Error('Las variables de entorno no han sido validadas. Llama validateEnv() primero.');
  }
  return cachedEnv;
}
