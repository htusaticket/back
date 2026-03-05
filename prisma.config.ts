import * as dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

export default {
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'npx ts-node prisma/seed.ts',
  },
};
