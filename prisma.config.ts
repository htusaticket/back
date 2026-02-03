import 'dotenv/config';

export default {
  datasource: {
    url: process.env.DATABASE_URL,
    // directUrl: process.env.DIRECT_URL,
  },
  migrations: {
    seed: 'npx ts-node prisma/seed.ts',
  },
};
